import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const REPOSITORY_ROOT = process.cwd();
const API_ROOT = resolve(REPOSITORY_ROOT, 'app/api');
const MIDDLEWARE_POLICY = resolve(REPOSITORY_ROOT, 'lib/middleware.ts');

const PUBLIC_API_PREFIXES = [
  '/api/auth/',
  '/api/health',
  '/api/maps/',
  '/api/weather',
  '/api/cron/',
  '/api/security/rate-limit/cleanup',
  '/api/csp-report',
  '/api/webauthn/authenticate/',
] as const;

const AUTH_EVIDENCE_PATTERNS = [
  /\brequireAuth\s*\(/,
  /\brequireAuthWithRateLimit\s*\(/,
  /\bauth\.getUser\s*\(/,
  /\bCRON_SECRET\b/,
  /\bADMIN_SECRET_TOKEN\b/,
] as const;

interface ImportedSymbol {
  modulePath: string;
  exportedName: string;
}

interface CoverageResult {
  routePath: string;
  routeFile: string;
  evidenceFiles: string[];
  covered: boolean;
}

function enumerateRouteFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? enumerateRouteFiles(path) : [path];
    })
    .filter((path) => path.endsWith('/route.ts'))
    .sort();
}

function toRoutePath(routeFile: string): string {
  return routeFile
    .slice(REPOSITORY_ROOT.length)
    .replace(/^\/app/, '')
    .replace(/\/route\.ts$/, '');
}

function hasAuthEvidence(source: string): boolean {
  return AUTH_EVIDENCE_PATTERNS.some((pattern) => pattern.test(source));
}

function resolveProjectModule(specifier: string, importerFile: string): string | null {
  if (!specifier.startsWith('@/') && !specifier.startsWith('.')) {
    return null;
  }

  const basePath = specifier.startsWith('@/')
    ? resolve(REPOSITORY_ROOT, specifier.slice(2))
    : resolve(importerFile, '..', specifier);
  const candidates = [`${basePath}.ts`, `${basePath}.tsx`, resolve(basePath, 'index.ts')];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function directImportedSymbols(routeFile: string, source: string): ImportedSymbol[] {
  const sourceFile = ts.createSourceFile(routeFile, source, ts.ScriptTarget.Latest, true);
  const imports: ImportedSymbol[] = [];

  sourceFile.forEachChild((node) => {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) {
      return;
    }

    const modulePath = resolveProjectModule(node.moduleSpecifier.text, routeFile);
    const importClause = node.importClause;
    if (!modulePath || !importClause) {
      return;
    }

    if (importClause.name) {
      imports.push({ modulePath, exportedName: 'default' });
    }

    if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
      for (const element of importClause.namedBindings.elements) {
        imports.push({
          modulePath,
          exportedName: element.propertyName?.text ?? element.name.text,
        });
      }
    }
  });

  return imports;
}

function exportedSymbolSource(modulePath: string, exportedName: string): string | null {
  const source = readFileSync(modulePath, 'utf8');
  const sourceFile = ts.createSourceFile(modulePath, source, ts.ScriptTarget.Latest, true);

  for (const statement of sourceFile.statements) {
    if (
      exportedName !== 'default' &&
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === exportedName
    ) {
      return statement.getText(sourceFile);
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.name.text === exportedName) {
          return declaration.getText(sourceFile);
        }
      }
    }

    if (
      exportedName === 'default' &&
      ts.isExportAssignment(statement) &&
      !statement.isExportEquals
    ) {
      return statement.getText(sourceFile);
    }
  }

  return null;
}

function inspectRoute(routeFile: string): CoverageResult {
  const routeSource = readFileSync(routeFile, 'utf8');
  const routePath = toRoutePath(routeFile);
  const evidenceFiles = [routeFile];

  if (hasAuthEvidence(routeSource)) {
    return { routePath, routeFile, evidenceFiles, covered: true };
  }

  for (const importedSymbol of directImportedSymbols(routeFile, routeSource)) {
    const symbolSource = exportedSymbolSource(
      importedSymbol.modulePath,
      importedSymbol.exportedName,
    );
    if (symbolSource && hasAuthEvidence(symbolSource)) {
      evidenceFiles.push(importedSymbol.modulePath);
      return { routePath, routeFile, evidenceFiles, covered: true };
    }
  }

  return { routePath, routeFile, evidenceFiles, covered: false };
}

function publicPrefixesInMiddleware(): string[] {
  const source = readFileSync(MIDDLEWARE_POLICY, 'utf8');
  const sourceFile = ts.createSourceFile(MIDDLEWARE_POLICY, source, ts.ScriptTarget.Latest, true);
  const policyFunction = sourceFile.statements.find(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement) && statement.name?.text === 'isPublicApiPath',
  );
  const policySource = policyFunction?.getText(sourceFile) ?? '';

  return [...policySource.matchAll(/path\.startsWith\('([^']+)'\)/g)]
    .map((match) => match[1])
    .filter((path): path is string => path?.startsWith('/api/') ?? false);
}

describe('API authentication coverage inventory', () => {
  it('keeps the independently maintained public allowlist aligned with middleware policy', () => {
    expect(publicPrefixesInMiddleware()).toEqual([...PUBLIC_API_PREFIXES]);
  });

  it('requires explicit auth evidence for every API route outside the public allowlist', () => {
    const protectedRoutes = enumerateRouteFiles(API_ROOT)
      .map(inspectRoute)
      .filter(
        ({ routePath }) => !PUBLIC_API_PREFIXES.some((prefix) => routePath.startsWith(prefix)),
      );
    const uncoveredRoutes = protectedRoutes.filter(({ covered }) => !covered);

    if (uncoveredRoutes.length > 0) {
      const details = uncoveredRoutes
        .map(
          ({ routePath, routeFile }) =>
            `- ${routePath} (${routeFile.slice(REPOSITORY_ROOT.length + 1)}): add requireAuth(), ` +
            'requireAuthWithRateLimit(), auth.getUser(), CRON_SECRET, or ADMIN_SECRET_TOKEN ' +
            'in the route or a directly imported shared handler',
        )
        .join('\n');
      throw new Error(`Protected API routes without explicit auth evidence:\n${details}`);
    }

    expect(protectedRoutes.length).toBeGreaterThan(0);
  });
});

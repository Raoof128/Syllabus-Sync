import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface SourceLoader {
  read(filePath: string): string;
  resolve(importerPath: string, specifier: string): string | null;
}

export interface MethodCoverage {
  method: HttpMethod;
  covered: boolean;
  evidence?: string;
}

interface CallableTarget {
  filePath: string;
  symbolName: string;
}

interface ImportTarget {
  filePath: string | null;
  symbolName: string;
  specifier: string;
}

interface ModuleInfo {
  sourceFile: ts.SourceFile;
  callables: Map<string, ts.FunctionLikeDeclaration>;
  aliases: Map<string, string>;
  imports: Map<string, ImportTarget>;
  exports: Map<string, CallableTarget>;
}

type ReturnClassification = 'guarded' | 'denied' | 'uncovered';

export function createFilesystemLoader(repositoryRoot: string): SourceLoader {
  return {
    read(filePath) {
      return readFileSync(filePath, 'utf8');
    },
    resolve(importerPath, specifier) {
      if (!specifier.startsWith('@/') && !specifier.startsWith('.')) {
        return null;
      }

      const basePath = specifier.startsWith('@/')
        ? resolve(repositoryRoot, specifier.slice(2))
        : resolve(dirname(importerPath), specifier);
      const candidates = [
        `${basePath}.ts`,
        `${basePath}.tsx`,
        resolve(basePath, 'index.ts'),
        resolve(basePath, 'index.tsx'),
      ];
      return candidates.find((candidate) => existsSync(candidate)) ?? null;
    },
  };
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return Boolean(ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((m) => m.kind === kind));
}

function isFunctionLikeExpression(
  node: ts.Node | undefined,
): node is ts.FunctionExpression | ts.ArrowFunction {
  return Boolean(node && (ts.isFunctionExpression(node) || ts.isArrowFunction(node)));
}

function unwrapExpression(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAwaitExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isNonNullExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function calledIdentifier(expression: ts.Expression): string | null {
  const unwrapped = unwrapExpression(expression);
  if (ts.isIdentifier(unwrapped)) return unwrapped.text;
  return null;
}

function containsNode(root: ts.Node, predicate: (node: ts.Node) => boolean): boolean {
  let found = false;
  const visit = (node: ts.Node) => {
    if (found) return;
    if (node !== root && (ts.isFunctionDeclaration(node) || isFunctionLikeExpression(node))) {
      return;
    }
    if (predicate(node)) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return found;
}

function collectBindingNames(name: ts.BindingName): string[] {
  if (ts.isIdentifier(name)) return [name.text];
  return name.elements.flatMap((element) =>
    ts.isOmittedExpression(element) ? [] : collectBindingNames(element.name),
  );
}

function returnExpressions(node: ts.FunctionLikeDeclaration): ts.Expression[] {
  if (!node.body) return [];
  if (!ts.isBlock(node.body)) return [node.body];

  const expressions: ts.Expression[] = [];
  const visit = (child: ts.Node) => {
    if (
      child !== node.body &&
      (ts.isFunctionDeclaration(child) || isFunctionLikeExpression(child))
    ) {
      return;
    }
    if (ts.isReturnStatement(child) && child.expression) expressions.push(child.expression);
    ts.forEachChild(child, visit);
  };
  visit(node.body);
  return expressions;
}

function bindingIdentifierForProperty(
  pattern: ts.ObjectBindingPattern,
  propertyName: string,
): ts.Identifier | ts.ObjectBindingPattern | null {
  for (const element of pattern.elements) {
    if (ts.isOmittedExpression(element)) continue;
    const name = element.propertyName ?? element.name;
    const key = ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : null;
    if (key !== propertyName) continue;
    if (ts.isIdentifier(element.name) || ts.isObjectBindingPattern(element.name)) {
      return element.name;
    }
  }
  return null;
}

function numericStatusFromOptions(expression: ts.Expression | undefined): number | null {
  if (!expression || !ts.isObjectLiteralExpression(unwrapExpression(expression))) return null;
  const object = unwrapExpression(expression) as ts.ObjectLiteralExpression;
  const status = object.properties.find(
    (property): property is ts.PropertyAssignment =>
      ts.isPropertyAssignment(property) &&
      ((ts.isIdentifier(property.name) && property.name.text === 'status') ||
        (ts.isStringLiteral(property.name) && property.name.text === 'status')),
  );
  return status && ts.isNumericLiteral(unwrapExpression(status.initializer))
    ? Number((unwrapExpression(status.initializer) as ts.NumericLiteral).text)
    : null;
}

function flattenOrExpression(expression: ts.Expression): ts.Expression[] {
  const unwrapped = unwrapExpression(expression);
  if (
    ts.isBinaryExpression(unwrapped) &&
    unwrapped.operatorToken.kind === ts.SyntaxKind.BarBarToken
  ) {
    return [...flattenOrExpression(unwrapped.left), ...flattenOrExpression(unwrapped.right)];
  }
  return [unwrapped];
}

function functionRequestParameter(node: ts.FunctionLikeDeclaration): string | null {
  const parameter = node.parameters[0];
  return parameter && ts.isIdentifier(parameter.name) ? parameter.name.text : null;
}

export class ApiAuthAnalyzer {
  private readonly modules = new Map<string, ModuleInfo>();

  constructor(private readonly loader: SourceLoader) {}

  analyzeRoute(routeFile: string): MethodCoverage[] {
    const module = this.moduleInfo(routeFile);
    return HTTP_METHODS.flatMap((method) => {
      const target = module.exports.get(method);
      if (!target) return [];
      const evidence = this.analyzeTarget(target, new Set());
      return [{ method, covered: Boolean(evidence), evidence: evidence ?? undefined }];
    });
  }

  private moduleInfo(filePath: string): ModuleInfo {
    const cached = this.modules.get(filePath);
    if (cached) return cached;

    const source = this.loader.read(filePath);
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
    const info: ModuleInfo = {
      sourceFile,
      callables: new Map(),
      aliases: new Map(),
      imports: new Map(),
      exports: new Map(),
    };
    this.modules.set(filePath, info);

    for (const statement of sourceFile.statements) {
      if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
        const specifier = statement.moduleSpecifier.text;
        const importedFile = this.loader.resolve(filePath, specifier);
        if (!statement.importClause) continue;
        if (statement.importClause.name) {
          info.imports.set(statement.importClause.name.text, {
            filePath: importedFile,
            symbolName: 'default',
            specifier,
          });
        }
        const bindings = statement.importClause.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) {
          for (const element of bindings.elements) {
            info.imports.set(element.name.text, {
              filePath: importedFile,
              symbolName: element.propertyName?.text ?? element.name.text,
              specifier,
            });
          }
        }
        continue;
      }

      if (ts.isFunctionDeclaration(statement) && statement.name) {
        info.callables.set(statement.name.text, statement);
        if (hasModifier(statement, ts.SyntaxKind.ExportKeyword)) {
          info.exports.set(statement.name.text, { filePath, symbolName: statement.name.text });
        }
        continue;
      }

      if (ts.isVariableStatement(statement)) {
        const isExported = hasModifier(statement, ts.SyntaxKind.ExportKeyword);
        for (const declaration of statement.declarationList.declarations) {
          if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
          if (isFunctionLikeExpression(declaration.initializer)) {
            info.callables.set(declaration.name.text, declaration.initializer);
          } else if (ts.isIdentifier(declaration.initializer)) {
            info.aliases.set(declaration.name.text, declaration.initializer.text);
          }
          if (isExported) {
            info.exports.set(declaration.name.text, {
              filePath,
              symbolName: declaration.name.text,
            });
          }
        }
        continue;
      }

      if (
        ts.isExportDeclaration(statement) &&
        statement.exportClause &&
        ts.isNamedExports(statement.exportClause)
      ) {
        const reexportFile =
          statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
            ? this.loader.resolve(filePath, statement.moduleSpecifier.text)
            : null;
        for (const element of statement.exportClause.elements) {
          const exportedName = element.name.text;
          const sourceName = element.propertyName?.text ?? element.name.text;
          info.exports.set(exportedName, {
            filePath: reexportFile ?? filePath,
            symbolName: sourceName,
          });
        }
      }
    }

    return info;
  }

  private resolveTarget(
    target: CallableTarget,
    seen: Set<string>,
  ): { node: ts.FunctionLikeDeclaration; filePath: string } | null {
    const key = `${target.filePath}#${target.symbolName}`;
    if (seen.has(key)) return null;
    seen.add(key);

    const module = this.moduleInfo(target.filePath);
    const callable = module.callables.get(target.symbolName);
    if (callable) return { node: callable, filePath: target.filePath };

    const alias = module.aliases.get(target.symbolName);
    if (alias) return this.resolveTarget({ filePath: target.filePath, symbolName: alias }, seen);

    const imported = module.imports.get(target.symbolName);
    if (imported?.filePath) {
      return this.resolveTarget(
        { filePath: imported.filePath, symbolName: imported.symbolName },
        seen,
      );
    }

    const exported = module.exports.get(target.symbolName);
    if (
      exported &&
      (exported.filePath !== target.filePath || exported.symbolName !== target.symbolName)
    ) {
      return this.resolveTarget(exported, seen);
    }
    return null;
  }

  private identifierHasLocalShadow(identifier: ts.Identifier, name: string): boolean {
    let current: ts.Node = identifier;
    while (current.parent && !ts.isSourceFile(current.parent)) {
      const parent = current.parent;
      if (
        ts.isFunctionDeclaration(parent) ||
        ts.isFunctionExpression(parent) ||
        ts.isArrowFunction(parent) ||
        ts.isMethodDeclaration(parent)
      ) {
        if (parent.parameters.some((parameter) => collectBindingNames(parameter.name).includes(name))) {
          return true;
        }
      }
      if (ts.isBlock(parent)) {
        for (const statement of parent.statements) {
          if (ts.isVariableStatement(statement)) {
            if (
              statement.declarationList.declarations.some((declaration) =>
                collectBindingNames(declaration.name).includes(name),
              )
            ) {
              return true;
            }
          }
          if (
            (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
            statement.name?.text === name
          ) {
            return true;
          }
        }
      }
      if (
        ts.isCatchClause(parent) &&
        parent.variableDeclaration &&
        collectBindingNames(parent.variableDeclaration.name).includes(name)
      ) {
        return true;
      }
      current = parent;
    }
    return false;
  }

  private resolveImportBinding(identifier: ts.Identifier, filePath: string): ImportTarget | null {
    if (this.identifierHasLocalShadow(identifier, identifier.text)) return null;
    const module = this.moduleInfo(filePath);
    let name = identifier.text;
    const seen = new Set<string>();
    while (!seen.has(name)) {
      seen.add(name);
      const imported = module.imports.get(name);
      if (imported) return imported;
      const alias = module.aliases.get(name);
      if (!alias) return null;
      name = alias;
    }
    return null;
  }

  private identifierIsTrustedImport(
    identifier: ts.Identifier,
    filePath: string,
    specifier: string,
    symbols: readonly string[],
  ): boolean {
    const imported = this.resolveImportBinding(identifier, filePath);
    return Boolean(
      imported && imported.specifier === specifier && symbols.includes(imported.symbolName),
    );
  }

  private identifierIsUnshadowedGlobal(
    identifier: ts.Identifier,
    filePath: string,
    globalName: string,
  ): boolean {
    if (identifier.text !== globalName || this.identifierHasLocalShadow(identifier, globalName)) {
      return false;
    }
    const module = this.moduleInfo(filePath);
    return (
      !module.imports.has(globalName) &&
      !module.aliases.has(globalName) &&
      !module.callables.has(globalName)
    );
  }

  private callIsTrustedImport(
    call: ts.CallExpression,
    filePath: string,
    specifier: string,
    symbols: readonly string[],
  ): boolean {
    const expression = unwrapExpression(call.expression);
    return (
      ts.isIdentifier(expression) &&
      this.identifierIsTrustedImport(expression, filePath, specifier, symbols)
    );
  }

  private isTrustedDenialExpression(
    expression: ts.Expression,
    filePath: string,
    authOnly: boolean,
  ): boolean {
    const unwrapped = unwrapExpression(expression);
    let status: number | null = null;

    if (ts.isCallExpression(unwrapped)) {
      const callee = unwrapExpression(unwrapped.expression);
      if (ts.isIdentifier(callee)) {
        const imported = this.resolveImportBinding(callee, filePath);
        if (imported?.specifier === '@/app/api/_lib/response') {
          if (imported.symbolName === 'jsonUnauthorized') status = 401;
          if (
            imported.symbolName === 'jsonError' &&
            unwrapped.arguments[1] &&
            ts.isNumericLiteral(unwrapExpression(unwrapped.arguments[1]))
          ) {
            status = Number(
              (unwrapExpression(unwrapped.arguments[1]) as ts.NumericLiteral).text,
            );
          }
        }
      } else if (
        ts.isPropertyAccessExpression(callee) &&
        callee.name.text === 'json' &&
        ts.isIdentifier(callee.expression) &&
        this.identifierIsTrustedImport(callee.expression, filePath, 'next/server', [
          'NextResponse',
        ])
      ) {
        status = numericStatusFromOptions(unwrapped.arguments[1]);
      }
    } else if (ts.isNewExpression(unwrapped)) {
      const constructor = unwrapExpression(unwrapped.expression);
      if (
        ts.isIdentifier(constructor) &&
        this.identifierIsTrustedImport(constructor, filePath, 'next/server', ['NextResponse'])
      ) {
        status = numericStatusFromOptions(unwrapped.arguments?.[1]);
      }
    }

    return status !== null && (authOnly ? status === 401 || status === 403 : status >= 400);
  }

  private statementReturnsTrustedDenial(
    statement: ts.Statement,
    filePath: string,
    authOnly: boolean,
  ): boolean {
    if (ts.isReturnStatement(statement)) {
      return Boolean(
        statement.expression &&
          this.isTrustedDenialExpression(statement.expression, filePath, authOnly),
      );
    }
    if (ts.isBlock(statement)) {
      return (
        statement.statements.length > 0 &&
        statement.statements.every((child) =>
          this.statementReturnsTrustedDenial(child, filePath, authOnly),
        )
      );
    }
    return false;
  }

  private statementHasUncoveredReturn(statement: ts.Statement, filePath: string): boolean {
    return containsNode(statement, (node) =>
      ts.isReturnStatement(node)
        ? !node.expression || !this.isTrustedDenialExpression(node.expression, filePath, false)
        : false,
    );
  }

  private hasTrustedServerClientDeclaration(
    authStatement: ts.Statement,
    clientName: string,
    filePath: string,
  ): boolean {
    if (!ts.isBlock(authStatement.parent)) return false;
    const statements = [...authStatement.parent.statements];
    const statementIndex = statements.indexOf(authStatement);
    if (statementIndex < 0) return false;

    for (let index = statementIndex - 1; index >= 0; index -= 1) {
      const statement = statements[index];
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || declaration.name.text !== clientName) continue;
        if (!declaration.initializer) return false;
        const initializer = unwrapExpression(declaration.initializer);
        return (
          ts.isCallExpression(initializer) &&
          this.callIsTrustedImport(initializer, filePath, '@/lib/supabase/server', [
            'createServerClient',
          ])
        );
      }
    }
    return false;
  }

  private authResultDeclaration(
    statement: ts.Statement,
    filePath: string,
  ): { userName: string; errorName: string } | null {
    if (!ts.isVariableStatement(statement)) return null;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isObjectBindingPattern(declaration.name) || !declaration.initializer) continue;
      let initializer = declaration.initializer;
      while (ts.isParenthesizedExpression(initializer)) initializer = initializer.expression;
      if (!ts.isAwaitExpression(initializer)) continue;
      const awaited = unwrapExpression(initializer.expression);
      if (!ts.isCallExpression(awaited)) continue;
      const callee = unwrapExpression(awaited.expression);
      if (
        !ts.isPropertyAccessExpression(callee) ||
        callee.name.text !== 'getUser' ||
        !ts.isPropertyAccessExpression(callee.expression) ||
        callee.expression.name.text !== 'auth' ||
        !ts.isIdentifier(callee.expression.expression)
      ) {
        continue;
      }
      if (
        !this.hasTrustedServerClientDeclaration(
          statement,
          callee.expression.expression.text,
          filePath,
        )
      ) {
        continue;
      }

      const dataBinding = bindingIdentifierForProperty(declaration.name, 'data');
      const errorBinding = bindingIdentifierForProperty(declaration.name, 'error');
      if (!dataBinding || !ts.isObjectBindingPattern(dataBinding) || !errorBinding) continue;
      const userBinding = bindingIdentifierForProperty(dataBinding, 'user');
      if (!userBinding || !ts.isIdentifier(userBinding) || !ts.isIdentifier(errorBinding)) continue;
      return { userName: userBinding.text, errorName: errorBinding.text };
    }
    return null;
  }

  private conditionDeniesAuthFailure(
    expression: ts.Expression,
    userName: string,
    errorName: string,
  ): boolean {
    const terms = flattenOrExpression(expression);
    const deniesError = terms.some((term) => {
      const unwrapped = unwrapExpression(term);
      return ts.isIdentifier(unwrapped) && unwrapped.text === errorName;
    });
    const deniesMissingUser = terms.some((term) => {
      const unwrapped = unwrapExpression(term);
      return (
        ts.isPrefixUnaryExpression(unwrapped) &&
        unwrapped.operator === ts.SyntaxKind.ExclamationToken &&
        ts.isIdentifier(unwrapExpression(unwrapped.operand)) &&
        (unwrapExpression(unwrapped.operand) as ts.Identifier).text === userName
      );
    });
    return deniesError && deniesMissingUser;
  }

  private blockHasTrustedSessionGuard(
    block: ts.Block,
    filePath: string,
    callable: ts.FunctionLikeDeclaration,
  ): boolean {
    const statements = [...block.statements];
    for (let index = 0; index < statements.length; index += 1) {
      const statement = statements[index];
      if (
        ts.isTryStatement(statement) &&
        !statements
          .slice(0, index)
          .some((prior) => this.statementHasUncoveredReturn(prior, filePath)) &&
        this.blockHasTrustedSessionGuard(statement.tryBlock, filePath, callable)
      ) {
        return true;
      }
      const result = this.authResultDeclaration(statement, filePath);
      if (!result) continue;
      if (
        statements
          .slice(0, index)
          .some((prior) => this.statementHasUncoveredReturn(prior, filePath))
      ) {
        continue;
      }
      const guard = statements[index + 1];
      if (
        guard &&
        ts.isIfStatement(guard) &&
        this.conditionDeniesAuthFailure(guard.expression, result.userName, result.errorName) &&
        this.statementReturnsTrustedDenial(guard.thenStatement, filePath, true)
      ) {
        return true;
      }
    }
    return false;
  }

  private analyzeTarget(target: CallableTarget, stack: Set<string>): string | null {
    const key = `${target.filePath}#${target.symbolName}`;
    if (stack.has(key)) return null;
    const resolved = this.resolveTarget(target, new Set());
    if (!resolved) return null;

    const nextStack = new Set(stack).add(key);
    const body = resolved.node.body;
    if (body && ts.isBlock(body)) {
      if (this.blockHasTrustedSessionGuard(body, resolved.filePath, resolved.node)) {
        return `${resolved.filePath}: trusted auth.getUser fail-closed guard`;
      }
      if (this.blockHasTrustedInlineSecretGuard(body, resolved.filePath, resolved.node)) {
        return `${resolved.filePath}: trusted fail-closed Authorization secret guard`;
      }
      if (this.blockHasSecretPredicateGuard(body, resolved.filePath, resolved.node)) {
        return `${resolved.filePath}: reachable fail-closed secret predicate`;
      }
    }

    const returns = returnExpressions(resolved.node);
    if (returns.length === 0) return null;
    const classifications = returns.map((expression) =>
      this.classifyReturn(expression, resolved.filePath, nextStack),
    );
    if (classifications.some((value) => value === 'uncovered')) return null;
    return classifications.some((value) => value === 'guarded')
      ? `${resolved.filePath}: returned reachable auth guard`
      : null;
  }

  private classifyReturn(
    expression: ts.Expression,
    filePath: string,
    stack: Set<string>,
  ): ReturnClassification {
    const unwrapped = unwrapExpression(expression);
    if (this.isTrustedDenialExpression(unwrapped, filePath, false)) return 'denied';
    if (!ts.isCallExpression(unwrapped)) return 'uncovered';

    if (
      this.callIsTrustedImport(unwrapped, filePath, '@/app/api/_lib/middleware', [
        'requireAuth',
        'requireAuthWithRateLimit',
      ])
    ) {
      return 'guarded';
    }

    // withCSRFProtection(callback)(request) invokes the supplied callback; analyze only that
    // known higher-order wrapper rather than trusting arbitrary callback-taking functions.
    const callee = unwrapExpression(unwrapped.expression);
    if (
      ts.isCallExpression(callee) &&
      this.callIsTrustedImport(callee, filePath, '@/lib/security/csrf', ['withCSRFProtection'])
    ) {
      const callback = callee.arguments[0];
      if (callback && isFunctionLikeExpression(callback)) {
        const callbackTarget = `inline:${filePath}:${callback.pos}`;
        if (stack.has(callbackTarget)) return 'uncovered';
        const body = callback.body;
        if (
          ts.isBlock(body) &&
          (this.blockHasTrustedSessionGuard(body, filePath, callback) ||
            this.blockHasTrustedInlineSecretGuard(body, filePath, callback))
        ) {
          return 'guarded';
        }
        const callbackReturns = returnExpressions(callback);
        const callbackStack = new Set(stack).add(callbackTarget);
        const classifications = callbackReturns.map((item) =>
          this.classifyReturn(item, filePath, callbackStack),
        );
        return classifications.length > 0 &&
          !classifications.includes('uncovered') &&
          classifications.includes('guarded')
          ? 'guarded'
          : 'uncovered';
      }
    }

    const name = calledIdentifier(unwrapped.expression);
    if (!name) return 'uncovered';
    const module = this.moduleInfo(filePath);
    const imported = module.imports.get(name);
    const target = imported?.filePath
      ? { filePath: imported.filePath, symbolName: imported.symbolName }
      : { filePath, symbolName: name };
    return this.analyzeTarget(target, stack) ? 'guarded' : 'uncovered';
  }

  private secretBindingFromDeclaration(
    declaration: ts.VariableDeclaration,
    filePath: string,
  ): string | null {
    if (!ts.isIdentifier(declaration.name) || !declaration.initializer) return null;
    const initializer = unwrapExpression(declaration.initializer);
    if (
      !ts.isPropertyAccessExpression(initializer) ||
      (initializer.name.text !== 'CRON_SECRET' &&
        initializer.name.text !== 'ADMIN_SECRET_TOKEN') ||
      !ts.isPropertyAccessExpression(initializer.expression) ||
      initializer.expression.name.text !== 'env' ||
      !ts.isIdentifier(initializer.expression.expression) ||
      !this.identifierIsUnshadowedGlobal(
        initializer.expression.expression,
        filePath,
        'process',
      )
    ) {
      return null;
    }
    return declaration.name.text;
  }

  private authorizationBindingFromDeclaration(
    declaration: ts.VariableDeclaration,
    requestName: string,
  ): string | null {
    if (!ts.isIdentifier(declaration.name) || !declaration.initializer) return null;
    const initializer = unwrapExpression(declaration.initializer);
    if (!ts.isCallExpression(initializer) || initializer.arguments.length !== 1) return null;
    const callee = unwrapExpression(initializer.expression);
    const header = initializer.arguments[0];
    if (
      !ts.isPropertyAccessExpression(callee) ||
      callee.name.text !== 'get' ||
      !ts.isPropertyAccessExpression(callee.expression) ||
      callee.expression.name.text !== 'headers' ||
      !ts.isIdentifier(callee.expression.expression) ||
      callee.expression.expression.text !== requestName ||
      !ts.isStringLiteral(header) ||
      header.text.toLowerCase() !== 'authorization'
    ) {
      return null;
    }
    return declaration.name.text;
  }

  private isBearerSecretExpression(expression: ts.Expression, secretName: string): boolean {
    const unwrapped = unwrapExpression(expression);
    return (
      ts.isTemplateExpression(unwrapped) &&
      unwrapped.head.text === 'Bearer ' &&
      unwrapped.templateSpans.length === 1 &&
      unwrapped.templateSpans[0].literal.text === '' &&
      ts.isIdentifier(unwrapExpression(unwrapped.templateSpans[0].expression)) &&
      (unwrapExpression(unwrapped.templateSpans[0].expression) as ts.Identifier).text === secretName
    );
  }

  private conditionDeniesInvalidSecret(
    expression: ts.Expression,
    secretName: string,
    credentialName: string,
  ): boolean {
    const terms = flattenOrExpression(expression);
    const deniesMissingSecret = terms.some((term) => {
      const unwrapped = unwrapExpression(term);
      return (
        ts.isPrefixUnaryExpression(unwrapped) &&
        unwrapped.operator === ts.SyntaxKind.ExclamationToken &&
        ts.isIdentifier(unwrapExpression(unwrapped.operand)) &&
        (unwrapExpression(unwrapped.operand) as ts.Identifier).text === secretName
      );
    });
    const deniesMismatch = terms.some((term) => {
      const unwrapped = unwrapExpression(term);
      return (
        ts.isBinaryExpression(unwrapped) &&
        unwrapped.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken &&
        ts.isIdentifier(unwrapExpression(unwrapped.left)) &&
        (unwrapExpression(unwrapped.left) as ts.Identifier).text === credentialName &&
        this.isBearerSecretExpression(unwrapped.right, secretName)
      );
    });
    return deniesMissingSecret && deniesMismatch;
  }

  private expressionAuthorizesSecret(
    expression: ts.Expression,
    secretName: string,
    credentialName: string,
    filePath: string,
  ): boolean {
    let unwrapped = unwrapExpression(expression);
    if (
      ts.isCallExpression(unwrapped) &&
      ts.isIdentifier(unwrapExpression(unwrapped.expression)) &&
      this.identifierIsUnshadowedGlobal(
        unwrapExpression(unwrapped.expression) as ts.Identifier,
        filePath,
        'Boolean',
      ) &&
      unwrapped.arguments.length === 1
    ) {
      unwrapped = unwrapExpression(unwrapped.arguments[0]);
    }
    if (
      !ts.isBinaryExpression(unwrapped) ||
      unwrapped.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken
    ) {
      return false;
    }
    const configured = unwrapExpression(unwrapped.left);
    const comparison = unwrapExpression(unwrapped.right);
    return (
      ts.isIdentifier(configured) &&
      configured.text === secretName &&
      ts.isBinaryExpression(comparison) &&
      comparison.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken &&
      ts.isIdentifier(unwrapExpression(comparison.left)) &&
      (unwrapExpression(comparison.left) as ts.Identifier).text === credentialName &&
      this.isBearerSecretExpression(comparison.right, secretName)
    );
  }

  private blockHasTrustedInlineSecretGuard(
    block: ts.Block,
    filePath: string,
    callable: ts.FunctionLikeDeclaration,
  ): boolean {
    const requestName = functionRequestParameter(callable);
    if (!requestName) return false;
    let secretName: string | null = null;
    let credentialName: string | null = null;

    for (const statement of block.statements) {
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          const secret = this.secretBindingFromDeclaration(declaration, filePath);
          const credential = this.authorizationBindingFromDeclaration(declaration, requestName);
          if (!secret && !credential) return false;
          if ((secret && secretName) || (credential && credentialName)) return false;
          secretName = secret ?? secretName;
          credentialName = credential ?? credentialName;
        }
        continue;
      }
      return Boolean(
        secretName &&
          credentialName &&
          ts.isIfStatement(statement) &&
          this.conditionDeniesInvalidSecret(statement.expression, secretName, credentialName) &&
          this.statementReturnsTrustedDenial(statement.thenStatement, filePath, true),
      );
    }
    return false;
  }

  private blockHasSecretPredicateGuard(
    block: ts.Block,
    filePath: string,
    callable: ts.FunctionLikeDeclaration,
  ): boolean {
    const requestName = functionRequestParameter(callable);
    if (!requestName) return false;
    for (const statement of block.statements) {
      if (
        !ts.isIfStatement(statement) ||
        !this.statementReturnsTrustedDenial(statement.thenStatement, filePath, true)
      ) {
        return false;
      }
      const condition = unwrapExpression(statement.expression);
      if (
        !ts.isPrefixUnaryExpression(condition) ||
        condition.operator !== ts.SyntaxKind.ExclamationToken
      ) {
        return false;
      }
      const predicateCall = unwrapExpression(condition.operand);
      if (!ts.isCallExpression(predicateCall) || predicateCall.arguments.length !== 1) return false;
      const expression = unwrapExpression(predicateCall.expression);
      const requestArgument = unwrapExpression(predicateCall.arguments[0]);
      if (
        !ts.isIdentifier(expression) ||
        !ts.isIdentifier(requestArgument) ||
        requestArgument.text !== requestName
      ) {
        return false;
      }
      const name = expression.text;
      if (this.identifierHasLocalShadow(expression, name)) return false;
      const module = this.moduleInfo(filePath);
      const imported = module.imports.get(name);
      const target = imported?.filePath
        ? { filePath: imported.filePath, symbolName: imported.symbolName }
        : { filePath, symbolName: name };
      if (this.isFailClosedSecretPredicate(target)) return true;
      return false;
    }
    return false;
  }

  private isFailClosedSecretPredicate(target: CallableTarget): boolean {
    const resolved = this.resolveTarget(target, new Set());
    if (!resolved?.node.body || !ts.isBlock(resolved.node.body)) return false;
    const requestName = functionRequestParameter(resolved.node);
    if (!requestName) return false;
    let secretName: string | null = null;
    let credentialName: string | null = null;
    for (const statement of resolved.node.body.statements) {
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          const secret = this.secretBindingFromDeclaration(declaration, resolved.filePath);
          const credential = this.authorizationBindingFromDeclaration(declaration, requestName);
          if (!secret && !credential) return false;
          if ((secret && secretName) || (credential && credentialName)) return false;
          secretName = secret ?? secretName;
          credentialName = credential ?? credentialName;
        }
        continue;
      }
      if (!ts.isReturnStatement(statement) || !statement.expression) return false;
      return Boolean(
        secretName &&
          credentialName &&
          this.expressionAuthorizesSecret(
            statement.expression,
            secretName,
            credentialName,
            resolved.filePath,
          ),
      );
    }
    return false;
  }
}

function parsePublicExpression(expression: ts.Expression, parameterName: string): string[] {
  const unwrapped = unwrapExpression(expression);
  if (
    ts.isBinaryExpression(unwrapped) &&
    unwrapped.operatorToken.kind === ts.SyntaxKind.BarBarToken
  ) {
    return [
      ...parsePublicExpression(unwrapped.left, parameterName),
      ...parsePublicExpression(unwrapped.right, parameterName),
    ];
  }

  if (ts.isCallExpression(unwrapped) && ts.isPropertyAccessExpression(unwrapped.expression)) {
    const receiver = unwrapExpression(unwrapped.expression.expression);
    const argument = unwrapped.arguments[0];
    if (
      ts.isIdentifier(receiver) &&
      receiver.text === parameterName &&
      unwrapped.expression.name.text === 'startsWith' &&
      argument &&
      ts.isStringLiteral(argument) &&
      unwrapped.arguments.length === 1
    ) {
      return [argument.text];
    }
  }

  throw new Error(
    `Unsupported isPublicApiPath policy syntax: ${unwrapped.getText()}. ` +
      'Use only an OR-chain of path.startsWith(string literal) expressions or update the analyzer.',
  );
}

export function extractPublicApiPrefixes(policyFile: string, loader: SourceLoader): string[] {
  const source = loader.read(policyFile);
  const sourceFile = ts.createSourceFile(policyFile, source, ts.ScriptTarget.Latest, true);
  const policyFunction = sourceFile.statements.find(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement) && statement.name?.text === 'isPublicApiPath',
  );
  if (
    !policyFunction?.body ||
    !policyFunction.parameters[0] ||
    !ts.isIdentifier(policyFunction.parameters[0].name)
  ) {
    throw new Error('Unable to find a supported isPublicApiPath(path) function declaration');
  }
  const returns = policyFunction.body.statements.filter(ts.isReturnStatement);
  if (returns.length !== 1 || !returns[0].expression) {
    throw new Error('isPublicApiPath must contain exactly one explicit return expression');
  }
  return parsePublicExpression(returns[0].expression, policyFunction.parameters[0].name.text);
}

export function formatUncoveredMethods(
  routePath: string,
  routeFile: string,
  coverage: MethodCoverage[],
): string[] {
  return coverage
    .filter(({ covered }) => !covered)
    .map(
      ({ method }) =>
        `- ${method} ${routePath} (${routeFile}): return requireAuth()/` +
        'requireAuthWithRateLimit(), add a reachable fail-closed auth.getUser() check, or add ' +
        'an actual fail-closed CRON_SECRET/ADMIN_SECRET_TOKEN comparison before protected work',
    );
}

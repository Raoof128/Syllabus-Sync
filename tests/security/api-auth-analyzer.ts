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
  filePath: string;
  symbolName: string;
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
  if (ts.isPropertyAccessExpression(unwrapped)) return unwrapped.name.text;
  return null;
}

function isAuthGetUserCall(node: ts.Node): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) return false;
  const expression = unwrapExpression(node.expression);
  return (
    ts.isPropertyAccessExpression(expression) &&
    expression.name.text === 'getUser' &&
    ts.isPropertyAccessExpression(expression.expression) &&
    expression.expression.name.text === 'auth'
  );
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

function referencesNegatedIdentifier(node: ts.Node, names: Set<string>): boolean {
  return containsNode(node, (child) => {
    if (!ts.isPrefixUnaryExpression(child) || child.operator !== ts.SyntaxKind.ExclamationToken) {
      return false;
    }
    const operand = unwrapExpression(child.operand);
    return ts.isIdentifier(operand) && names.has(operand.text);
  });
}

function isDenialCall(call: ts.CallExpression): boolean {
  const name = calledIdentifier(call.expression);
  if (name === 'jsonUnauthorized' || name === 'jsonError') return true;
  if (name === 'redirect') return false;

  if (name === 'json' && ts.isPropertyAccessExpression(unwrapExpression(call.expression))) {
    const options = call.arguments[1];
    if (options && ts.isObjectLiteralExpression(options)) {
      const status = options.properties.find(
        (property): property is ts.PropertyAssignment =>
          ts.isPropertyAssignment(property) &&
          ((ts.isIdentifier(property.name) && property.name.text === 'status') ||
            (ts.isStringLiteral(property.name) && property.name.text === 'status')),
      );
      if (status && ts.isNumericLiteral(status.initializer)) {
        return Number(status.initializer.text) >= 400;
      }
    }
  }

  return false;
}

function isDenialExpression(expression: ts.Expression): boolean {
  const unwrapped = unwrapExpression(expression);
  if (ts.isCallExpression(unwrapped)) return isDenialCall(unwrapped);
  if (ts.isNewExpression(unwrapped)) {
    const options = unwrapped.arguments?.[1];
    if (options && ts.isObjectLiteralExpression(options)) {
      return containsNode(options, (node) => ts.isNumericLiteral(node) && Number(node.text) >= 400);
    }
  }
  return false;
}

function statementReturnsDenial(statement: ts.Statement): boolean {
  if (ts.isReturnStatement(statement)) {
    return Boolean(statement.expression && isDenialExpression(statement.expression));
  }
  if (ts.isBlock(statement)) {
    return statement.statements.length > 0 && statement.statements.every(statementReturnsDenial);
  }
  return false;
}

function statementHasUncoveredReturn(statement: ts.Statement): boolean {
  return containsNode(statement, (node) =>
    ts.isReturnStatement(node) ? !node.expression || !isDenialExpression(node.expression) : false,
  );
}

function findAuthBindingNames(statement: ts.Statement): Set<string> | null {
  if (!containsNode(statement, isAuthGetUserCall)) return null;

  const names = new Set<string>();
  if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      if (containsNode(declaration.initializer ?? declaration, isAuthGetUserCall)) {
        for (const name of collectBindingNames(declaration.name)) names.add(name);
      }
    }
  }
  return names.size > 0 ? names : null;
}

function blockHasSessionGuard(block: ts.Block): boolean {
  const statements = [...block.statements];
  for (let index = 0; index < statements.length; index += 1) {
    const statement = statements[index];
    const hasEarlierUncoveredReturn = statements.slice(0, index).some(statementHasUncoveredReturn);
    if (
      !hasEarlierUncoveredReturn &&
      ts.isTryStatement(statement) &&
      blockHasSessionGuard(statement.tryBlock)
    ) {
      return true;
    }

    const bindingNames = findAuthBindingNames(statement);
    if (!bindingNames || hasEarlierUncoveredReturn) continue;

    for (let guardIndex = index + 1; guardIndex < statements.length; guardIndex += 1) {
      const candidate = statements[guardIndex];
      if (ts.isReturnStatement(candidate)) break;
      if (
        ts.isIfStatement(candidate) &&
        referencesNegatedIdentifier(candidate.expression, bindingNames) &&
        statementReturnsDenial(candidate.thenStatement)
      ) {
        return true;
      }
    }
  }
  return false;
}

function envSecretBinding(
  statement: ts.Statement,
): Map<string, 'CRON_SECRET' | 'ADMIN_SECRET_TOKEN'> {
  const bindings = new Map<string, 'CRON_SECRET' | 'ADMIN_SECRET_TOKEN'>();
  if (!ts.isVariableStatement(statement)) return bindings;

  for (const declaration of statement.declarationList.declarations) {
    if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
    const initializer = unwrapExpression(declaration.initializer);
    if (
      ts.isPropertyAccessExpression(initializer) &&
      (initializer.name.text === 'CRON_SECRET' || initializer.name.text === 'ADMIN_SECRET_TOKEN') &&
      ts.isPropertyAccessExpression(initializer.expression) &&
      initializer.expression.name.text === 'env' &&
      ts.isIdentifier(initializer.expression.expression) &&
      initializer.expression.expression.text === 'process'
    ) {
      bindings.set(declaration.name.text, initializer.name.text);
    }
  }
  return bindings;
}

function expressionContainsSecretComparison(
  expression: ts.Expression,
  secretName: string,
): boolean {
  return containsNode(expression, (node) => {
    if (!ts.isBinaryExpression(node)) return false;
    if (
      node.operatorToken.kind !== ts.SyntaxKind.EqualsEqualsEqualsToken &&
      node.operatorToken.kind !== ts.SyntaxKind.ExclamationEqualsEqualsToken
    ) {
      return false;
    }
    return (
      containsNode(node.left, (child) => ts.isIdentifier(child) && child.text === secretName) ||
      containsNode(node.right, (child) => ts.isIdentifier(child) && child.text === secretName)
    );
  });
}

function blockHasInlineSecretGuard(block: ts.Block): boolean {
  const secretBindings = new Map<string, 'CRON_SECRET' | 'ADMIN_SECRET_TOKEN'>();
  const statements = [...block.statements];
  for (let index = 0; index < statements.length; index += 1) {
    const statement = statements[index];
    const hasEarlierUncoveredReturn = statements.slice(0, index).some(statementHasUncoveredReturn);
    for (const [name, secret] of envSecretBinding(statement)) secretBindings.set(name, secret);
    if (
      !hasEarlierUncoveredReturn &&
      ts.isTryStatement(statement) &&
      blockHasInlineSecretGuard(statement.tryBlock)
    ) {
      return true;
    }
    if (!ts.isIfStatement(statement) || !statementReturnsDenial(statement.thenStatement)) continue;
    if (hasEarlierUncoveredReturn) continue;

    for (const secretName of secretBindings.keys()) {
      if (
        referencesNegatedIdentifier(statement.expression, new Set([secretName])) &&
        expressionContainsSecretComparison(statement.expression, secretName)
      ) {
        return true;
      }
    }
  }
  return false;
}

function expressionRequiresSecretComparison(
  expression: ts.Expression,
  secretName: string,
): boolean {
  let unwrapped = unwrapExpression(expression);
  if (
    ts.isCallExpression(unwrapped) &&
    calledIdentifier(unwrapped.expression) === 'Boolean' &&
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
  const leftHasSecret = containsNode(
    unwrapped.left,
    (node) => ts.isIdentifier(node) && node.text === secretName,
  );
  const rightHasSecret = containsNode(
    unwrapped.right,
    (node) => ts.isIdentifier(node) && node.text === secretName,
  );
  return (
    (leftHasSecret && expressionContainsSecretComparison(unwrapped.right, secretName)) ||
    (rightHasSecret && expressionContainsSecretComparison(unwrapped.left, secretName))
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
        const importedFile = this.loader.resolve(filePath, statement.moduleSpecifier.text);
        if (!importedFile || !statement.importClause) continue;
        if (statement.importClause.name) {
          info.imports.set(statement.importClause.name.text, {
            filePath: importedFile,
            symbolName: 'default',
          });
        }
        const bindings = statement.importClause.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) {
          for (const element of bindings.elements) {
            info.imports.set(element.name.text, {
              filePath: importedFile,
              symbolName: element.propertyName?.text ?? element.name.text,
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
    if (imported) return this.resolveTarget(imported, seen);

    const exported = module.exports.get(target.symbolName);
    if (
      exported &&
      (exported.filePath !== target.filePath || exported.symbolName !== target.symbolName)
    ) {
      return this.resolveTarget(exported, seen);
    }
    return null;
  }

  private analyzeTarget(target: CallableTarget, stack: Set<string>): string | null {
    const key = `${target.filePath}#${target.symbolName}`;
    if (stack.has(key)) return null;
    const resolved = this.resolveTarget(target, new Set());
    if (!resolved) return null;

    const nextStack = new Set(stack).add(key);
    const body = resolved.node.body;
    if (body && ts.isBlock(body)) {
      if (blockHasSessionGuard(body)) return `${resolved.filePath}: auth.getUser fail-closed guard`;
      if (blockHasInlineSecretGuard(body)) return `${resolved.filePath}: fail-closed secret guard`;
      if (this.blockHasSecretPredicateGuard(body, resolved.filePath)) {
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
    if (isDenialExpression(unwrapped)) return 'denied';
    if (!ts.isCallExpression(unwrapped)) return 'uncovered';

    const directCallName = calledIdentifier(unwrapped.expression);
    const directImport = directCallName
      ? this.moduleInfo(filePath).imports.get(directCallName)
      : undefined;
    if (
      directCallName &&
      (directImport?.symbolName === 'requireAuth' ||
        directImport?.symbolName === 'requireAuthWithRateLimit') &&
      directImport.filePath.endsWith('/app/api/_lib/middleware.ts')
    ) {
      return 'guarded';
    }

    // withCSRFProtection(callback)(request) invokes the supplied callback; analyze only that
    // known higher-order wrapper rather than trusting arbitrary callback-taking functions.
    const callee = unwrapExpression(unwrapped.expression);
    if (
      ts.isCallExpression(callee) &&
      calledIdentifier(callee.expression) === 'withCSRFProtection'
    ) {
      const callback = callee.arguments[0];
      if (callback && isFunctionLikeExpression(callback)) {
        const callbackTarget = `inline:${filePath}:${callback.pos}`;
        if (stack.has(callbackTarget)) return 'uncovered';
        const body = callback.body;
        if (ts.isBlock(body) && (blockHasSessionGuard(body) || blockHasInlineSecretGuard(body))) {
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
    const target = imported ?? { filePath, symbolName: name };
    return this.analyzeTarget(target, stack) ? 'guarded' : 'uncovered';
  }

  private blockHasSecretPredicateGuard(block: ts.Block, filePath: string): boolean {
    const statements = [...block.statements];
    for (let index = 0; index < statements.length; index += 1) {
      const statement = statements[index];
      if (statements.slice(0, index).some(statementHasUncoveredReturn)) continue;
      if (!ts.isIfStatement(statement) || !statementReturnsDenial(statement.thenStatement)) {
        continue;
      }
      const condition = unwrapExpression(statement.expression);
      if (
        !ts.isPrefixUnaryExpression(condition) ||
        condition.operator !== ts.SyntaxKind.ExclamationToken
      ) {
        continue;
      }
      const predicateCall = unwrapExpression(condition.operand);
      if (!ts.isCallExpression(predicateCall)) continue;
      const name = calledIdentifier(predicateCall.expression);
      if (!name) continue;
      const module = this.moduleInfo(filePath);
      const target = module.imports.get(name) ?? { filePath, symbolName: name };
      if (this.isFailClosedSecretPredicate(target)) return true;
    }
    return false;
  }

  private isFailClosedSecretPredicate(target: CallableTarget): boolean {
    const resolved = this.resolveTarget(target, new Set());
    if (!resolved?.node.body || !ts.isBlock(resolved.node.body)) return false;
    const secretBindings = new Map<string, 'CRON_SECRET' | 'ADMIN_SECRET_TOKEN'>();
    for (const statement of resolved.node.body.statements) {
      for (const [name, secret] of envSecretBinding(statement)) secretBindings.set(name, secret);
    }
    if (secretBindings.size === 0) return false;
    const returns = returnExpressions(resolved.node);
    if (returns.length !== 1) return false;
    return [...secretBindings.keys()].some((secretName) =>
      expressionRequiresSecretComparison(returns[0], secretName),
    );
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

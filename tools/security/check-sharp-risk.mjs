#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const EXPIRY_INSTANT = Date.parse('2026-08-23T00:00:00+10:00');
const MAX_RECORDED_SEVERITY = 'high';
const SEVERITY_RANK = new Map([
  ['info', 0],
  ['low', 1],
  ['moderate', 2],
  ['high', 3],
  ['critical', 4],
]);
const SHARP_PATTERN = /(?:^|[^a-z0-9])(?:sharp|libvips|@img)(?:[^a-z0-9]|$)/i;

/** The Sharp package, or one of its `@img/*` native platform packages, on disk. */
const SHARP_PACKAGE_PATH_PATTERN = /(?:^|[\\/])node_modules[\\/](?:sharp|@img[\\/][^\\/]+)[\\/]/i;

/** A compiled libvips/Sharp native artifact, wherever it is copied. */
const SHARP_NATIVE_BINARY_PATTERN = /(?:sharp|libvips)[^\\/]*\.(?:node|wasm|dylib|so(?:\.\d+)*)$/i;

/**
 * A real module reference to Sharp that survives bundling, as opposed to the
 * word "sharp" appearing inside a string literal, CSS class, or font name.
 */
const SHARP_MODULE_SPECIFIER_PATTERN =
  /(?:require\(\s*['"`]sharp['"`]\s*\)|(?:^|[^\w])from\s*['"`]sharp['"`]|import\(\s*['"`]sharp['"`]\s*\)|['"`]@img\/sharp|node_modules[\\/]sharp[\\/]|libvips)/i;
const TOOLING_METADATA_EXTENSIONS = new Set(['.map', '.txt', '.md', '.log']);
const METAFILE_NAME_PATTERN = /(?:metafile.*\.json$|\.meta\.json$)/i;

const EVIDENCE_PATHS = {
  fullAudit: 'artifacts/security/npm-audit-full.json',
  productionAudit: 'artifacts/security/npm-audit-production.json',
  lockfile: 'package-lock.json',
  reachability: {
    preview: 'artifacts/security/sharp-worker-reachability.json',
    production: 'artifacts/security/sharp-worker-reachability.production.json',
  },
};

const BUILD_PROFILES = {
  preview: {
    command: 'npm run cf:build',
    environment: 'preview',
  },
  production: {
    command: 'npm run cf:build:production',
    environment: 'production',
  },
};

const EXPECTED_ADVISORY = {
  source: 1124066,
  name: 'sharp',
  dependency: 'sharp',
  title:
    'sharp inherited vulnerabilities in libvips: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591',
  url: 'https://github.com/advisories/GHSA-f88m-g3jw-g9cj',
  range: '<0.35.0',
};

const EXPECTED_AUDIT_CHAIN = {
  '@opennextjs/aws': {
    range: '>=3.9.13',
    nodes: ['node_modules/@opennextjs/aws'],
    via: ['next'],
    effects: ['@opennextjs/cloudflare'],
  },
  '@opennextjs/cloudflare': {
    range: '0.3.0 - 0.6.6 || >=1.2.0',
    nodes: ['node_modules/@opennextjs/cloudflare'],
    via: ['@opennextjs/aws', 'next', 'wrangler'],
    effects: [],
  },
  miniflare: {
    range: '<=0.0.0-fec45ed61 || >=4.20250508.3',
    nodes: ['node_modules/miniflare'],
    via: ['sharp'],
    effects: ['wrangler'],
  },
  next: {
    range: '9.5.6-canary.0 - 10.0.7 || >=14.3.0-canary.0',
    nodes: ['node_modules/next'],
    via: ['sharp'],
    effects: ['@opennextjs/aws', '@opennextjs/cloudflare'],
  },
  sharp: {
    range: '<0.35.0',
    nodes: ['node_modules/sharp'],
    via: [],
    effects: ['miniflare', 'next'],
  },
  wrangler: {
    range: '<=0.0.0-7ae5dd357 || >=4.16.0',
    nodes: ['node_modules/wrangler'],
    via: ['miniflare'],
    effects: ['@opennextjs/cloudflare'],
  },
};

const EXPECTED_DEPENDENCY_PATHS = [
  {
    label: 'root -> next',
    packagePath: '',
    field: 'dependencies',
    dependency: 'next',
    value: '^16.2.11',
  },
  {
    label: 'next@16.2.11 -> optional sharp',
    packagePath: 'node_modules/next',
    version: '16.2.11',
    field: 'optionalDependencies',
    dependency: 'sharp',
    value: '^0.34.5',
  },
  {
    label: 'root -> wrangler',
    packagePath: '',
    field: 'devDependencies',
    dependency: 'wrangler',
    value: '^4.113.0',
  },
  {
    label: 'wrangler@4.113.0 -> miniflare',
    packagePath: 'node_modules/wrangler',
    version: '4.113.0',
    field: 'dependencies',
    dependency: 'miniflare',
    value: '4.20260721.0',
  },
  {
    label: 'miniflare@4.20260721.0 -> sharp',
    packagePath: 'node_modules/miniflare',
    version: '4.20260721.0',
    field: 'dependencies',
    dependency: 'sharp',
    value: '0.34.5',
  },
  {
    label: 'installed sharp',
    packagePath: 'node_modules/sharp',
    version: '0.34.5',
  },
];

const EXPECTED_PROVENANCE = [
  {
    label: 'Next 16.2.11',
    packagePath: 'node_modules/next',
    version: '16.2.11',
    resolved: 'https://registry.npmjs.org/next/-/next-16.2.11.tgz',
    integrity:
      'sha512-B339zaqbyK8cmxhoAvLrcwoabwCP1wz21zSzfqxqXAemTu2BXnH7tQnfcglKv1vnMUIDBc+Hth7XODQriTZiRQ==',
  },
  {
    label: 'OpenNext Cloudflare 1.20.2',
    packagePath: 'node_modules/@opennextjs/cloudflare',
    version: '1.20.2',
    resolved: 'https://registry.npmjs.org/@opennextjs/cloudflare/-/cloudflare-1.20.2.tgz',
    integrity:
      'sha512-iFBjABnaDk3be27F5EpxyMLMGPbVnnArFx5I3Y8Rf6BSx5nBV8h0UuJiMKrx3+whDU5ahIy4d8sfbvWvMiF1Kg==',
  },
  {
    label: 'Wrangler 4.113.0',
    packagePath: 'node_modules/wrangler',
    version: '4.113.0',
    resolved: 'https://registry.npmjs.org/wrangler/-/wrangler-4.113.0.tgz',
    integrity:
      'sha512-ROGzSloJv0y21It6Oc9LaruNcu1tdiQ/XzL3Jc3YkFjzXEMXzTqVhA8vQaGMTdZHTjFP0PVcwAHNgaw3gXu4wA==',
  },
];

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sameStringSet(actual, expected) {
  if (!Array.isArray(actual) || actual.some((value) => typeof value !== 'string')) {
    return false;
  }
  const sortedActual = [...actual].sort();
  const sortedExpected = [...expected].sort();
  return (
    sortedActual.length === sortedExpected.length &&
    sortedActual.every((value, index) => value === sortedExpected[index])
  );
}

function severityExceedsRecorded(value) {
  const rank = SEVERITY_RANK.get(value);
  return rank === undefined || rank > SEVERITY_RANK.get(MAX_RECORDED_SEVERITY);
}

function isValidFixAvailable(value) {
  return (
    typeof value === 'boolean' ||
    (isRecord(value) &&
      typeof value.name === 'string' &&
      typeof value.version === 'string' &&
      typeof value.isSemVerMajor === 'boolean')
  );
}

function validateAdvisoryObject(label, packageName, entry, errors) {
  if (
    !Number.isInteger(entry.source) ||
    typeof entry.name !== 'string' ||
    typeof entry.dependency !== 'string' ||
    typeof entry.title !== 'string' ||
    typeof entry.url !== 'string' ||
    !SEVERITY_RANK.has(entry.severity) ||
    !Array.isArray(entry.cwe) ||
    entry.cwe.some((value) => typeof value !== 'string') ||
    !isRecord(entry.cvss) ||
    typeof entry.cvss.score !== 'number' ||
    !(entry.cvss.vectorString === null || typeof entry.cvss.vectorString === 'string') ||
    typeof entry.range !== 'string'
  ) {
    errors.push(`${label} audit advisory object is malformed for ${packageName}.`);
  }
}

function validateVulnerabilityEntry(label, packageName, vulnerability, errors) {
  if (
    !isRecord(vulnerability) ||
    vulnerability.name !== packageName ||
    !SEVERITY_RANK.has(vulnerability.severity) ||
    typeof vulnerability.isDirect !== 'boolean' ||
    !Array.isArray(vulnerability.via) ||
    !Array.isArray(vulnerability.effects) ||
    vulnerability.effects.some((value) => typeof value !== 'string') ||
    typeof vulnerability.range !== 'string' ||
    !Array.isArray(vulnerability.nodes) ||
    vulnerability.nodes.length === 0 ||
    vulnerability.nodes.some((value) => typeof value !== 'string') ||
    !isValidFixAvailable(vulnerability.fixAvailable)
  ) {
    errors.push(`${label} audit vulnerability entry is malformed for ${packageName}.`);
    return false;
  }

  for (const via of vulnerability.via) {
    if (typeof via === 'string') {
      continue;
    }
    if (!isRecord(via)) {
      errors.push(`${label} audit via member is malformed for ${packageName}.`);
      continue;
    }
    validateAdvisoryObject(label, packageName, via, errors);
  }
  return true;
}

function findSharpLinkedPackages(vulnerabilities) {
  const linked = new Set(['sharp']);
  for (const [packageName, vulnerability] of Object.entries(vulnerabilities)) {
    if (!isRecord(vulnerability) || !Array.isArray(vulnerability.via)) continue;
    if (
      vulnerability.via.some(
        (via) =>
          isRecord(via) &&
          (via.source === EXPECTED_ADVISORY.source ||
            via.name === 'sharp' ||
            via.dependency === 'sharp' ||
            via.url === EXPECTED_ADVISORY.url),
      )
    ) {
      linked.add(packageName);
    }
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const [packageName, vulnerability] of Object.entries(vulnerabilities)) {
      if (
        linked.has(packageName) ||
        !isRecord(vulnerability) ||
        !Array.isArray(vulnerability.via)
      ) {
        continue;
      }
      if (vulnerability.via.some((via) => typeof via === 'string' && linked.has(via))) {
        linked.add(packageName);
        changed = true;
      }
    }
  }
  return linked;
}

function validateAudit(label, audit, errors) {
  if (
    !isRecord(audit) ||
    audit.auditReportVersion !== 2 ||
    !isRecord(audit.vulnerabilities) ||
    !isRecord(audit.metadata) ||
    !isRecord(audit.metadata.vulnerabilities)
  ) {
    errors.push(`${label} audit evidence is missing or malformed.`);
    return { unrelatedAdvisorySources: [] };
  }

  for (const [packageName, vulnerability] of Object.entries(audit.vulnerabilities)) {
    validateVulnerabilityEntry(label, packageName, vulnerability, errors);
  }

  const counts = { info: 0, low: 0, moderate: 0, high: 0, critical: 0 };
  for (const vulnerability of Object.values(audit.vulnerabilities)) {
    if (isRecord(vulnerability) && SEVERITY_RANK.has(vulnerability.severity)) {
      counts[vulnerability.severity] += 1;
    }
  }
  const metadataCounts = audit.metadata.vulnerabilities;
  const countsMatch =
    Object.entries(counts).every(([severity, count]) => metadataCounts[severity] === count) &&
    metadataCounts.total === Object.keys(audit.vulnerabilities).length;
  if (!countsMatch) {
    errors.push(`${label} audit metadata counts do not match the vulnerability graph.`);
  }

  const linked = findSharpLinkedPackages(audit.vulnerabilities);
  const expectedPackages = Object.keys(EXPECTED_AUDIT_CHAIN);
  if (!sameStringSet([...linked], expectedPackages)) {
    errors.push(
      `${label} audit Sharp-linked graph differs from the exact allowlist: ${[...linked].sort().join(', ')}.`,
    );
  }

  const linkedSources = [];
  for (const packageName of linked) {
    const vulnerability = audit.vulnerabilities[packageName];
    const expected = EXPECTED_AUDIT_CHAIN[packageName];
    if (!isRecord(vulnerability) || !expected) continue;

    if (severityExceedsRecorded(vulnerability.severity)) {
      errors.push(`${label} audit severity for ${packageName} exceeds recorded high severity.`);
    }
    if (vulnerability.range !== expected.range) {
      errors.push(`${label} audit vulnerable range drifted for ${packageName}.`);
    }
    if (!sameStringSet(vulnerability.nodes, expected.nodes)) {
      errors.push(`${label} audit node paths drifted for ${packageName}.`);
    }
    const viaPackages = vulnerability.via.filter((entry) => typeof entry === 'string');
    const viaObjects = vulnerability.via.filter(isRecord);
    if (viaPackages.length + viaObjects.length !== vulnerability.via.length) {
      errors.push(`${label} audit via evidence is malformed for ${packageName}.`);
    }
    if (!sameStringSet(viaPackages, expected.via)) {
      errors.push(`${label} audit dependency path drifted for ${packageName}.`);
    }
    if (!sameStringSet(vulnerability.effects, expected.effects)) {
      errors.push(`${label} audit effects edges drifted for ${packageName}.`);
    }
    for (const entry of viaObjects) {
      linkedSources.push(entry.source);
      if (
        entry.source !== EXPECTED_ADVISORY.source ||
        entry.name !== EXPECTED_ADVISORY.name ||
        entry.dependency !== EXPECTED_ADVISORY.dependency ||
        entry.title !== EXPECTED_ADVISORY.title ||
        entry.url !== EXPECTED_ADVISORY.url ||
        entry.range !== EXPECTED_ADVISORY.range
      ) {
        errors.push(`${label} audit contains changed Sharp advisory metadata.`);
      }
      if (severityExceedsRecorded(entry.severity)) {
        errors.push(`${label} audit Sharp advisory severity increased above high.`);
      }
    }
  }
  if (linkedSources.length !== 1 || linkedSources[0] !== EXPECTED_ADVISORY.source) {
    errors.push(
      `${label} audit Sharp advisory source IDs differ from sole source ${EXPECTED_ADVISORY.source}.`,
    );
  }

  for (const packageName of linked) {
    const vulnerability = audit.vulnerabilities[packageName];
    if (!isRecord(vulnerability) || !Array.isArray(vulnerability.via)) continue;
    for (const dependencyName of vulnerability.via.filter((entry) => typeof entry === 'string')) {
      const dependency = audit.vulnerabilities[dependencyName];
      if (
        !linked.has(dependencyName) ||
        !isRecord(dependency) ||
        !Array.isArray(dependency.effects) ||
        dependency.effects.filter((effect) => effect === packageName).length !== 1
      ) {
        errors.push(
          `${label} audit via edge ${packageName} -> ${dependencyName} lacks one reciprocal effects edge.`,
        );
      }
    }
    for (const effectedName of Array.isArray(vulnerability.effects) ? vulnerability.effects : []) {
      const effected = audit.vulnerabilities[effectedName];
      if (
        !linked.has(effectedName) ||
        !isRecord(effected) ||
        !Array.isArray(effected.via) ||
        effected.via.filter((via) => via === packageName).length !== 1
      ) {
        errors.push(
          `${label} audit effects edge ${packageName} -> ${effectedName} lacks one reciprocal via edge.`,
        );
      }
    }
  }

  const unrelatedAdvisorySources = [];
  for (const [packageName, vulnerability] of Object.entries(audit.vulnerabilities)) {
    if (linked.has(packageName) || !isRecord(vulnerability) || !Array.isArray(vulnerability.via)) {
      continue;
    }
    for (const via of vulnerability.via) {
      if (isRecord(via)) unrelatedAdvisorySources.push(via.source);
    }
  }
  return { unrelatedAdvisorySources };
}

function validateDependencyPaths(lockfile, errors) {
  if (!isRecord(lockfile) || lockfile.lockfileVersion !== 3 || !isRecord(lockfile.packages)) {
    errors.push('package-lock evidence is missing or malformed.');
    return;
  }
  for (const expected of EXPECTED_DEPENDENCY_PATHS) {
    const packageRecord = lockfile.packages[expected.packagePath];
    const dependencyValue = packageRecord?.[expected.field]?.[expected.dependency];
    if (
      !isRecord(packageRecord) ||
      (expected.version !== undefined && packageRecord.version !== expected.version) ||
      (expected.field !== undefined && dependencyValue !== expected.value)
    ) {
      errors.push(`Sharp dependency path changed at ${expected.label}.`);
    }
  }
  for (const expected of EXPECTED_PROVENANCE) {
    const packageRecord = lockfile.packages[expected.packagePath];
    if (
      !isRecord(packageRecord) ||
      packageRecord.version !== expected.version ||
      packageRecord.resolved !== expected.resolved ||
      packageRecord.integrity !== expected.integrity
    ) {
      errors.push(`Approved registry provenance or integrity changed for ${expected.label}.`);
    }
  }
}

function validateExpiry(now, errors) {
  const currentInstant = Date.parse(now instanceof Date ? now.toISOString() : now);
  if (!Number.isFinite(currentInstant)) {
    errors.push('Current time is invalid; the Sharp exception fails closed.');
  } else if (currentInstant >= EXPIRY_INSTANT) {
    errors.push('Sharp audit exception expired after 2026-08-22 Australia/Sydney.');
  }
}

export function evaluateAuditException({
  fullAudit,
  productionAudit,
  lockfile,
  now = new Date(),
} = {}) {
  const errors = [];
  validateExpiry(now, errors);
  const full = validateAudit('Full', fullAudit, errors);
  const production = validateAudit('Production', productionAudit, errors);
  validateDependencyPaths(lockfile, errors);
  return {
    ok: errors.length === 0,
    errors,
    unrelatedAdvisorySources: [
      ...new Set([...full.unrelatedAdvisorySources, ...production.unrelatedAdvisorySources]),
    ],
  };
}

function validateReachabilityEvidence(profile, reachability, errors) {
  const expectedProfile = BUILD_PROFILES[profile];
  if (
    !expectedProfile ||
    !isRecord(reachability) ||
    reachability.schemaVersion !== 1 ||
    typeof reachability.assessedAt !== 'string' ||
    !Number.isFinite(Date.parse(reachability.assessedAt)) ||
    reachability.runtime !== 'Node.js v22.23.1' ||
    !isRecord(reachability.build) ||
    reachability.build.profile !== profile ||
    reachability.build.environment !== expectedProfile.environment ||
    reachability.build.command !== expectedProfile.command ||
    !sameStringSet(reachability.searchedTerms, ['sharp', 'libvips', '@img']) ||
    !Array.isArray(reachability.matches) ||
    reachability.matches.some((match) => typeof match !== 'string') ||
    !['unproven', 'proven-reachable', 'proven-absent'].includes(
      reachability.sharpWorkerReachability,
    )
  ) {
    errors.push(`Sharp Worker reachability evidence is missing or malformed for ${profile}.`);
    return;
  }

  const status = reachability.sharpWorkerReachability;
  const proofGapIsEmpty =
    reachability.proofGap === undefined ||
    reachability.proofGap === null ||
    reachability.proofGap === '';
  const hasCompletedBuild =
    reachability.build.exitCode === 0 &&
    reachability.build.outputDirectory === '.open-next' &&
    typeof reachability.build.metafile === 'string' &&
    /^[a-f0-9]{64}$/.test(reachability.build.outputSha256) &&
    /^[a-f0-9]{64}$/.test(reachability.build.metafileSha256);

  if (status === 'unproven') {
    if (
      typeof reachability.proofGap !== 'string' ||
      reachability.proofGap.length === 0 ||
      !(
        reachability.build.exitCode === null ||
        (Number.isInteger(reachability.build.exitCode) && reachability.build.exitCode !== 0)
      ) ||
      reachability.build.outputDirectory !== null ||
      reachability.build.metafile !== null
    ) {
      errors.push(`Unproven Sharp reachability metadata is malformed for ${profile}.`);
    }
    errors.push(`Sharp Worker reachability for ${profile} is unproven; deployment is blocked.`);
    return;
  }

  if (!hasCompletedBuild || !proofGapIsEmpty) {
    errors.push(`Completed-build Sharp reachability evidence is malformed for ${profile}.`);
  }
  if (status === 'proven-reachable') {
    if (reachability.matches.length === 0) {
      errors.push(`Proven-reachable Sharp evidence requires non-empty matches for ${profile}.`);
    }
    errors.push(
      `Sharp Worker reachability for ${profile} is proven reachable; deployment is blocked.`,
    );
    return;
  }
  if (reachability.matches.length !== 0) {
    errors.push(`Proven-absent Sharp evidence requires empty matches for ${profile}.`);
  }
}

export function evaluateDeploymentGate({ profile, reachability, ...auditInputs } = {}) {
  const auditResult = evaluateAuditException(auditInputs);
  const errors = [...auditResult.errors];
  validateReachabilityEvidence(profile, reachability, errors);
  return {
    ok: errors.length === 0,
    errors,
    unrelatedAdvisorySources: auditResult.unrelatedAdvisorySources,
  };
}

function resolveContainedPath(repositoryRoot, relativePath, label) {
  if (typeof relativePath !== 'string' || path.isAbsolute(relativePath)) {
    throw new Error(`${label} must be repository-relative.`);
  }
  const resolvedRoot = path.resolve(repositoryRoot);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);
  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`${label} escapes the repository root.`);
  }
  return resolvedPath;
}

async function collectFiles(directoryPath) {
  const files = [];
  async function visit(currentPath, relativePath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    entries.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await visit(entryPath, entryRelativePath);
      } else if (entry.isFile()) {
        files.push({ absolutePath: entryPath, relativePath: entryRelativePath });
      } else {
        throw new Error(`Unsupported bundle entry type: ${entryRelativePath}`);
      }
    }
  }
  await visit(directoryPath, '');
  return files;
}

async function digestFile(filePath) {
  const hash = createHash('sha256');
  hash.update(await fs.readFile(filePath));
  return hash.digest('hex');
}

async function digestDirectory(directoryPath) {
  const hash = createHash('sha256');
  for (const file of await collectFiles(directoryPath)) {
    hash.update(`file\0${file.relativePath}\0`);
    hash.update(await fs.readFile(file.absolutePath));
    hash.update('\0');
  }
  return hash.digest('hex');
}

export async function calculateBuildArtifactDigests(
  { outputDirectory, metafile },
  repositoryRoot = process.cwd(),
) {
  const outputPath = resolveContainedPath(
    repositoryRoot,
    outputDirectory,
    'Build output directory',
  );
  const metafilePath = resolveContainedPath(repositoryRoot, metafile, 'Build metafile');
  const relativeMetafile = path.relative(outputPath, metafilePath);
  if (relativeMetafile.startsWith('..') || path.isAbsolute(relativeMetafile)) {
    throw new Error('Build metafile must be contained in the build output directory.');
  }
  const [outputSha256, metafileSha256] = await Promise.all([
    digestDirectory(outputPath),
    digestFile(metafilePath),
  ]);
  return { outputSha256, metafileSha256 };
}

export async function verifyRecordedBuildArtifacts(reachability, repositoryRoot = process.cwd()) {
  try {
    const actual = await calculateBuildArtifactDigests(reachability.build, repositoryRoot);
    const errors = [];
    if (actual.outputSha256 !== reachability.build.outputSha256) {
      errors.push('Current OpenNext output does not match reviewed reachability evidence.');
    }
    if (actual.metafileSha256 !== reachability.build.metafileSha256) {
      errors.push('Current OpenNext metafile does not match reviewed reachability evidence.');
    }
    return { ok: errors.length === 0, errors };
  } catch (error) {
    return {
      ok: false,
      errors: [`Current OpenNext build evidence is missing or malformed: ${error.message}`],
    };
  }
}

function collectMatchingStrings(value, location, matches) {
  if (typeof value === 'string') {
    if (SHARP_PATTERN.test(value)) matches.push(`${location}: ${value}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      collectMatchingStrings(entry, `${location}[${index}]`, matches),
    );
    return;
  }
  if (isRecord(value)) {
    for (const [key, entry] of Object.entries(value)) {
      if (SHARP_PATTERN.test(key)) matches.push(`${location}.${key}`);
      collectMatchingStrings(entry, `${location}.${key}`, matches);
    }
  }
}

function inspectMetafile(parsed, relativePath) {
  const runtimeMatches = [];
  const uncertainty = [];
  if (!isRecord(parsed) || !isRecord(parsed.inputs) || !isRecord(parsed.outputs)) {
    return {
      runtimeMatches,
      uncertainty: [`${relativePath}: not an esbuild metafile with inputs and outputs`],
    };
  }
  const structuredMatches = [];
  for (const [inputPath, input] of Object.entries(parsed.inputs)) {
    if (SHARP_PATTERN.test(inputPath)) structuredMatches.push(`input ${inputPath}`);
    if (!isRecord(input) || !Array.isArray(input.imports ?? [])) {
      uncertainty.push(`${relativePath}: malformed input ${inputPath}`);
      continue;
    }
    for (const imported of input.imports ?? []) {
      if (!isRecord(imported) || typeof imported.path !== 'string') {
        uncertainty.push(`${relativePath}: malformed input import for ${inputPath}`);
      } else if (SHARP_PATTERN.test(imported.path)) {
        structuredMatches.push(`input import ${imported.path}`);
      }
    }
  }
  for (const [outputPath, output] of Object.entries(parsed.outputs)) {
    if (SHARP_PATTERN.test(outputPath)) structuredMatches.push(`output ${outputPath}`);
    if (
      !isRecord(output) ||
      !Array.isArray(output.imports ?? []) ||
      !isRecord(output.inputs ?? {})
    ) {
      uncertainty.push(`${relativePath}: malformed output ${outputPath}`);
      continue;
    }
    for (const imported of output.imports ?? []) {
      if (!isRecord(imported) || typeof imported.path !== 'string') {
        uncertainty.push(`${relativePath}: malformed output import for ${outputPath}`);
      } else if (SHARP_PATTERN.test(imported.path)) {
        structuredMatches.push(`output import ${imported.path}`);
      }
    }
    for (const inputPath of Object.keys(output.inputs ?? {})) {
      if (SHARP_PATTERN.test(inputPath)) structuredMatches.push(`output input ${inputPath}`);
    }
  }
  runtimeMatches.push(...structuredMatches.map((match) => `${relativePath}: ${match}`));
  const allMatches = [];
  collectMatchingStrings(parsed, relativePath, allMatches);
  if (allMatches.length > 0 && structuredMatches.length === 0) {
    uncertainty.push(
      `${relativePath}: Sharp-like metadata exists outside recognized esbuild reachability fields`,
    );
  }
  return { runtimeMatches, uncertainty };
}

/**
 * Normalises esbuild metafile input keys to comparable POSIX-ish suffixes so a
 * build artifact on disk can be matched against the bundle graph.
 */
export function collectBundledInputPaths(inputPaths) {
  const bundled = new Set();
  for (const inputPath of inputPaths) {
    if (typeof inputPath !== 'string') continue;
    bundled.add(inputPath.split(path.sep).join('/').replace(/^\.\//, ''));
  }
  return bundled;
}

function isInBundleGraph(relativePath, bundledInputs) {
  const normalized = relativePath.split(path.sep).join('/');
  for (const input of bundledInputs) {
    if (input === normalized || input.endsWith(`/${normalized}`) || normalized.endsWith(`/${input}`))
      return true;
  }
  return false;
}

/**
 * Classifies one build artifact for Sharp reachability.
 *
 * A blocking `runtime` verdict requires evidence that the Sharp package itself
 * is present — a package directory, a native binary, or a real module
 * specifier — not merely the letters "sharp" somewhere in a minified bundle.
 * Device names, HTML entities, CSS class names, and font metadata legitimately
 * contain the word and must never block a deployment.
 *
 * @returns {{ kind: 'runtime' | 'tooling' | 'uncertain', description: string } | null}
 */
export function classifyBuildArtifact(relativePath, content, bundledInputs = new Set()) {
  const extension = path.extname(relativePath).toLowerCase();
  const packagePath = SHARP_PACKAGE_PATH_PATTERN.test(relativePath);
  const nativeBinary = SHARP_NATIVE_BINARY_PATTERN.test(relativePath);
  const specifier = SHARP_MODULE_SPECIFIER_PATTERN.test(content);
  const looseOnly = !packagePath && !nativeBinary && !specifier && SHARP_PATTERN.test(content);

  if (packagePath || nativeBinary) {
    return {
      kind: 'runtime',
      description: `${relativePath} [package-path]`,
    };
  }

  if (specifier) {
    // A real specifier only ships if the file is part of the bundle graph.
    // Otherwise it is copied scaffolding that Wrangler never uploads.
    const bundled = isInBundleGraph(relativePath, bundledInputs);
    return {
      kind: bundled ? 'runtime' : 'tooling',
      description: `${relativePath} [module-specifier]${bundled ? ' [bundled]' : ' [unbundled-scaffolding]'}`,
    };
  }

  if (!looseOnly) return null;

  if (TOOLING_METADATA_EXTENSIONS.has(extension)) {
    return { kind: 'tooling', description: `${relativePath} [tooling-metadata]` };
  }

  // Incidental word matches inside bundled code, stylesheets, and metadata.
  return { kind: 'tooling', description: `${relativePath} [incidental-name]` };
}

export async function scanCurrentBuildReachability(build, repositoryRoot = process.cwd()) {
  const runtimeMatches = [];
  const toolingOnlyMatches = [];
  const uncertainty = [];
  try {
    const outputPath = resolveContainedPath(
      repositoryRoot,
      build.outputDirectory,
      'Build output directory',
    );
    const files = await collectFiles(outputPath);
    const metafileCandidates = files.filter((file) =>
      METAFILE_NAME_PATTERN.test(path.basename(file.relativePath)),
    );
    if (metafileCandidates.length === 0) {
      uncertainty.push('No actual OpenNext/esbuild metafile was found in the build output.');
    }

    const recognizedMetafiles = new Set();
    const bundleGraphInputs = [];
    for (const file of metafileCandidates) {
      try {
        const parsed = JSON.parse(await fs.readFile(file.absolutePath, 'utf8'));
        const inspected = inspectMetafile(parsed, file.relativePath);
        recognizedMetafiles.add(file.relativePath);
        if (isRecord(parsed) && isRecord(parsed.inputs)) {
          bundleGraphInputs.push(...Object.keys(parsed.inputs));
        }
        runtimeMatches.push(...inspected.runtimeMatches);
        uncertainty.push(...inspected.uncertainty);
      } catch (error) {
        uncertainty.push(`${file.relativePath}: metafile parse failed: ${error.message}`);
      }
    }

    const recordedMetafile = path
      .relative(outputPath, resolveContainedPath(repositoryRoot, build.metafile, 'Build metafile'))
      .split(path.sep)
      .join('/');
    if (!recognizedMetafiles.has(recordedMetafile)) {
      uncertainty.push('Recorded metafile is not an actual discovered esbuild metafile.');
    }

    const bundledInputs = collectBundledInputPaths(bundleGraphInputs);

    for (const file of files) {
      if (recognizedMetafiles.has(file.relativePath)) continue;
      const buffer = await fs.readFile(file.absolutePath);
      const content = buffer.toString('latin1');
      const classification = classifyBuildArtifact(file.relativePath, content, bundledInputs);
      if (classification === null) continue;

      const { kind, description } = classification;
      if (kind === 'runtime') {
        runtimeMatches.push(description);
      } else if (kind === 'tooling') {
        toolingOnlyMatches.push(description);
      } else {
        uncertainty.push(description);
      }
    }
  } catch (error) {
    uncertainty.push(`Build scan failed: ${error.message}`);
  }

  const status =
    runtimeMatches.length > 0
      ? 'proven-reachable'
      : uncertainty.length > 0
        ? 'unproven'
        : 'proven-absent';
  return { status, runtimeMatches, toolingOnlyMatches, uncertainty };
}

export async function authorizeDeployment({ repositoryRoot = process.cwd(), ...inputs } = {}) {
  const gate = evaluateDeploymentGate(inputs);
  const errors = [...gate.errors];
  if (gate.ok) {
    const freshness = await verifyRecordedBuildArtifacts(inputs.reachability, repositoryRoot);
    errors.push(...freshness.errors);
    const scan = await scanCurrentBuildReachability(inputs.reachability.build, repositoryRoot);
    if (scan.status !== 'proven-absent') {
      errors.push(
        scan.status === 'proven-reachable'
          ? `Current Worker output contains Sharp runtime reachability: ${scan.runtimeMatches.join('; ')}`
          : `Current Worker Sharp reachability is uncertain: ${scan.uncertainty.join('; ')}`,
      );
    }
  }
  return {
    ok: errors.length === 0,
    errors,
    unrelatedAdvisorySources: gate.unrelatedAdvisorySources,
  };
}

/**
 * Records Sharp reachability evidence for the build currently on disk.
 *
 * Necessary because every gated `cf:*` script rebuilds before the gate runs,
 * and the Next.js build is not byte-deterministic, so evidence recorded against
 * an earlier build can never match the artifact about to be uploaded.
 *
 * This recorder can only ever certify absence. If the scan finds Sharp runtime
 * reachability, or cannot classify an artifact, it refuses to write and exits
 * non-zero — so it can never manufacture a passing record for an unsafe build.
 */
export async function recordReachabilityEvidence(profile, repositoryRoot = process.cwd()) {
  const expectedProfile = BUILD_PROFILES[profile];
  if (!expectedProfile) {
    return { ok: false, errors: [`Unknown build profile: ${profile}`] };
  }

  const build = {
    profile,
    environment: expectedProfile.environment,
    command: expectedProfile.command,
    exitCode: 0,
    outputDirectory: '.open-next',
    metafile: '.open-next/server-functions/default/handler.mjs.meta.json',
  };

  const scan = await scanCurrentBuildReachability(build, repositoryRoot);

  if (scan.status !== 'proven-absent') {
    return {
      ok: false,
      errors: [
        scan.status === 'proven-reachable'
          ? `Refusing to record evidence: Sharp is reachable in the Worker output: ${scan.runtimeMatches.join('; ')}`
          : `Refusing to record evidence: Sharp reachability is uncertain: ${scan.uncertainty.join('; ')}`,
      ],
    };
  }

  const digests = await calculateBuildArtifactDigests(build, repositoryRoot);
  const evidence = {
    schemaVersion: 1,
    assessedAt: new Date().toISOString(),
    runtime: 'Node.js v22.23.1',
    build: { ...build, ...digests },
    sharpWorkerReachability: 'proven-absent',
    searchedTerms: ['sharp', 'libvips', '@img'],
    matches: [],
    toolingOnlyMatches: scan.toolingOnlyMatches,
  };

  const target = resolveContainedPath(
    repositoryRoot,
    EVIDENCE_PATHS.reachability[profile],
    'Reachability evidence',
  );
  await fs.writeFile(target, `${JSON.stringify(evidence, null, 2)}\n`);

  return { ok: true, errors: [], toolingOnlyMatches: scan.toolingOnlyMatches };
}

async function readJson(filePath, label, errors) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${label} could not be read as JSON: ${error.message}`);
    return undefined;
  }
}

async function main() {
  const mode = process.argv[2];
  const profile = process.argv[3];
  if (
    (mode !== 'audit-exception' && mode !== 'deployment' && mode !== 'record-reachability') ||
    ((mode === 'deployment' || mode === 'record-reachability') && !BUILD_PROFILES[profile])
  ) {
    console.error(
      'Usage: node tools/security/check-sharp-risk.mjs ' +
        'audit-exception | deployment <preview|production> | record-reachability <preview|production>',
    );
    process.exitCode = 2;
    return;
  }

  if (mode === 'record-reachability') {
    const recorded = await recordReachabilityEvidence(profile);
    if (!recorded.ok) {
      console.error('Sharp reachability recording failed:');
      for (const error of recorded.errors) {
        console.error(`- ${error}`);
      }
      process.exitCode = 1;
      return;
    }
    console.log(
      `Sharp reachability recorded for ${profile}: proven absent from the Worker bundle ` +
        `(${recorded.toolingOnlyMatches.length} incidental non-blocking match(es)).`,
    );
    return;
  }

  const readErrors = [];
  const [fullAudit, productionAudit, lockfile] = await Promise.all([
    readJson(EVIDENCE_PATHS.fullAudit, 'Full audit evidence', readErrors),
    readJson(EVIDENCE_PATHS.productionAudit, 'Production audit evidence', readErrors),
    readJson(EVIDENCE_PATHS.lockfile, 'Package lock evidence', readErrors),
  ]);
  const reachability =
    mode === 'deployment'
      ? await readJson(
          EVIDENCE_PATHS.reachability[profile],
          `${profile} Sharp Worker reachability evidence`,
          readErrors,
        )
      : undefined;
  const inputs = { fullAudit, productionAudit, lockfile, profile, reachability };
  const result =
    mode === 'deployment' ? await authorizeDeployment(inputs) : evaluateAuditException(inputs);
  const errors = [...readErrors, ...result.errors];

  if (errors.length > 0) {
    console.error(`Sharp ${mode} gate failed:`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  if (mode === 'audit-exception') {
    console.log(
      `Sharp audit exception accepted for local migration only; ${result.unrelatedAdvisorySources.length} unrelated advisory sources remain visible and non-exempt.`,
    );
  } else {
    console.log(
      `Sharp deployment gate passed for ${profile}: current Worker output and metafile prove absence.`,
    );
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    console.error('Sharp risk gate failed unexpectedly:', error);
    process.exitCode = 1;
  });
}

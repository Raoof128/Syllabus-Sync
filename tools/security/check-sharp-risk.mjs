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

const EVIDENCE_PATHS = {
  fullAudit: 'artifacts/security/npm-audit-full.json',
  productionAudit: 'artifacts/security/npm-audit-production.json',
  lockfile: 'package-lock.json',
  reachability: 'artifacts/security/sharp-worker-reachability.json',
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
  },
  '@opennextjs/cloudflare': {
    range: '0.3.0 - 0.6.6 || >=1.2.0',
    nodes: ['node_modules/@opennextjs/cloudflare'],
    via: ['@opennextjs/aws', 'next', 'wrangler'],
  },
  miniflare: {
    range: '<=0.0.0-fec45ed61 || >=4.20250508.3',
    nodes: ['node_modules/miniflare'],
    via: ['sharp'],
  },
  next: {
    range: '9.5.6-canary.0 - 10.0.7 || >=14.3.0-canary.0',
    nodes: ['node_modules/next'],
    via: ['sharp'],
  },
  sharp: {
    range: '<0.35.0',
    nodes: ['node_modules/sharp'],
    via: [],
  },
  wrangler: {
    range: '<=0.0.0-7ae5dd357 || >=4.16.0',
    nodes: ['node_modules/wrangler'],
    via: ['miniflare'],
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

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sameStringSet(actual, expected) {
  if (!Array.isArray(actual) || actual.some((value) => typeof value !== 'string')) {
    return false;
  }

  return (
    actual.length === expected.length &&
    [...actual].sort().every((value, index) => value === [...expected].sort()[index])
  );
}

function severityExceedsRecorded(value) {
  const rank = SEVERITY_RANK.get(value);
  return rank === undefined || rank > SEVERITY_RANK.get(MAX_RECORDED_SEVERITY);
}

function validateAudit(label, audit, errors) {
  if (!isRecord(audit) || !isRecord(audit.vulnerabilities)) {
    errors.push(`${label} audit evidence is missing or malformed.`);
    return;
  }

  const observedSourceIds = [];

  for (const [packageName, expected] of Object.entries(EXPECTED_AUDIT_CHAIN)) {
    const vulnerability = audit.vulnerabilities[packageName];
    if (!isRecord(vulnerability)) {
      errors.push(`${label} audit is missing the ${packageName} Sharp risk path.`);
      continue;
    }

    if (severityExceedsRecorded(vulnerability.severity)) {
      errors.push(`${label} audit severity for ${packageName} exceeds recorded high severity.`);
    }

    if (vulnerability.range !== expected.range) {
      errors.push(
        `${label} audit vulnerable range drifted for ${packageName}: expected ${expected.range}.`,
      );
    }

    if (!sameStringSet(vulnerability.nodes, expected.nodes)) {
      errors.push(
        `${label} audit node paths drifted for ${packageName}: expected ${expected.nodes.join(', ')}.`,
      );
    }

    if (!Array.isArray(vulnerability.via)) {
      errors.push(`${label} audit via evidence is malformed for ${packageName}.`);
      continue;
    }

    const viaPackages = vulnerability.via.filter((entry) => typeof entry === 'string');
    if (!sameStringSet(viaPackages, expected.via)) {
      errors.push(
        `${label} audit dependency path drifted for ${packageName}: expected via ${expected.via.join(', ') || 'the recorded advisory only'}.`,
      );
    }

    for (const entry of vulnerability.via) {
      if (isRecord(entry)) {
        observedSourceIds.push(entry.source);
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
  }

  if (observedSourceIds.length !== 1 || observedSourceIds[0] !== EXPECTED_ADVISORY.source) {
    errors.push(
      `${label} audit Sharp advisory source IDs differ from the sole allowed source ${EXPECTED_ADVISORY.source}.`,
    );
  }
}

function validateDependencyPaths(lockfile, errors) {
  if (!isRecord(lockfile) || !isRecord(lockfile.packages)) {
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
  validateAudit('Full', fullAudit, errors);
  validateAudit('Production', productionAudit, errors);
  validateDependencyPaths(lockfile, errors);

  return { ok: errors.length === 0, errors };
}

function validateReachabilityEvidence(reachability, errors) {
  if (
    !isRecord(reachability) ||
    reachability.schemaVersion !== 1 ||
    typeof reachability.assessedAt !== 'string' ||
    !Number.isFinite(Date.parse(reachability.assessedAt)) ||
    reachability.runtime !== 'Node.js v22.23.1' ||
    !isRecord(reachability.build) ||
    reachability.build.command !== 'npm run cf:build' ||
    !Number.isInteger(reachability.build.exitCode) ||
    !sameStringSet(reachability.searchedTerms, ['sharp', 'libvips', '@img']) ||
    !Array.isArray(reachability.matches)
  ) {
    errors.push('Sharp Worker reachability evidence is missing or malformed.');
    return;
  }

  const status = reachability.sharpWorkerReachability;
  if (status === 'unproven') {
    if (
      reachability.build.exitCode === 0 ||
      typeof reachability.proofGap !== 'string' ||
      reachability.proofGap.length === 0
    ) {
      errors.push('Unproven Sharp Worker reachability evidence is malformed.');
      return;
    }
    errors.push('Sharp Worker reachability remains unproven; deployment is blocked.');
    return;
  }

  if (status !== 'proven-reachable' && status !== 'proven-absent') {
    errors.push('Sharp Worker reachability evidence has an unknown status.');
    return;
  }

  if (
    reachability.build.exitCode !== 0 ||
    typeof reachability.build.outputDirectory !== 'string' ||
    typeof reachability.build.metafile !== 'string' ||
    !/^[a-f0-9]{64}$/.test(reachability.build.outputSha256) ||
    !/^[a-f0-9]{64}$/.test(reachability.build.metafileSha256)
  ) {
    errors.push('Completed-build Sharp Worker reachability evidence is malformed.');
    return;
  }

  if (status === 'proven-reachable') {
    if (reachability.matches.length === 0) {
      errors.push('Proven reachable Sharp Worker evidence must identify a match.');
      return;
    }
    errors.push('Sharp Worker reachability is proven reachable; deployment is blocked.');
  } else if (reachability.matches.length !== 0) {
    errors.push('Proven-absent Sharp Worker evidence cannot contain Sharp matches.');
  }
}

function resolveContainedPath(repositoryRoot, relativePath, label) {
  if (path.isAbsolute(relativePath)) {
    throw new Error(`${label} must be repository-relative.`);
  }

  const resolvedRoot = path.resolve(repositoryRoot);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);
  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`${label} escapes the repository root.`);
  }

  return resolvedPath;
}

async function digestFile(filePath) {
  const hash = createHash('sha256');
  hash.update(await fs.readFile(filePath));
  return hash.digest('hex');
}

async function digestDirectory(directoryPath) {
  const hash = createHash('sha256');

  async function visit(currentPath, relativePath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    entries.sort((left, right) =>
      left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
    );

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      const entryRelativePath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;
      hash.update(`${entry.isDirectory() ? 'directory' : entry.isFile() ? 'file' : 'other'}\0`);
      hash.update(`${entryRelativePath}\0`);

      if (entry.isDirectory()) {
        await visit(entryPath, entryRelativePath);
      } else if (entry.isFile()) {
        hash.update(await fs.readFile(entryPath));
        hash.update('\0');
      } else {
        throw new Error(`Unsupported bundle entry type: ${entryRelativePath}`);
      }
    }
  }

  await visit(directoryPath, '');
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
      errors.push('Current OpenNext output does not match the reviewed reachability evidence.');
    }
    if (actual.metafileSha256 !== reachability.build.metafileSha256) {
      errors.push('Current OpenNext metafile does not match the reviewed reachability evidence.');
    }
    return { ok: errors.length === 0, errors };
  } catch (error) {
    return {
      ok: false,
      errors: [`Current OpenNext build evidence is missing or malformed: ${error.message}`],
    };
  }
}

export function evaluateDeploymentGate({ reachability, ...auditInputs } = {}) {
  const auditResult = evaluateAuditException(auditInputs);
  const errors = [...auditResult.errors];

  validateReachabilityEvidence(reachability, errors);

  return { ok: errors.length === 0, errors };
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
  if (mode !== 'audit-exception' && mode !== 'deployment') {
    console.error('Usage: node tools/security/check-sharp-risk.mjs <audit-exception|deployment>');
    process.exitCode = 2;
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
          EVIDENCE_PATHS.reachability,
          'Sharp Worker reachability evidence',
          readErrors,
        )
      : undefined;

  const result =
    mode === 'deployment'
      ? evaluateDeploymentGate({
          fullAudit,
          productionAudit,
          lockfile,
          reachability,
        })
      : evaluateAuditException({ fullAudit, productionAudit, lockfile });
  const errors = [...readErrors, ...result.errors];
  if (mode === 'deployment' && result.ok) {
    const artifactResult = await verifyRecordedBuildArtifacts(reachability);
    errors.push(...artifactResult.errors);
  }

  if (errors.length > 0) {
    console.error(`Sharp ${mode} gate failed:`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  if (mode === 'audit-exception') {
    console.log(
      'Sharp audit exception accepted for local migration work only; deployment remains separately gated.',
    );
  } else {
    console.log(
      'Sharp deployment gate passed: current audit is unchanged and Worker reachability is proven absent.',
    );
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    console.error('Sharp risk gate failed unexpectedly:', error);
    process.exitCode = 1;
  });
}

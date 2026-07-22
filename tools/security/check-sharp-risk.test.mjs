import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  calculateBuildArtifactDigests,
  evaluateAuditException,
  evaluateDeploymentGate,
  verifyRecordedBuildArtifacts,
} from './check-sharp-risk.mjs';

const CURRENT_TIME = '2026-07-22T12:00:00+10:00';

function advisory() {
  return {
    source: 1124066,
    name: 'sharp',
    dependency: 'sharp',
    title:
      'sharp inherited vulnerabilities in libvips: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591',
    url: 'https://github.com/advisories/GHSA-f88m-g3jw-g9cj',
    severity: 'high',
    cwe: ['CWE-1395'],
    cvss: { score: 0, vectorString: null },
    range: '<0.35.0',
  };
}

function vulnerability({ severity = 'high', range, nodes, via, effects = [] }) {
  return {
    name: nodes[0].replace('node_modules/', ''),
    severity,
    isDirect: false,
    via,
    effects,
    range,
    nodes,
    fixAvailable: false,
  };
}

function audit() {
  return {
    auditReportVersion: 2,
    vulnerabilities: {
      '@opennextjs/aws': vulnerability({
        range: '>=3.9.13',
        nodes: ['node_modules/@opennextjs/aws'],
        via: ['next'],
        effects: ['@opennextjs/cloudflare'],
      }),
      '@opennextjs/cloudflare': vulnerability({
        range: '0.3.0 - 0.6.6 || >=1.2.0',
        nodes: ['node_modules/@opennextjs/cloudflare'],
        via: ['@opennextjs/aws', 'next', 'wrangler'],
      }),
      miniflare: vulnerability({
        range: '<=0.0.0-fec45ed61 || >=4.20250508.3',
        nodes: ['node_modules/miniflare'],
        via: ['sharp'],
        effects: ['wrangler'],
      }),
      next: vulnerability({
        range: '9.5.6-canary.0 - 10.0.7 || >=14.3.0-canary.0',
        nodes: ['node_modules/next'],
        via: ['sharp'],
        effects: ['@opennextjs/aws', '@opennextjs/cloudflare'],
      }),
      sharp: vulnerability({
        range: '<0.35.0',
        nodes: ['node_modules/sharp'],
        via: [advisory()],
        effects: ['miniflare', 'next'],
      }),
      wrangler: vulnerability({
        range: '<=0.0.0-7ae5dd357 || >=4.16.0',
        nodes: ['node_modules/wrangler'],
        via: ['miniflare'],
        effects: ['@opennextjs/cloudflare'],
      }),
    },
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 0,
        high: 6,
        critical: 0,
        total: 6,
      },
    },
  };
}

function lockfile() {
  return {
    lockfileVersion: 3,
    packages: {
      '': {
        dependencies: { next: '^16.2.11' },
        devDependencies: { wrangler: '^4.113.0' },
      },
      'node_modules/next': {
        version: '16.2.11',
        optionalDependencies: { sharp: '^0.34.5' },
      },
      'node_modules/wrangler': {
        version: '4.113.0',
        dependencies: { miniflare: '4.20260721.0' },
      },
      'node_modules/miniflare': {
        version: '4.20260721.0',
        dependencies: { sharp: '0.34.5' },
      },
      'node_modules/sharp': { version: '0.34.5' },
    },
  };
}

function reachability(status) {
  return {
    schemaVersion: 1,
    assessedAt: '2026-07-22T16:15:00+10:00',
    runtime: 'Node.js v22.23.1',
    build: {
      command: 'npm run cf:build',
      exitCode: status === 'unproven' ? 1 : 0,
      outputDirectory: status === 'unproven' ? null : '.open-next',
      metafile: status === 'unproven' ? null : '.open-next/metafile.json',
      outputSha256: status === 'unproven' ? null : 'a'.repeat(64),
      metafileSha256: status === 'unproven' ? null : 'b'.repeat(64),
    },
    sharpWorkerReachability: status,
    searchedTerms: ['sharp', 'libvips', '@img'],
    matches: status === 'proven-reachable' ? ['.open-next/server.js'] : [],
    proofGap:
      status === 'unproven'
        ? 'OpenNext build stopped before output because open-next.config.ts is absent.'
        : null,
  };
}

function inputs() {
  return {
    fullAudit: audit(),
    productionAudit: audit(),
    lockfile: lockfile(),
    now: CURRENT_TIME,
  };
}

test('accepts only the current Sharp audit exception for local migration work', () => {
  const result = evaluateAuditException(inputs());

  assert.equal(result.ok, true, result.errors.join('\n'));
});

test('rejects malformed and missing audit evidence', () => {
  const malformed = evaluateAuditException({
    ...inputs(),
    fullAudit: { auditReportVersion: 2 },
  });
  const missing = evaluateAuditException({
    ...inputs(),
    productionAudit: undefined,
  });

  assert.equal(malformed.ok, false);
  assert.match(malformed.errors.join('\n'), /full audit/i);
  assert.equal(missing.ok, false);
  assert.match(missing.errors.join('\n'), /production audit/i);
});

test('rejects a new advisory source ID', () => {
  const fullAudit = audit();
  fullAudit.vulnerabilities.sharp.via.push({
    ...advisory(),
    source: 9999999,
    url: 'https://github.com/advisories/GHSA-new0-new0-new0',
  });

  const result = evaluateAuditException({ ...inputs(), fullAudit });

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /source IDs/i);
});

test('rejects an advisory or propagated severity increase', () => {
  const fullAudit = audit();
  fullAudit.vulnerabilities.sharp.via[0].severity = 'critical';
  fullAudit.vulnerabilities.next.severity = 'critical';

  const result = evaluateAuditException({ ...inputs(), fullAudit });

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /severity/i);
});

test('rejects vulnerable audit node drift', () => {
  const productionAudit = audit();
  productionAudit.vulnerabilities.sharp.nodes.push('node_modules/other/node_modules/sharp');

  const result = evaluateAuditException({ ...inputs(), productionAudit });

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /node paths/i);
});

test('rejects a changed dependency ancestry path', () => {
  const changedLockfile = lockfile();
  changedLockfile.packages['node_modules/miniflare'].dependencies.sharp = '^0.34.5';

  const result = evaluateAuditException({
    ...inputs(),
    lockfile: changedLockfile,
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /dependency path/i);
});

test('expires after 2026-08-22 Australia/Sydney', () => {
  const lastValidInstant = evaluateAuditException({
    ...inputs(),
    now: '2026-08-22T23:59:59+10:00',
  });
  const expired = evaluateAuditException({
    ...inputs(),
    now: '2026-08-23T00:00:00+10:00',
  });

  assert.equal(lastValidInstant.ok, true, lastValidInstant.errors.join('\n'));
  assert.equal(expired.ok, false);
  assert.match(expired.errors.join('\n'), /expired/i);
});

test('deployment rejects missing or malformed reachability evidence', () => {
  const missing = evaluateDeploymentGate({ ...inputs() });
  const malformed = evaluateDeploymentGate({
    ...inputs(),
    reachability: { schemaVersion: 1 },
  });

  assert.equal(missing.ok, false);
  assert.match(missing.errors.join('\n'), /reachability evidence/i);
  assert.equal(malformed.ok, false);
  assert.match(malformed.errors.join('\n'), /reachability evidence/i);
});

test('deployment rejects unproven Sharp Worker reachability', () => {
  const result = evaluateDeploymentGate({
    ...inputs(),
    reachability: reachability('unproven'),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /unproven/i);
});

test('deployment rejects proven Sharp Worker reachability', () => {
  const result = evaluateDeploymentGate({
    ...inputs(),
    reachability: reachability('proven-reachable'),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /proven reachable/i);
});

test('deployment accepts only current proven-absent bundle evidence', async () => {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'sharp-risk-gate-'));
  try {
    const outputDirectory = path.join(temporaryRoot, '.open-next');
    await fs.mkdir(outputDirectory);
    await fs.writeFile(path.join(outputDirectory, 'worker.js'), 'export default {};\n');
    await fs.writeFile(path.join(outputDirectory, 'metafile.json'), '{"inputs":{}}\n');

    const evidence = reachability('proven-absent');
    Object.assign(
      evidence.build,
      await calculateBuildArtifactDigests(evidence.build, temporaryRoot),
    );
    const result = evaluateDeploymentGate({
      ...inputs(),
      reachability: evidence,
    });
    const currentArtifacts = await verifyRecordedBuildArtifacts(evidence, temporaryRoot);

    assert.equal(result.ok, true, result.errors.join('\n'));
    assert.equal(currentArtifacts.ok, true, currentArtifacts.errors.join('\n'));

    await fs.writeFile(path.join(outputDirectory, 'worker.js'), 'changed bundle\n');
    const staleArtifacts = await verifyRecordedBuildArtifacts(evidence, temporaryRoot);
    assert.equal(staleArtifacts.ok, false);
    assert.match(staleArtifacts.errors.join('\n'), /does not match/i);
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
});

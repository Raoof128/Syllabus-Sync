import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  authorizeDeployment,
  classifyBuildArtifact,
  collectBundledInputPaths,
  calculateBuildArtifactDigests,
  evaluateAuditException,
  evaluateDeploymentGate,
  scanCurrentBuildReachability,
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
        resolved: 'https://registry.npmjs.org/next/-/next-16.2.11.tgz',
        integrity:
          'sha512-B339zaqbyK8cmxhoAvLrcwoabwCP1wz21zSzfqxqXAemTu2BXnH7tQnfcglKv1vnMUIDBc+Hth7XODQriTZiRQ==',
        optionalDependencies: { sharp: '^0.34.5' },
      },
      'node_modules/@opennextjs/cloudflare': {
        version: '1.20.2',
        resolved: 'https://registry.npmjs.org/@opennextjs/cloudflare/-/cloudflare-1.20.2.tgz',
        integrity:
          'sha512-iFBjABnaDk3be27F5EpxyMLMGPbVnnArFx5I3Y8Rf6BSx5nBV8h0UuJiMKrx3+whDU5ahIy4d8sfbvWvMiF1Kg==',
      },
      'node_modules/wrangler': {
        version: '4.113.0',
        resolved: 'https://registry.npmjs.org/wrangler/-/wrangler-4.113.0.tgz',
        integrity:
          'sha512-ROGzSloJv0y21It6Oc9LaruNcu1tdiQ/XzL3Jc3YkFjzXEMXzTqVhA8vQaGMTdZHTjFP0PVcwAHNgaw3gXu4wA==',
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

function reachability(status, profile = 'preview') {
  return {
    schemaVersion: 1,
    assessedAt: '2026-07-22T16:15:00+10:00',
    runtime: 'Node.js v22.23.1',
    build: {
      profile,
      environment: profile,
      command: profile === 'production' ? 'npm run cf:build:production' : 'npm run cf:build',
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
    profile: 'preview',
    reachability: reachability('unproven'),
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /unproven/i);
});

test('deployment rejects proven Sharp Worker reachability', () => {
  const result = evaluateDeploymentGate({
    ...inputs(),
    profile: 'preview',
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
    await fs.writeFile(path.join(outputDirectory, 'metafile.json'), '{"inputs":{},"outputs":{}}\n');

    const evidence = reachability('proven-absent');
    Object.assign(
      evidence.build,
      await calculateBuildArtifactDigests(evidence.build, temporaryRoot),
    );
    const result = evaluateDeploymentGate({
      ...inputs(),
      profile: 'preview',
      reachability: evidence,
    });
    const currentArtifacts = await verifyRecordedBuildArtifacts(evidence, temporaryRoot);
    const authorization = await authorizeDeployment({
      ...inputs(),
      profile: 'preview',
      reachability: evidence,
      repositoryRoot: temporaryRoot,
    });

    assert.equal(result.ok, true, result.errors.join('\n'));
    assert.equal(currentArtifacts.ok, true, currentArtifacts.errors.join('\n'));
    assert.equal(authorization.ok, true, authorization.errors.join('\n'));

    await fs.writeFile(path.join(outputDirectory, 'worker.js'), 'changed bundle\n');
    const staleArtifacts = await verifyRecordedBuildArtifacts(evidence, temporaryRoot);
    assert.equal(staleArtifacts.ok, false);
    assert.match(staleArtifacts.errors.join('\n'), /does not match/i);
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
});

test('current bundle and metafile override forged proven-absent evidence', async () => {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'sharp-risk-gate-scan-'));
  try {
    const outputDirectory = path.join(temporaryRoot, '.open-next');
    await fs.mkdir(outputDirectory);
    await fs.writeFile(
      path.join(outputDirectory, 'worker.mjs'),
      "import sharp from 'sharp'; export default sharp;\n",
    );
    await fs.writeFile(path.join(outputDirectory, 'sharp-runtime.node'), 'binary-placeholder');
    await fs.writeFile(
      path.join(outputDirectory, 'metafile.json'),
      JSON.stringify({
        inputs: { 'node_modules/sharp/lib/index.js': { bytes: 100, imports: [] } },
        outputs: {
          '.open-next/worker.mjs': {
            imports: [{ path: 'sharp', kind: 'import-statement', external: true }],
            inputs: { 'node_modules/sharp/lib/index.js': { bytesInOutput: 80 } },
          },
        },
      }),
    );
    const evidence = reachability('proven-absent');
    Object.assign(
      evidence.build,
      await calculateBuildArtifactDigests(evidence.build, temporaryRoot),
    );
    evidence.matches = [];

    const scan = await scanCurrentBuildReachability(evidence.build, temporaryRoot);
    const authorization = await authorizeDeployment({
      ...inputs(),
      profile: 'preview',
      reachability: evidence,
      repositoryRoot: temporaryRoot,
    });

    assert.equal(scan.status, 'proven-reachable');
    assert.match(JSON.stringify(scan.runtimeMatches), /sharp/i);
    assert.match(JSON.stringify(scan.runtimeMatches), /sharp-runtime\.node.*path/i);
    assert.equal(authorization.ok, false);
    assert.match(authorization.errors.join('\n'), /current.*sharp|runtime.*sharp/i);
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
});

test('rejects npm registry URL and integrity drift', () => {
  const changedUrl = lockfile();
  changedUrl.packages['node_modules/next'].resolved = 'https://mirror.invalid/next.tgz';
  const changedIntegrity = lockfile();
  changedIntegrity.packages['node_modules/wrangler'].integrity = 'sha512-forged';

  const urlResult = evaluateAuditException({ ...inputs(), lockfile: changedUrl });
  const integrityResult = evaluateAuditException({ ...inputs(), lockfile: changedIntegrity });

  assert.equal(urlResult.ok, false);
  assert.match(urlResult.errors.join('\n'), /provenance|registry|resolved/i);
  assert.equal(integrityResult.ok, false);
  assert.match(integrityResult.errors.join('\n'), /integrity|provenance/i);
});

test('rejects malformed and additional Sharp-linked audit paths', () => {
  const malformedAudit = audit();
  malformedAudit.vulnerabilities.next.via.push(null);
  const extraPathAudit = audit();
  extraPathAudit.vulnerabilities['new-sharp-consumer'] = vulnerability({
    range: '*',
    nodes: ['node_modules/new-sharp-consumer'],
    via: ['sharp'],
  });
  extraPathAudit.vulnerabilities['new-sharp-consumer'].name = 'new-sharp-consumer';
  extraPathAudit.metadata.vulnerabilities.high += 1;
  extraPathAudit.metadata.vulnerabilities.total += 1;

  const malformed = evaluateAuditException({ ...inputs(), fullAudit: malformedAudit });
  const additional = evaluateAuditException({ ...inputs(), productionAudit: extraPathAudit });

  assert.equal(malformed.ok, false);
  assert.match(malformed.errors.join('\n'), /malformed|via/i);
  assert.equal(additional.ok, false);
  assert.match(additional.errors.join('\n'), /sharp-linked|unexpected|graph/i);
});

test('rejects missing, added, malformed, and non-reciprocal effects edges', () => {
  const missing = audit();
  missing.vulnerabilities.sharp.effects = ['miniflare'];
  const added = audit();
  added.vulnerabilities.sharp.effects.push('new-sharp-consumer');
  const malformed = audit();
  malformed.vulnerabilities.next.effects.push(null);
  const nonReciprocal = audit();
  nonReciprocal.vulnerabilities.wrangler.effects = ['next'];

  for (const changedAudit of [missing, added, malformed, nonReciprocal]) {
    const result = evaluateAuditException({ ...inputs(), fullAudit: changedAudit });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /effects|reciprocal|graph|malformed/i);
  }
});

test('rejects contradictory and malformed status-specific reachability metadata', () => {
  const nonEmptyAbsent = reachability('proven-absent');
  nonEmptyAbsent.matches = ['worker.mjs: sharp'];
  const malformedAbsent = reachability('proven-absent');
  malformedAbsent.matches = [null];
  const proofGapAbsent = reachability('proven-absent');
  proofGapAbsent.proofGap = 'Sharp might be reachable';
  const malformedUnproven = reachability('unproven');
  malformedUnproven.proofGap = null;
  const malformedReachable = reachability('proven-reachable');
  malformedReachable.matches = [];

  for (const evidence of [
    nonEmptyAbsent,
    malformedAbsent,
    proofGapAbsent,
    malformedUnproven,
    malformedReachable,
  ]) {
    const result = evaluateDeploymentGate({
      ...inputs(),
      profile: 'preview',
      reachability: evidence,
    });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /matches|proof gap|malformed|contradict/i);
  }
});

test('keeps well-formed unrelated advisory sources visible and non-exempt', () => {
  const fullAudit = audit();
  const unrelated = advisory();
  Object.assign(unrelated, {
    source: 7654321,
    name: 'unrelated-package',
    dependency: 'unrelated-package',
    title: 'Unrelated advisory remains outside the Sharp exception',
    url: 'https://github.com/advisories/GHSA-1111-2222-3333',
    severity: 'moderate',
    range: '<2.0.0',
  });
  fullAudit.vulnerabilities['unrelated-package'] = vulnerability({
    severity: 'moderate',
    range: '<2.0.0',
    nodes: ['node_modules/unrelated-package'],
    via: [unrelated],
  });
  fullAudit.vulnerabilities['unrelated-package'].name = 'unrelated-package';
  fullAudit.metadata.vulnerabilities.moderate += 1;
  fullAudit.metadata.vulnerabilities.total += 1;

  const result = evaluateAuditException({ ...inputs(), fullAudit });

  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.ok(result.unrelatedAdvisorySources.includes(7654321));
});

test('binds preview and production evidence to exact build identities', () => {
  const preview = evaluateDeploymentGate({
    ...inputs(),
    profile: 'preview',
    reachability: reachability('proven-absent', 'preview'),
  });
  const wrongProductionEvidence = evaluateDeploymentGate({
    ...inputs(),
    profile: 'production',
    reachability: reachability('proven-absent', 'preview'),
  });
  const production = evaluateDeploymentGate({
    ...inputs(),
    profile: 'production',
    reachability: reachability('proven-absent', 'production'),
  });

  assert.equal(preview.ok, true, preview.errors.join('\n'));
  assert.equal(wrongProductionEvidence.ok, false);
  assert.match(wrongProductionEvidence.errors.join('\n'), /profile|production|command/i);
  assert.equal(production.ok, true, production.errors.join('\n'));
});

test('every Cloudflare Worker execution script enforces build then matching gate then action', async () => {
  const packageJson = JSON.parse(
    await fs.readFile(new URL('../../package.json', import.meta.url), 'utf8'),
  );
  const actionPattern = /(opennextjs-cloudflare (?:preview|deploy|upload)|wrangler (?:dev|deploy))/;
  const executionScripts = Object.entries(packageJson.scripts)
    .filter(([name, script]) => name.startsWith('cf:') && actionPattern.test(script))
    .map(([name, script]) => [
      name,
      name.endsWith(':production') || script.includes('--env=production')
        ? 'production'
        : 'preview',
    ]);
  assert.deepEqual(executionScripts.map(([name]) => name).sort(), [
    'cf:deploy',
    'cf:deploy:production',
    'cf:dev:scheduled',
    'cf:dry-run',
    'cf:dry-run:production',
    'cf:preview',
    'cf:upload',
    'cf:upload:production',
  ]);

  for (const [name, profile] of executionScripts) {
    const script = packageJson.scripts[name];
    const build = profile === 'production' ? 'npm run cf:build:production' : 'npm run cf:build';
    const gate = `npm run security:sharp:deployment-gate -- ${profile}`;
    const actionIndex = script.search(actionPattern);

    assert.notEqual(script.indexOf(build), -1, `${name} missing ${build}`);
    assert.notEqual(script.indexOf(gate), -1, `${name} missing ${gate}`);
    assert.ok(script.indexOf(build) < script.indexOf(gate), `${name} must build before gate`);
    assert.ok(script.indexOf(gate) < actionIndex, `${name} must gate before action`);
  }
});

test('classifyBuildArtifact blocks on a real Sharp package directory', () => {
  const result = classifyBuildArtifact('server-functions/default/node_modules/sharp/lib/index.js', '');

  assert.equal(result.kind, 'runtime');
  assert.match(result.description, /package-path/);
});

test('classifyBuildArtifact blocks on an @img native platform package', () => {
  const result = classifyBuildArtifact(
    'server-functions/default/node_modules/@img/sharp-linux-x64/lib/sharp.js',
    '',
  );

  assert.equal(result.kind, 'runtime');
});

test('classifyBuildArtifact blocks on a compiled libvips native binary', () => {
  for (const candidate of ['assets/sharp-linux-x64.node', 'vendor/libvips.wasm', 'vendor/libvips.so.42']) {
    assert.equal(classifyBuildArtifact(candidate, '').kind, 'runtime', candidate);
  }
});

test('classifyBuildArtifact blocks on a bundled Sharp module specifier', () => {
  const bundled = new Set(['node_modules/next/dist/server/image-optimizer.js']);
  const result = classifyBuildArtifact(
    'node_modules/next/dist/server/image-optimizer.js',
    "const sharp = require('sharp');",
    bundled,
  );

  assert.equal(result.kind, 'runtime');
  assert.match(result.description, /bundled/);
});

test('classifyBuildArtifact records an unbundled Sharp specifier without blocking', () => {
  const result = classifyBuildArtifact(
    'server-functions/default/node_modules/next/dist/server/image-optimizer.js',
    "const sharp = require('sharp');",
    new Set(['node_modules/next/dist/server/app-render.js']),
  );

  assert.equal(result.kind, 'tooling');
  assert.match(result.description, /unbundled-scaffolding/);
});

test('classifyBuildArtifact does not block on incidental uses of the word sharp', () => {
  const incidental = [
    ['middleware/handler.mjs', 'var L = "Sharp", M = "Sony", N = "Xiaomi";'],
    ['server-functions/default/handler.mjs', '"&sharp;":"\\u266F","&shchcy;":"\\u0449"'],
    ['assets/_next/static/css/app.css', '.leaflet-routing-icon-sharp-right{background-position:-20px 0}'],
    [
      'server-functions/default/node_modules/next/dist/server/capsize-font-metrics.json',
      '{"MaterialIconsSharp":{"familyName":"Material Icons Sharp"}}',
    ],
  ];

  for (const [relativePath, content] of incidental) {
    const result = classifyBuildArtifact(relativePath, content);
    assert.equal(result.kind, 'tooling', relativePath);
    assert.match(result.description, /incidental-name/, relativePath);
  }
});

test('classifyBuildArtifact ignores files with no Sharp signal at all', () => {
  assert.equal(classifyBuildArtifact('assets/app.js', 'export const answer = 42;'), null);
});

test('collectBundledInputPaths normalises esbuild input keys', () => {
  const bundled = collectBundledInputPaths(['./node_modules/sharp/lib/index.js', 42, 'app/page.tsx']);

  assert.ok(bundled.has('node_modules/sharp/lib/index.js'));
  assert.ok(bundled.has('app/page.tsx'));
  assert.equal(bundled.size, 2);
});

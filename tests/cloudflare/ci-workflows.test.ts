import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const CI = '.github/workflows/ci-cd.yml';
const DEPLOY = '.github/workflows/cloudflare-deploy.yml';

describe('Cloudflare CI workflow', () => {
  it('builds, dry-runs, and size-gates the Worker after tests and security', async () => {
    const workflow = await readFile(CI, 'utf8');

    expect(workflow).toContain('cloudflare-build:');
    expect(workflow).toContain('npm run check:cloudflare-runtime');
    expect(workflow).toContain('npm run test:sharp-risk-gate');
    expect(workflow).toContain('npm run cf:dry-run');
    expect(workflow).toContain('npm run check:worker-size -- .open-next/wrangler-dry-run.log');
  });

  it('blocks the pipeline result on the Worker build', async () => {
    const workflow = await readFile(CI, 'utf8');

    expect(workflow).toContain('needs: [test, security, build, cloudflare-build, lighthouse]');
  });

  it('never hardcodes real credentials in CI build values', async () => {
    const workflow = await readFile(CI, 'utf8');

    expect(workflow).toContain('https://placeholder.supabase.co');
    expect(workflow).not.toMatch(/NEXT_PUBLIC_SUPABASE_URL:\s*https:\/\/(?!placeholder)/);
  });
});

describe('Cloudflare deployment workflow', () => {
  it('is manual only and never triggered by push or pull request', async () => {
    const workflow = await readFile(DEPLOY, 'utf8');

    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).not.toMatch(/^\s{2}push:/m);
    expect(workflow).not.toMatch(/^\s{2}pull_request:/m);
  });

  it('routes production through a protected environment and requires main', async () => {
    const workflow = await readFile(DEPLOY, 'utf8');

    expect(workflow).toContain("inputs.target == 'production' && 'cloudflare-production'");
    expect(workflow).toContain("inputs.target == 'production' && github.ref != 'refs/heads/main'");
  });

  it('runs the quality gate, environment validation, and size gate before deploying', async () => {
    const workflow = await readFile(DEPLOY, 'utf8');

    const qualityGate = workflow.indexOf('npm run check');
    const envCheck = workflow.indexOf('npm run deploy:env:check');
    const sizeGate = workflow.indexOf('npm run check:worker-size');
    const deploy = workflow.indexOf('npm run cf:deploy');

    expect(qualityGate).toBeGreaterThan(-1);
    expect(qualityGate).toBeLessThan(envCheck);
    expect(envCheck).toBeLessThan(sizeGate);
    expect(sizeGate).toBeLessThan(deploy);
  });

  it('reads every secret from GitHub secrets rather than literals', async () => {
    const workflow = await readFile(DEPLOY, 'utf8');

    for (const name of [
      'CLOUDFLARE_API_TOKEN',
      'CLOUDFLARE_ACCOUNT_ID',
      'SUPABASE_SERVICE_ROLE_KEY',
      'RESEND_API_KEY',
      'CRON_SECRET',
      'VAPID_PRIVATE_KEY',
    ]) {
      expect(workflow).toContain(`${name}: \${{ secrets.${name} }}`);
    }
  });

  it('does not interpolate the dispatch input directly into a shell command', async () => {
    const workflow = await readFile(DEPLOY, 'utf8');
    const runBlocks = workflow.match(/run: \|[\s\S]*?(?=\n {6}- |\n {2}\w|$)/g) ?? [];

    for (const block of runBlocks) {
      expect(block).not.toContain('${{ inputs.');
    }
  });
});

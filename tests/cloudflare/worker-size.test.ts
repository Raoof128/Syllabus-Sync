import { describe, expect, it } from 'vitest';
import { evaluateWorkerSize, parseGzipKiB } from '../../tools/cloudflare/check-worker-size.mjs';

type SizeResult = { gzipKiB: number; ok: boolean; warn: boolean };

const evaluate = evaluateWorkerSize as (content: string) => SizeResult;
const parse = parseGzipKiB as (content: string) => number;

function dryRunLog(measurement: string): string {
  return [
    'Total Upload: 8123.45 KiB / gzip: ' + measurement,
    'Your Worker has access to the following bindings:',
    '- Vars:',
    '  - DEPLOYMENT_PLATFORM: "cloudflare"',
    '--dry-run: exiting now.',
  ].join('\n');
}

describe('Worker compressed size gate', () => {
  it('passes without warning below the free-plan threshold', () => {
    const result = evaluate(dryRunLog('2295.89 KiB'));

    expect(result.gzipKiB).toBeCloseTo(2295.89, 2);
    expect(result.ok).toBe(true);
    expect(result.warn).toBe(false);
  });

  it('passes with a warning above the free-plan threshold', () => {
    const result = evaluate(dryRunLog('3000.00 KiB'));

    expect(result.ok).toBe(true);
    expect(result.warn).toBe(true);
  });

  it('fails above the hard migration limit', () => {
    const result = evaluate(dryRunLog('9800.00 KiB'));

    expect(result.ok).toBe(false);
  });

  it('normalises MiB measurements to KiB', () => {
    expect(parse(dryRunLog('2.50 MiB'))).toBeCloseTo(2560, 2);
    expect(evaluate(dryRunLog('10.00 MiB')).ok).toBe(false);
  });

  it('uses the last measurement when several are printed', () => {
    const content = [dryRunLog('1000.00 KiB'), dryRunLog('9800.00 KiB')].join('\n');

    expect(parse(content)).toBeCloseTo(9800, 2);
  });

  it('throws when no gzip measurement is present', () => {
    expect(() => parse('Total Upload: 8123.45 KiB\n--dry-run: exiting now.')).toThrow(
      'No gzip upload measurement found',
    );
  });

  it('treats the documented boundaries as inclusive-pass', () => {
    expect(evaluate(dryRunLog('9728.00 KiB')).ok).toBe(true);
    expect(evaluate(dryRunLog('9728.01 KiB')).ok).toBe(false);
    expect(evaluate(dryRunLog('2867.20 KiB')).warn).toBe(false);
  });
});

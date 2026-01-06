import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';

async function logComputedStylesForViolations(page: any, results: any, testInfo: any) {
  const colorViolations = results.violations.filter((v: any) => v.id === 'color-contrast');
  if (!colorViolations.length) return;

  // Utility: in-page computation to extract styles, pseudo-element info and ancestor states
  async function computeViaSelector(sel: string) {
    return await page.evaluate(({ sel }: { sel: string }) => {
      function findVisible(nodes: Element[]) {
        return nodes.find((n: Element) => {
          try {
            const rect = (n as HTMLElement).getBoundingClientRect();
            return rect.width > 0 || rect.height > 0;
          } catch {
            return false;
          }
        });
      }

      function getBgColor(el: Element | null) {
        let cur: any = el;
        while (cur) {
          try {
            const cs = getComputedStyle(cur);
            const bg = cs.backgroundColor;
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
          } catch (e) {}
          cur = cur.parentElement;
        }
        return getComputedStyle(document.documentElement).backgroundColor || 'transparent';
      }

      function computeForEl(el: Element | null) {
        if (!el) return null;
        try {
          const cs = getComputedStyle(el as Element);
          const before = getComputedStyle(el as Element, '::before');
          const after = getComputedStyle(el as Element, '::after');

          // get ancestor opacity/blend states
          const ancestors: any[] = [];
          let cur: any = el;
          while (cur) {
            try {
              const a = getComputedStyle(cur);
              if (a.opacity && a.opacity !== '1') ancestors.push({ node: cur.tagName, opacity: a.opacity });
              if (a.mixBlendMode && a.mixBlendMode !== 'normal') ancestors.push({ node: cur.tagName, mixBlendMode: a.mixBlendMode });
            } catch (e) {}
            cur = cur.parentElement;
          }

          return {
            color: cs.color,
            webkitTextFillColor: cs.getPropertyValue('-webkit-text-fill-color'),
            opacity: cs.opacity,
            mixBlendMode: cs.mixBlendMode,
            backgroundColor: getBgColor(el),
            pseudoBefore: { color: before.color, backgroundColor: before.backgroundColor, content: before.content, opacity: before.opacity },
            pseudoAfter: { color: after.color, backgroundColor: after.backgroundColor, content: after.content, opacity: after.opacity },
            ancestors,
          };
        } catch (e) {
          return { error: String(e) };
        }
      }

      try {
        const nodes = Array.from(document.querySelectorAll(sel));
        if (!nodes || nodes.length === 0) return null;
        const visible = findVisible(nodes) || nodes[0];
        const computed = computeForEl(visible);

        // collect text-bearing descendants for more granular color checks
        const descendants = Array.from(visible.querySelectorAll('*')).filter((el: Element) => {
          try { return (el.textContent || '').trim().length > 0; } catch { return false; }
        }).slice(0, 30).map((el: Element) => {
          const cs = getComputedStyle(el as Element);
          const rect = (el as HTMLElement).getBoundingClientRect();
          return {
            tag: el.tagName,
            text: (el.textContent || '').trim().slice(0, 200),
            color: cs.color,
            webkitTextFillColor: cs.getPropertyValue('-webkit-text-fill-color'),
            backgroundColor: getBgColor(el),
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          };
        });

        return Object.assign({ computed }, { descendants });
      } catch (e) {
        return { error: String(e) };
      }
    }, { sel });
  }

  async function computeViaSnippet(snippet: string, debugAttr: string) {
    return await page.evaluate(({ snippet, debugAttr }: { snippet: string; debugAttr: string }) => {
      function getBgColor(el: Element | null) {
        let cur: any = el;
        while (cur) {
          try {
            const cs = getComputedStyle(cur);
            const bg = cs.backgroundColor;
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
          } catch {
          }
          cur = cur.parentElement;
        }
        return getComputedStyle(document.documentElement).backgroundColor || 'transparent';
      }

      function computeForEl(el: Element | null) {
        if (!el) return null;
        try {
          const cs = getComputedStyle(el as Element);
          const before = getComputedStyle(el as Element, '::before');
          const after = getComputedStyle(el as Element, '::after');
          const ancestors: any[] = [];
          let cur: any = el;
          while (cur) {
            try {
              const a = getComputedStyle(cur);
              if (a.opacity && a.opacity !== '1') ancestors.push({ node: cur.tagName, opacity: a.opacity });
              if (a.mixBlendMode && a.mixBlendMode !== 'normal') ancestors.push({ node: cur.tagName, mixBlendMode: a.mixBlendMode });
            } catch (e) {}
            cur = cur.parentElement;
          }

          return {
            color: cs.color,
            webkitTextFillColor: cs.getPropertyValue('-webkit-text-fill-color'),
            opacity: cs.opacity,
            mixBlendMode: cs.mixBlendMode,
            backgroundColor: getBgColor(el),
            pseudoBefore: { color: before.color, backgroundColor: before.backgroundColor, content: before.content, opacity: before.opacity },
            pseudoAfter: { color: after.color, backgroundColor: after.backgroundColor, content: after.content, opacity: after.opacity },
            ancestors,
          };
        } catch (e) {
          return { error: String(e) };
        }
      }

      // Try matching by outerHTML snippet first
      const nodes = Array.from(document.querySelectorAll('*')) as Element[];
      const match = nodes.find((n) => {
        try {
          return n.outerHTML && n.outerHTML.includes(snippet);
        } catch (e) { return false; }
      });

      if (match) {
        try {
          match.setAttribute(debugAttr, '1');
        } catch (e) {}
        return { computed: computeForEl(match), debugAttr };
      }

      // fallback: match by innerText content snippet
      const textMatch = nodes.find((n) => {
        try { return n.textContent && n.textContent.includes(snippet.replace(/<[^>]+>/g, '').slice(0, 100)); } catch (e) { return false; }
      });
      if (textMatch) {
        try { textMatch.setAttribute(debugAttr, '1'); } catch (e) {}
        return { computed: computeForEl(textMatch), debugAttr };
      }

      return null;
    }, { snippet, debugAttr });
  }

  // capture root CSS custom properties for debugging (tokens may differ on page)
  const rootVars = await page.evaluate(() => ({
    mqContent: getComputedStyle(document.documentElement).getPropertyValue('--mq-content'),
    cContent: getComputedStyle(document.documentElement).getPropertyValue('--c-content'),
    mqContentSecondary: getComputedStyle(document.documentElement).getPropertyValue('--mq-content-secondary'),
    cContentSecondary: getComputedStyle(document.documentElement).getPropertyValue('--c-content-secondary'),
    mqBackground: getComputedStyle(document.documentElement).getPropertyValue('--mq-background'),
    cBackground: getComputedStyle(document.documentElement).getPropertyValue('--c-background'),
  }));

  for (let vIndex = 0; vIndex < colorViolations.length; vIndex++) {
    const violation = colorViolations[vIndex];
    for (let nIndex = 0; nIndex < violation.nodes.length; nIndex++) {
      const node = violation.nodes[nIndex];
      const selector = node.target && node.target[0];
      const info: any = { selector, html: node.html, failureSummary: node.failureSummary, rootVars };

      let computed: any = null;
      let debugAttr: string | null = null;

      // Try selector-based computation (safe evaluate arg passing)
      if (selector) {
        try {
          computed = await computeViaSelector(selector);
        } catch (err) {
          info.selectorError = String(err);
        }
      }

      // If selector lookup failed or returned null, try snippet-based matching
      if (!computed) {
        try {
          const snippet = (node.html || '').slice(0, 250);
          debugAttr = `data-axe-debug-v${vIndex}-n${nIndex}`;
          const matched = await computeViaSnippet(snippet, debugAttr);
          if (matched && matched.debugAttr) {
            computed = matched.computed;
            // take screenshot of annotated element
            try {
              const pngPath = testInfo.outputPath(`axe-violation-v${vIndex}-n${nIndex}.png`);
              await page.locator(`[${matched.debugAttr}='1']`).first().screenshot({ path: pngPath });
              info.screenshot = pngPath;
              // remove debug attribute
              await page.evaluate(({ dbgAttr }: { dbgAttr: string }) => { const n = document.querySelector(`[${dbgAttr}='1']`); if (n) n.removeAttribute(dbgAttr); }, { dbgAttr: matched.debugAttr });
            } catch (err) {
              info.screenshotError = String(err);
            }
          }
        } catch (err) {
          info.searchError = String(err);
        }
      }

      // If we still have no computed info, note that
      if (!computed) info.computed = null;
      else info.computed = computed;

      // Persist results for offline analysis
      const outPath = testInfo.outputPath(`axe-violation-v${vIndex}-n${nIndex}.json`);
      try {
        await fs.promises.writeFile(outPath, JSON.stringify(info, null, 2));
        console.log('Wrote computed style info to', outPath);
      } catch (err) {
        console.error('Failed to write computed style info', err);
      }

      console.log(`Axe color-contrast failure: selector=${selector} summary=${node.failureSummary}`);
      if (info.computed) console.log('Computed:', info.computed);
    }
  }
}

test.describe('Accessibility Tests', () => {
  test('Home page should pass accessibility checks', async ({ page }, testInfo) => {
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');
    // Ensure main content is present and fully painted
    try {
      await page.waitForSelector('#main-content', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(100); // let CSS / font paint settle
    } catch (e) {
      // continue - tests will still run but diagnostics may show null computed styles
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length) {
      await logComputedStylesForViolations(page, accessibilityScanResults, testInfo);
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Calendar page should pass accessibility checks', async ({ page }, testInfo) => {
    await page.goto('/calendar');
    await page.waitForLoadState('domcontentloaded');
    try {
      await page.waitForSelector('#main-content', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(100);
    } catch (e) {}

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length) {
      await logComputedStylesForViolations(page, accessibilityScanResults, testInfo);
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Settings page should pass accessibility checks', async ({ page }, testInfo) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length) {
      await logComputedStylesForViolations(page, accessibilityScanResults, testInfo);
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Map page should pass accessibility checks', async ({ page }, testInfo) => {
    await page.goto('/map');
    await page.waitForLoadState('domcontentloaded');
    try {
      await page.waitForSelector('#main-content', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(100);
    } catch (e) {}

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length) {
      await logComputedStylesForViolations(page, accessibilityScanResults, testInfo);
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

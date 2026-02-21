import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BROCHURE = path.resolve(__dirname, '../brochure-assets/gitbusters-brochure.html');
const OUT = path.resolve(__dirname, '../brochure-assets/brochure-screenshots');

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`file://${BROCHURE}`);
  await page.waitForTimeout(3000); // Let components render + first auto-advance

  // 1. Full page top — masthead + title
  await page.screenshot({ path: path.join(OUT, '01-masthead.png') });

  // 2. Scroll to executive summary
  await page.evaluate(() => window.scrollBy(0, 900));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '02-executive-summary.png') });

  // 3. Scroll to first DemoPlayer (Developer section)
  const devSection = page.locator('#section-developer');
  if (await devSection.count()) {
    await devSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT, '03-developer-section.png') });
  }

  // 4. Scroll down to see the first DemoPlayer viewport
  await page.evaluate(() => {
    const vp = document.querySelector('#section-developer .video-player, #section-developer [style*="border-radius: 10px"]');
    if (vp) vp.scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, '04-developer-demo-player.png') });

  // 5. Maintainer section
  const maintainerSection = page.locator('#section-maintainer');
  if (await maintainerSection.count()) {
    await maintainerSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT, '05-maintainer-section.png') });
  }

  // 6. Enterprise section
  const enterpriseSection = page.locator('#section-enterprise');
  if (await enterpriseSection.count()) {
    await enterpriseSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT, '06-enterprise-section.png') });
  }

  // 7. Admin section
  const adminSection = page.locator('#section-admin');
  if (await adminSection.count()) {
    await adminSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT, '07-admin-section.png') });
  }

  // 8. Full page screenshot (clipped to see the whole thing)
  await page.screenshot({ path: path.join(OUT, '08-full-page.png'), fullPage: true });

  await browser.close();
  console.log(`Screenshots saved to ${OUT}`);
}

run().catch(console.error);

import { test, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '..', '..', 'brochure-assets', 'screenshots');

/** Timestamp of when the current test started (ms since epoch). */
let testStartTime: number = 0;

/**
 * Call at the very beginning of each test to start the clock.
 * All subsequent takeScreenshot() calls record elapsed seconds from this point.
 */
export function markTestStart() {
  testStartTime = Date.now();
}

/**
 * Take a full-page screenshot, attach it to the Playwright report,
 * save it to disk for the brochure generator, and record the timestamp.
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.waitForTimeout(500);

  const elapsedSeconds = testStartTime > 0 ? (Date.now() - testStartTime) / 1000 : 0;

  const screenshot = await page.screenshot({ fullPage: true });

  // Attach to Playwright report
  await test.info().attach(name, {
    body: screenshot,
    contentType: 'image/png',
  });

  // Also save to disk for the brochure
  // Derive the story name from the test title
  const testTitle = test.info().title || 'unknown';
  const storySlug = testTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const storyDir = path.join(SCREENSHOTS_DIR, storySlug);
  fs.mkdirSync(storyDir, { recursive: true });
  fs.writeFileSync(path.join(storyDir, `${name}.png`), screenshot);

  // Save timestamp to JSON file for the brochure video player
  const timestampFile = path.join(storyDir, 'timestamps.json');
  let timestamps: Record<string, number> = {};
  if (fs.existsSync(timestampFile)) {
    try {
      timestamps = JSON.parse(fs.readFileSync(timestampFile, 'utf-8'));
    } catch {
      timestamps = {};
    }
  }
  timestamps[name] = elapsedSeconds;
  fs.writeFileSync(timestampFile, JSON.stringify(timestamps, null, 2));
}

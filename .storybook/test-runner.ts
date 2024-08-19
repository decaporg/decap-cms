import type { TestRunnerConfig } from '@storybook/test-runner';
import { injectAxe, checkA11y } from 'axe-playwright';

import { waitForPageReady } from '@storybook/test-runner';

import { toMatchImageSnapshot } from 'jest-image-snapshot';

const config: TestRunnerConfig = {
  setup() {
    expect.extend({ toMatchImageSnapshot });
  },
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    // Awaits for the page to be loaded and available including assets (e.g., fonts)
    // await waitForPageReady(page);

    // Checks for accessibility issues
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });

    // Generates a DOM snapshot file based on the story identifier
    const elementHandler = await page.$('#storybook-root');
    const innerHTML = await elementHandler.innerHTML();
    expect(innerHTML).toMatchSnapshot();

    // Generates a Visual snapshot file based on the story identifier
    const image = await elementHandler.screenshot();
    expect(image).toMatchImageSnapshot();
  },
};

export default config;

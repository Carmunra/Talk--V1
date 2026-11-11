import { defineConfig } from 'cypress';
export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:3000',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: false,
  },
  video: false,
  screenshotOnRunFailure: true,
  defaultCommandTimeout: 10000,
  retries: { runMode: 1, openMode: 0 },
});

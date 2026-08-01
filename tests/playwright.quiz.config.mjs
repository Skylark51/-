import{defineConfig}from"playwright/test";
export default defineConfig({testDir:".",testMatch:"quiz-ui.browser.spec.mjs",timeout:90000,workers:1,reporter:"list",use:{baseURL:"http://127.0.0.1:4173",headless:true}});

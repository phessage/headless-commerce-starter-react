import { defineConfig, devices } from "@playwright/test";
if (
  !process.env.VITE_HEADLESS_API_URL ||
  !process.env.VITE_HEADLESS_PUBLISHABLE_KEY
) {
  throw new Error(
    "Live E2E requires VITE_HEADLESS_API_URL and VITE_HEADLESS_PUBLISHABLE_KEY",
  );
}
export default defineConfig({
  testDir: "e2e-live",
  use: { baseURL: "http://127.0.0.1:4174" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4174",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
  },
});

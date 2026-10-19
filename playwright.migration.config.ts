import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

const baseURL = process.env.MIGRATION_BASE_URL ?? "http://127.0.0.1:4321";
const port = new URL(baseURL).port || "4321";

export default defineConfig({
	...base,
	use: {
		...base.use,
		baseURL,
		trace: "off",
		launchOptions: {
			args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
		},
	},
	webServer: {
		command: `pnpm.cmd preview --host 127.0.0.1 --port ${port}`,
		url: baseURL,
		reuseExistingServer: true,
		timeout: 120_000,
	},
});

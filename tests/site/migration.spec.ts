import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.use({
	launchOptions: {
		args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
	},
});

test.describe("personal Mizuki to Shirone migration", () => {
	test.setTimeout(90_000);

	test("preserves identity, full MapleMono, Live2D and persistent navigation", async ({
		page,
	}) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));
		const modelResources: string[] = [];
		page.on("response", (response) => {
			if (
				response.ok() &&
				/\/pio\/UG\/.*(?:moc3|webp|png|model3\.json)/.test(response.url())
			)
				modelResources.push(response.url());
		});
		await page.goto("/");
		await expect(page).toHaveTitle(/from alisa/);
		await expect(page.locator("body")).toContainText("alisa22580");
		await expect(
			page.locator('.pio-container[data-model-loaded="true"]'),
		).toBeVisible({ timeout: 40_000 });
		expect(modelResources.some((url) => url.endsWith(".moc3"))).toBe(true);
		expect(modelResources.some((url) => /\.(webp|png)$/.test(url))).toBe(true);
		await page.evaluate(async () => {
			await document.fonts.ready;
		});
		const font = await page.evaluate(() => ({
			body: getComputedStyle(document.body).fontFamily,
			loaded: [...document.fonts]
				.filter((f) => f.status === "loaded")
				.map((f) => f.family),
		}));
		expect(font.body).toContain("MapleMono-NF-CN-Regular");
		expect(font.loaded.some((family) => family.includes("MapleMono"))).toBe(
			true,
		);
		await page.screenshot({
			path: "test-results/migration-home-desktop-viewport.png",
		});
		await page.screenshot({
			path: "test-results/migration-home-desktop.png",
			fullPage: true,
		});
		await page
			.locator("#pio")
			.screenshot({ path: "test-results/migration-live2d.png" });

		await page.evaluate(() => {
			(
				window as unknown as { migrationCanvas: Element | null }
			).migrationCanvas = document.querySelector("#pio");
		});
		await page.locator('#navbar a[href="/archive/"]').first().click();
		await expect(page).toHaveURL(/\/archive\//);
		await expect(page.locator("html")).not.toHaveClass(/is-changing/);
		expect(
			await page.evaluate(
				() =>
					(window as unknown as { migrationCanvas: Element | null })
						.migrationCanvas === document.querySelector("#pio"),
			),
		).toBe(true);
		await expect(
			page.locator('.pio-container[data-model-loaded="true"]'),
		).toBeVisible();

		const model = page.locator("#pio");
		const box = await model.boundingBox();
		expect(box).not.toBeNull();
		if (!box) throw new Error("Live2D canvas is missing");
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.mouse.move(
			box.x + box.width / 2 + 110,
			box.y + box.height / 2 - 40,
			{ steps: 10 },
		);
		await page.mouse.up();
		const moved = await model.boundingBox();
		expect(moved?.x).toBeGreaterThan(box.x + 50);

		await page
			.locator('.pio-action [aria-label="隐藏看板娘"]')
			.evaluate((el: HTMLElement) => el.click());
		await expect(page.locator(".pio-container")).toHaveClass(/pio-hidden/);
		await page.getByRole("button", { name: "显示看板娘" }).click();
		await expect(page.locator(".pio-container")).not.toHaveClass(/pio-hidden/);
		await page.locator('.pio-action [aria-label="隐藏看板娘"]').evaluate((el: HTMLElement) => el.click());
		const showButton = page.getByRole("button", { name: "显示看板娘" });
		const bubble = await showButton.boundingBox();
		if (!bubble) throw new Error("Restore button is missing");
		await page.mouse.move(bubble.x + bubble.width / 2, bubble.y + bubble.height / 2);
		await page.mouse.down();
		await page.mouse.move(bubble.x + bubble.width / 2 + 60, bubble.y + bubble.height / 2, { steps: 8 });
		await page.mouse.up();
		await expect(page.locator(".pio-container")).toHaveClass(/pio-hidden/);
		await showButton.focus();
		await showButton.press("Enter");
		await expect(page.locator(".pio-container")).not.toHaveClass(/pio-hidden/);
		expect(errors).toEqual([]);
	});

	test("retains article URLs, Chinese content, code font and current contest post", async ({
		page,
	}) => {
		for (const route of [
			"/posts/2026-ccpc-changchun/",
			"/posts/lanqiao-cpp-b-common/",
			"/friends/",
			"/moments/",
			"/anime/",
			"/projects/",
			"/timeline/",
			"/about/",
		]) {
			const response = await page.goto(route);
			expect(response?.status(), route).toBe(200);
			await expect(page.locator("main")).toBeVisible();
		}
		await page.goto("/posts/lanqiao-cpp-b-common/");
		await page.evaluate(async () => {
			await document.fonts.ready;
		});
		expect(
			await page
				.locator(".expressive-code pre")
				.first()
				.evaluate((el) => getComputedStyle(el).fontFamily),
		).toContain("MapleMono");
		await page.screenshot({
			path: "test-results/migration-article-desktop.png",
			fullPage: true,
		});
		await page.goto("/posts/2026-ccpc-changchun/");
		await expect(page.locator("main")).toContainText("长春");
	});

	test("mobile keeps custom font and hides the model without loading its resources", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		const modelRequests: string[] = [];
		page.on("request", (request) => {
			if (/\/pio\/(UG|vendor)\//.test(request.url()))
				modelRequests.push(request.url());
		});
		for (const route of [
			"/",
			"/posts/lanqiao-cpp-b-common/",
			"/posts/2026-ccpc-changchun/",
			"/moments/",
		]) {
			await page.goto(route);
			await page.waitForTimeout(800);
			const width = await page.evaluate(() => ({
				scroll: document.documentElement.scrollWidth,
				viewport: window.innerWidth,
			}));
			expect(width.scroll, route).toBeLessThanOrEqual(width.viewport + 1);
			await expect(page.locator(".pio-container")).toBeHidden();
			expect(
				await page
					.locator("body")
					.evaluate((el) => getComputedStyle(el).fontFamily),
			).toContain("MapleMono");
		}
		expect(modelRequests).toEqual([]);
		await page.goto("/");
		await page.screenshot({
			path: "test-results/migration-home-mobile.png",
			fullPage: true,
		});
	});

	test("new music widget uses the Shirone runtime", async ({ page }) => {
		await page.goto("/");
		const player = page.locator("[data-music-player]");
		await expect(player).toBeVisible();
		const audioResponse = page.waitForResponse(
			(response) =>
				response.url().includes("/assets/music/url/dazbee.mp3") &&
				response.ok(),
		);
		await player.getByRole("button", { name: "播放", exact: true }).click();
		await audioResponse;
		await expect(
			player.getByRole("button", { name: "暂停", exact: true }),
		).toBeVisible();
		await player.getByRole("button", { name: "暂停", exact: true }).click();
	});

	test("dark model greeting keeps readable contrast", async ({ page }) => {
		await page.addInitScript(() => localStorage.setItem("theme", "dark"));
		await page.goto("/archive/");
		await expect(page.locator(".pio-dialog.active")).toBeVisible({ timeout: 40_000 });
		const contrast = await new AxeBuilder({ page })
			.include(".pio-container")
			.withRules(["color-contrast"])
			.analyze();
		expect(contrast.violations).toEqual([]);
	});

	test("accessibility on personalized homepage", async ({ page }) => {
		await page.goto("/");
		await page.waitForFunction(() =>
			document.documentElement.style
				.getPropertyValue("--mc-primary")
				.trim()
				.startsWith("#"),
		);
		await page.waitForTimeout(1800);
		const results = await new AxeBuilder({ page })
			.disableRules(["page-has-heading-one"])
			.analyze();
		expect(
			results.violations.map((v) => ({
				id: v.id,
				nodes: v.nodes.map((n) => n.target),
			})),
		).toEqual([]);
	});
});

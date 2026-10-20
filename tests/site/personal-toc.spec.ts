import { expect, test } from "@playwright/test";

for (const width of [390, 900, 1440]) {
	test(`Floating TOC works without sidebar at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		await page.goto("/posts/2026-ccpc-changchun/");
		await page.waitForFunction(() => "__shironeFab" in window);
		const button = page.locator("#fab-toc-btn button");
		await expect(button).toBeVisible();
		await expect(page.locator("#toc")).toHaveCount(0);
		await button.click();
		const panel = page.locator("#floating-toc-panel");
		await expect(panel).toHaveAttribute("aria-hidden", "false");
		const links = panel.locator("a[href^='#']");
		await expect(links).toHaveCount(3);
		await expect(links.first()).toContainText("热身赛");
		const href = await links.nth(1).getAttribute("href");
		await links.nth(1).click();
		await expect(panel).toHaveAttribute("aria-hidden", "true");
		await expect
			.poll(() => page.evaluate(() => decodeURIComponent(location.hash)))
			.toBe(decodeURIComponent(href ?? ""));
		await expect
			.poll(() =>
				page.evaluate(
					(hash) =>
						document
							.getElementById(decodeURIComponent((hash ?? "").slice(1)))
							?.getBoundingClientRect().top,
					href,
				),
			)
			.toBeCloseTo(80, 0);
		// 手机端向下阅读会自动收起操作栏，向上滚动即可重新呼出。
		await page.evaluate(() => window.scrollBy(0, -80));
		await button.click();
		await expect(panel.locator('[aria-current="location"]')).toHaveCount(1);
		await page.keyboard.press("Escape");
		await expect(panel).toHaveAttribute("aria-hidden", "true");
		await expect(button).toBeFocused();
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);
	});
}

test("TOC refreshes across Swup routes and keeps the persistent shell", async ({
	page,
}) => {
	await page.goto("/");
	await page.waitForFunction(
		() => Boolean(window.swup?.hooks) && "__shironeFab" in window,
	);
	await page.evaluate(() => {
		document
			.getElementById("floating-controls")
			?.setAttribute("data-toc-test-shell", "persistent");
		window.swup?.navigate("/posts/2026-ccpc-changchun/");
	});
	await expect(page.locator(".prose")).toBeVisible();
	await page.locator("#fab-toc-btn button").click();
	await expect(page.locator("#floating-toc-tree a")).toHaveCount(3);
	await page.evaluate(() => window.swup?.navigate("/posts/2026-icpcsy/"));
	await page.waitForURL("**/posts/2026-icpcsy/");
	await page.locator("#fab-toc-btn button").click();
	await expect(page.locator("#floating-toc-tree")).not.toContainText(
		"热身赛：",
	);
	const links = page.locator("#floating-toc-tree a");
	expect(await links.count()).toBeGreaterThan(0);
	expect(
		await links.evaluateAll((entries) =>
			entries.every(
				(entry) =>
					!!document.getElementById(
						decodeURIComponent((entry as HTMLAnchorElement).hash.slice(1)),
					),
			),
		),
	).toBe(true);
	expect(
		await page.evaluate(
			() =>
				document
					.getElementById("floating-controls")
					?.getAttribute("data-toc-test-shell") === "persistent",
		),
	).toBe(true);
	await page.evaluate(() => window.swup?.navigate("/skills/"));
	await page.waitForURL("**/skills/");
	await expect(page.locator("#fab-toc-btn")).toBeHidden();
	await expect(page.locator("#floating-toc-tree a")).toHaveCount(0);
});

import AxeBuilder from "@axe-core/playwright";

test("Long TOC scroll highlight, viewport bounds and accessibility", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 700 });
	await page.goto("/posts/lanqiao-cpp-b-common/");
	await page.waitForFunction(() => "__shironeFab" in window);
	await page.locator("#fab-toc-btn button").click();
	const panel = page.locator("#floating-toc-panel");
	await expect(panel).toHaveAttribute("aria-hidden", "false");
	expect(await panel.locator("a").count()).toBeGreaterThan(10);
	await page.evaluate(() =>
		window.scrollTo(0, document.documentElement.scrollHeight),
	);
	await expect(panel.locator('a[aria-current="location"]')).toHaveCount(1);
	await expect(panel.locator("a").last()).toHaveAttribute(
		"aria-current",
		"location",
	);
	const bounds = await panel.boundingBox();
	expect(bounds).not.toBeNull();
	expect(bounds?.y).toBeGreaterThanOrEqual(0);
	expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(700);
	await expect
		.poll(async () => {
			const item = await panel
				.locator('a[aria-current="location"]')
				.boundingBox();
			const content = await page
				.locator("#floating-toc-scroll-content")
				.boundingBox();
			return (
				!!item &&
				!!content &&
				item.y >= content.y - 1 &&
				item.y + item.height <= content.y + content.height + 1
			);
		})
		.toBe(true);
	await page.screenshot({ path: "test-results/toc-desktop.png" });
	const results = await new AxeBuilder({ page })
		.include("#floating-controls")
		.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
		.analyze();
	expect(results.violations).toEqual([]);
});

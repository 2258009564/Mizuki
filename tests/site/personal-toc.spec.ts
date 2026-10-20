import { expect, test } from "@playwright/test";

for (const width of [390, 900]) {
	test(`Floating TOC works on mobile/tablet at ${width}px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 900 });
		await page.goto("/posts/2026-ccpc-changchun/");
		await page.waitForFunction(() => "__shironeFab" in window);
		const button = page.locator("#fab-toc-btn button");
		await expect(button).toBeVisible();
		await expect(page.locator("#toc")).toBeHidden();
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
	await page.setViewportSize({ width: 390, height: 900 });
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

for (const width of [1100, 1440]) {
	test(`Desktop sidebar TOC at ${width}px follows navigation`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 900 });
		await page.goto("/");
		await page.waitForFunction(() => Boolean(window.swup?.hooks));
		await page.evaluate(() => {
			document
				.getElementById("floating-controls")
				?.setAttribute("data-persistent-test", "yes");
			window.swup?.navigate("/posts/2026-ccpc-changchun/");
		});
		await page.waitForURL("**/posts/2026-ccpc-changchun/");
		const toc = page.locator("#toc");
		await expect(toc).toBeVisible();
		await expect(page.locator("#fab-toc-btn")).toBeHidden();
		await expect(toc.locator("a")).toHaveCount(3);
		const target = toc.locator("a").nth(1);
		const href = await target.getAttribute("href");
		await target.click();
		await expect(target).toHaveClass(/m3-blog-toc__item--active/);
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
		await page.evaluate(() => window.swup?.navigate("/posts/2026-icpcsy/"));
		await page.waitForURL("**/posts/2026-icpcsy/");
		await expect(toc.locator("a").first()).toContainText("前言");
		expect(
			await toc
				.locator("a")
				.evaluateAll((entries) =>
					entries.every(
						(entry) =>
							!!document.getElementById(
								decodeURIComponent((entry as HTMLAnchorElement).hash.slice(1)),
							),
					),
				),
		).toBe(true);
		await expect(page.locator("#floating-controls")).toHaveAttribute(
			"data-persistent-test",
			"yes",
		);
		await page.evaluate(
			() =>
				new Promise<void>((resolve) => {
					window.swup?.hooks.once("visit:end", () => resolve());
					window.swup?.navigate("/posts/lanqiao-cpp-b-common/");
				}),
		);
		await page.waitForURL("**/posts/lanqiao-cpp-b-common/");
		await expect.poll(() => toc.locator("a").count()).toBeGreaterThan(10);
		await page.waitForFunction(
			() =>
				!document.documentElement.classList.contains("is-changing") &&
				[...document.querySelectorAll(".onload-animation")].every(
					(el) =>
						(el as HTMLElement).offsetParent === null ||
						getComputedStyle(el).opacity === "1",
				) &&
				document.querySelectorAll("#toc .m3-blog-toc__item--active").length ===
					1,
		);
		// Swup 的回顶动画独立于换页结束；完成后再模拟阅读滚动。
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
		await page.mouse.move(width * 0.6, 400);
		await page.evaluate(() =>
			window.scrollTo({
				top: document.documentElement.scrollHeight,
				behavior: "instant",
			}),
		);

		await expect(toc.locator("a").last()).toHaveClass(
			/m3-blog-toc__item--active/,
		);
		await expect
			.poll(async () => {
				const item = await toc.locator("a").last().boundingBox();
				const bounds = await toc.boundingBox();
				return (
					!!item &&
					!!bounds &&
					item.y >= bounds.y - 1 &&
					item.y + item.height <= bounds.y + bounds.height + 1
				);
			})
			.toBe(true);
		await page.screenshot({ path: `test-results/toc-sidebar-${width}.png` });
		const results = await new AxeBuilder({ page })
			.include("#toc-inner-wrapper")
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze();
		expect(results.violations).toEqual([]);
	});
}

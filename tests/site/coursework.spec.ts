import { expect, test } from "@playwright/test";

test("课程实验：直接访问可见课程、说明和独立下载", async ({ page }) => {
	await page.goto("/coursework/");
	await expect(page.locator('[data-pagefind-meta="title"]')).toBeVisible();
	await expect(
		page.getByText("10 类课程、58 份文件", { exact: false }),
	).toBeVisible();
	await expect(page.locator(".markdown-content h2")).toHaveCount(11);
	const wraps = await page
		.locator(".top-app-bar__nav > [data-nav-group] > .top-app-bar__nav-link")
		.evaluateAll((links) =>
			links.some((link) => {
				const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
				for (let node = walker.nextNode(); node; node = walker.nextNode()) {
					if (!node.textContent?.trim()) continue;
					const range = document.createRange();
					range.selectNodeContents(node);
					if (range.getClientRects().length > 1) return true;
				}
				return false;
			}),
		);
	expect(wraps).toBe(false);
	await page.screenshot({ path: test.info().outputPath("desktop.png") });
	await expect(
		page.locator(
			'a[href^="https://raw.githubusercontent.com/2258009564/software-engineering-24-labs/main/"]',
		),
	).toHaveCount(58);
	await expect(
		page.getByRole("link", { name: "Word 报告制作教程", exact: true }),
	).toHaveAttribute(
		"href",
		"https://blog.alisa22580.com/posts/dsh-word-report-tutorial/",
	);
	await expect(page.locator('#navbar a[href="/coursework/"]')).toHaveAttribute(
		"aria-current",
		"page",
	);
});

test("课程实验：从首页导航进入并保持中文导航和当前页状态", async ({ page }) => {
	await page.goto("/");
	const navbar = page.locator("#navbar");
	await expect(
		navbar.getByRole("button", { name: "链接", exact: true }),
	).toBeVisible();
	await expect(
		navbar.getByRole("button", { name: "我的", exact: true }),
	).toBeVisible();
	await page.waitForFunction(() => Boolean(window.swup));
	await page.evaluate(() => {
		(window as Window & { courseworkNavMarker?: boolean }).courseworkNavMarker =
			true;
	});
	await navbar.getByRole("button", { name: "其他", exact: true }).click();
	await navbar.getByRole("menuitem", { name: "课程实验", exact: true }).click();
	await expect(page).toHaveURL(/\/coursework\/$/);
	await expect(page.locator('[data-pagefind-meta="title"]')).toBeVisible();
	expect(
		await page.evaluate(
			() =>
				(window as Window & { courseworkNavMarker?: boolean })
					.courseworkNavMarker,
		),
	).toBe(true);
	await expect(navbar.locator('a[href="/coursework/"]')).toHaveAttribute(
		"aria-current",
		"page",
	);
});

test("课程实验：手机目录和下载区无横向溢出", async ({ page }) => {
	await page.setViewportSize({ width: 1024, height: 844 });
	await page.goto("/coursework/");
	await expect(page.locator("#nav-drawer-switch")).toBeVisible();
	await expect(page.locator(".top-app-bar__nav")).toBeHidden();
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/coursework/");
	await expect(page.locator('[data-pagefind-meta="title"]')).toBeVisible();
	await page.waitForFunction(() => Boolean(window.swup));
	await page.locator("#nav-drawer-switch").click();
	const drawer = page.locator(".site-drawer__nav");
	await expect(
		drawer.getByRole("button", { name: "其他", exact: true }),
	).toHaveAttribute("aria-expanded", "true");
	await expect(
		drawer.getByRole("link", { name: "课程实验", exact: true }),
	).toBeVisible();
	await page.keyboard.press("Escape");
	await page.screenshot({ path: test.info().outputPath("mobile.png") });
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth,
		),
	).toBe(true);
});

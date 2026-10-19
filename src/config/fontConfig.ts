import type { FontConfig, ResolvedFontOptions } from "../types/fontConfig.ts";
import { withUserConfig } from "../utils/config-overlay.ts";
import { resolveFontOptions as resolve } from "../utils/font-options.ts";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Shirone 全站字体配置指南
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 博客的字体分为 3 种角色（Role），每个角色各司其职：
 *  1. `body`：西文与默认基础正文字体（英文字母、数字、基础标点）
 *  2. `cjk` ：中日韩字体（汉字、日文平假名/片假名、韩文）
 *  3. `mono`：等宽代码字体（文章代码块、行内代码、终端输出）
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 【常见修改场景】
 * ─────────────────────────────────────────────────────────────────────────────
 * 场景 A：完全使用系统默认字体（零字体打包，极速加载，最省流量）
 *   - 将 `mode` 设置为 `"system"`，并将 `fontFamilies` 设为空数组 `[]`。
 *
 * 场景 B：更换本地中文字体或英文字体（.woff2 文件）
 *   1. 准备你的 `.woff2` 字体文件，放入项目 `src/assets/fonts/` 目录下；
 *   2. 找到对应角色的配置（如 `role: "cjk"` 或 `role: "body"`）；
 *   3. 设置 `source: "local"`，并在 `file` 中填入你的字体路径（例如 `"src/assets/fonts/MyFont.woff2"`）；
 *   4. 将 `family` 设为该字体的真实族名称。
 *
 * 场景 C：使用 npm 的 Fontsource 字体包
 *   1. 安装字体包（如 `pnpm.cmd add @fontsource/inter`）；
 *   2. 设置 `source: "fontsource"`，并在 `file` 中填入对应的 CSS 路径（如 `"@fontsource/inter/400.css"`）；
 *   3. 将 `family` 设为对应的字体名称（如 `"Inter"`）。
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 【修改后的验证命令】
 *   在终端依次执行：
 *   1. `npx.cmd astro check`  -> 校验配置与页面语法
 *   2. `pnpm.cmd build`        -> 执行生产构建与字体打包
 *   3. `pnpm.cmd fonts:check`  -> 校验字体格式与体积预算
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const fontConfig: FontConfig = withUserConfig("font", {
	mode: "custom",
	fontFamilies: [
		{
			id: "maple-body",
			family: "MapleMono-NF-CN-Regular",
			role: "body",
			source: "local",
			variants: [
				{
					file: "src/assets/fonts/MapleMono-NF-CN-Regular.woff2",
					weight: 400,
					style: "normal",
				},
			],
			fallback: ["system-ui", "sans-serif"],
			display: "swap",
			preload: true,
		},
		{
			id: "maple-cjk",
			family: "MapleMono-NF-CN-Regular",
			role: "cjk",
			source: "local",
			variants: [
				{
					file: "src/assets/fonts/MapleMono-NF-CN-Regular.woff2",
					weight: 400,
					style: "normal",
				},
			],
			fallback: ["system-ui", "sans-serif"],
			display: "swap",
			preload: false,
		},
		{
			id: "maple-mono",
			family: "MapleMono-NF-CN-Regular",
			role: "mono",
			source: "local",
			variants: [
				{
					file: "src/assets/fonts/MapleMono-NF-CN-Regular.woff2",
					weight: 400,
					style: "normal",
				},
			],
			fallback: ["ui-monospace", "monospace"],
			display: "swap",
			preload: false,
		},
	],
	subsetting: {
		enable: false,
		includeContent: true,
		includeI18n: true,
		includeConfig: true,
		includeCommon: true,
		allowRemoteText: false,
	},
	budget: {
		maxTotalBytes: 12582912,
		maxFamilyBytes: 12582912,
	},
});

/** 经过校验与标准化处理后的字体配置对象，由 Astro 模板与 CSS 消费 */
export const resolvedFontOptions: ResolvedFontOptions = resolve(fontConfig);

/** 字体配置解析与校验函数 */
export const resolveFontOptions: (config: FontConfig) => ResolvedFontOptions =
	resolve;

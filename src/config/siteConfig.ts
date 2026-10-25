import type { SiteConfig } from "@/types/config";
import type {
	ResolvedTextureOptions,
	TextureConfig,
} from "@/types/textureConfig";
import { withUserConfig } from "../utils/config-overlay.ts";

/**
 * 站点核心配置：标题 / 语言 / 主题色（HCT 动态配色）/ 横幅 / 目录 / 进度条 / favicon。
 * 类型见 src/types/config.ts。
 */
export const siteConfig: SiteConfig = withUserConfig("site", {
	site: "https://blog.alisa22580.com/",
	base: "/",
	title: "from alisa",
	subtitle: "主页",
	topAppBar: {
		contentAlign: "center",
	},
	displaySettings: {
		colorStyle: true,
		colorSpec: true,
		wallpaperMode: true,
		layoutMode: true,
		reduceMotion: true,
		texture: true,
	},
	lang: "zh_CN",
	timeZone: "Asia/Shanghai",
	themeColor: {
		hue: 345,
		fixed: false,
		style: "tonalSpot",
		spec: "2025",
	},
	wallpaperMode: {
		defaultMode: "banner",
	},
	texture: {
		enable: true,
		defaultPreset: "starlight",
		defaultOpacity: 0.12,
		allowMotion: true,
	},
	banner: {
		src: {
			desktop: [
				"/assets/desktop-banner/wp01.webp",
				"/assets/wallpaper-engine/we-3589501086-sora.webp",
				"/assets/desktop-banner/wp02.webp",
				"/assets/desktop-banner/pc2.webp",
				"/assets/wallpaper-engine/we-3398909502-miyako.webp",
				"/assets/desktop-banner/wp06.webp",
				"/assets/desktop-banner/wp09.webp",
				"/assets/wallpaper-engine/we-2073577741-nine.webp",
				"/assets/desktop-banner/pc3.webp",
				"/assets/desktop-banner/wp12.webp",
				"/assets/wallpaper-engine/we-2788932765-sorairo.webp",
				"/assets/desktop-banner/wp13.webp",
				"/assets/desktop-banner/pc4.webp",
				"/assets/wallpaper-engine/we-3323836229-nine.webp",
				"/assets/desktop-banner/wp14.webp",
				"/assets/desktop-banner/wp15.webp",
				"/assets/wallpaper-engine/we-3324374235-nine.webp",
				"/assets/desktop-banner/pc7.webp",
				"/assets/desktop-banner/wp16.webp",
				"/assets/wallpaper-engine/we-2451341185-haruka.webp",
				"/assets/desktop-banner/wp18.webp",
				"/assets/desktop-banner/pc8.webp",
			],
			mobile: [
				"/assets/mobile-banner/an5.webp",
				"/assets/mobile-banner/an3.webp",
				"/assets/mobile-banner/an2.webp",
				"/assets/mobile-banner/an4.webp",
			],
		},
		position: "center",
		dim: {
			enable: true,
			opacity: 0.24,
		},
		homeText: {
			enable: true,
			title: "Alisa 的小站",
			switchable: true,
			subtitle: [
				"你好喵，欢迎来访！",
				"tell the world who i am and what i wanna do",
				"为了打 ACM ，我去寺庙求了一签，结果签上显示为凶，问主持解签，主持说你拿歪了，上面写的是区",
				"更多功能正紧锣密鼓地筹备中...，欢迎常来！",
			],
			typewriter: {
				enable: true,
				speed: 100,
				deleteSpeed: 50,
				pauseTime: 2000,
				loop: true,
			},
		},
		carousel: {
			enable: true,
			interval: 3500,
			fadeDuration: 1200,
			animation: "ken-burns",
		},
		waves: {
			enable: true,
		},
	},
	imageOptimization: {
		noReferrerDomains: ["*.hdslb.com"],
	},
	toc: {
		enable: true,
		depth: 2,
	},
	progressIndicator: {
		style: "dual",
	},
	favicon: [
		{
			src: "/favicon/lucide--terminal.svg",
		},
	],
});

/**
 * 解析并返回背景纹理配置选项（包含关闭短路与 0 开销优化判定）
 */
export function resolveTextureOptions(
	config: boolean | TextureConfig | undefined = siteConfig.texture,
	displaySettingsTexture: boolean = siteConfig.displaySettings?.texture ?? true,
): ResolvedTextureOptions {
	if (config === false || config === undefined) {
		return {
			enable: false,
			defaultPreset: "none",
			defaultOpacity: 0.12,
			allowMotion: false,
		};
	}

	if (config === true) {
		return {
			enable: true,
			defaultPreset: "starlight",
			defaultOpacity: 0.12,
			allowMotion: true,
		};
	}

	const enable = config.enable ?? true;
	const defaultPreset = config.defaultPreset ?? "starlight";
	const defaultOpacity = config.defaultOpacity ?? 0.12;
	const allowMotion = config.allowMotion ?? true;

	// 性能短路优化：
	// 如果配置 enable: false，或者 defaultPreset: "none" 且显示设置面板未允许切换（访客也无法开启），
	// 则自动视为完全关闭以达成零 DOM、零 CSS、零运行时代价。
	const effectiveEnable =
		enable && (defaultPreset !== "none" || displaySettingsTexture);

	return {
		enable: effectiveEnable,
		defaultPreset,
		defaultOpacity,
		allowMotion,
	};
}

/** 站点默认配色风格（访客未做选择时的回退值） */
export function getDefaultStyle(): string {
	return siteConfig.themeColor.style;
}

/** 站点默认 Color Spec（2021 / 2025） */
export function getDefaultSpec(): string {
	return siteConfig.themeColor.spec;
}

/** 解析并返回显示设置面板各项开关（未配置时默认 true） */
export function resolveDisplaySettings(): {
	colorStyle: boolean;
	colorSpec: boolean;
	wallpaperMode: boolean;
	layoutMode: boolean;
	reduceMotion: boolean;
	texture: boolean;
} {
	const cfg = siteConfig.displaySettings;
	const textureOpts = resolveTextureOptions(
		siteConfig.texture,
		cfg?.texture ?? true,
	);
	return {
		colorStyle: cfg?.colorStyle ?? true,
		colorSpec: cfg?.colorSpec ?? true,
		wallpaperMode: cfg?.wallpaperMode ?? true,
		layoutMode: cfg?.layoutMode ?? true,
		reduceMotion: cfg?.reduceMotion ?? true,
		texture: textureOpts.enable && (cfg?.texture ?? true),
	};
}

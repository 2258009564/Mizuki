import type { FullscreenWallpaperConfig } from "../types/config";

export const fullscreenWallpaperConfig: FullscreenWallpaperConfig = {
	enable: true,
	src: {
		desktop: [
			"/assets/desktop-banner/wp01.webp",
			"/assets/desktop-banner/wp02.webp",
			"/assets/wallpaper-engine/we-3589501086-sora.webp",
			"/assets/desktop-banner/wp05.webp",
			"/assets/desktop-banner/wp06.webp",
			"/assets/wallpaper-engine/we-3398909502-miyako.webp",
			"/assets/desktop-banner/wp07.webp",
			"/assets/desktop-banner/wp09.webp",
			"/assets/wallpaper-engine/we-2073577741-nine.webp",
			"/assets/desktop-banner/wp10.webp",
			"/assets/desktop-banner/wp11.webp",
			"/assets/wallpaper-engine/we-2788932765-sorairo.webp",
			"/assets/desktop-banner/wp12.webp",
			"/assets/desktop-banner/wp13.webp",
			"/assets/wallpaper-engine/we-3323836229-nine.webp",
			"/assets/desktop-banner/wp14.webp",
			"/assets/desktop-banner/wp15.webp",
			"/assets/wallpaper-engine/we-3324374235-nine.webp",
			"/assets/desktop-banner/wp16.webp",
			"/assets/wallpaper-engine/we-2451341185-haruka.webp",
			"/assets/desktop-banner/wp18.webp",
		],
		mobile: [
			"/assets/mobile-banner/an1.webp",
			"/assets/mobile-banner/an2.webp",
			"/assets/mobile-banner/an3.webp",
			"/assets/mobile-banner/an4.webp",
			"/assets/mobile-banner/an5.webp",
		],
	},
	position: "center",
	carousel: {
		enable: true,
		interval: 5,
	},
	zIndex: -1,
	opacity: 0.8,
	blur: 1,
	switchable: true,
	overlay: {
		opacity: 0.8, // 壁纸不透明度，0-1
		blur: 1.5, // 背景模糊半径（px）
		cardOpacity: 0.8, // 卡片不透明度，0-1
		switchable: {
			opacity: true,
			blur: true,
			cardOpacity: true,
		},
	},
	fullscreen: {
		switchable: {
			opacity: true,
			blur: true,
		},
	},
};

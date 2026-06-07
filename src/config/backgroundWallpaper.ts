import type { FullscreenWallpaperConfig } from "../types/config";

export const fullscreenWallpaperConfig: FullscreenWallpaperConfig = {
	enable: true,
	src: {
		desktop: [
			"/assets/desktop-banner/wp01.jpg",
			"/assets/desktop-banner/wp02.jpg",
			"/assets/desktop-banner/wp05.jpg",
			"/assets/desktop-banner/wp06.jpg",
			"/assets/desktop-banner/wp07.jpg",
			"/assets/desktop-banner/wp09.jpg",
			"/assets/desktop-banner/wp10.jpg",
			"/assets/desktop-banner/wp11.jpg",
			"/assets/desktop-banner/wp12.jpg",
			"/assets/desktop-banner/wp13.jpg",
			"/assets/desktop-banner/wp14.jpg",
			"/assets/desktop-banner/wp15.jpg",
			"/assets/desktop-banner/wp16.jpg",
			"/assets/desktop-banner/wp18.jpg",
		],
		mobile: [
			"/assets/mobile-banner/an1.jpg",
			"/assets/mobile-banner/an2.jpg",
			"/assets/mobile-banner/an3.jpg",
			"/assets/mobile-banner/an4.jpg",
			"/assets/mobile-banner/an5.jpg",
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

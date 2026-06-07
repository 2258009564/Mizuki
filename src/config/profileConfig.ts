import type { ProfileConfig } from "../types/config";

// 个人资料配置
export const profileConfig: ProfileConfig = {
	avatar: "assets/images/alisa22580透明背景.png",
	name: "alisa22580",
	bio: "您想生活在怎样的虚拟世界里？",
	typewriter: {
		enable: true,
		speed: 80,
	},
	links: [
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/2258009564",
		},
		{
			name: "Bilibili",
			icon: "fa7-brands:bilibili",
			url: "https://space.bilibili.com/98732441",
		},
		{
			name: "Codeforces",
			icon: "simple-icons:codeforces",
			url: "https://codeforces.com/profile/alisa22580",
		},
		{
			name: "X",
			icon: "fa7-brands:x-twitter",
			url: "https://x.com/alisa_22580",
		},
	],
};

import type { ProfileConfig } from "@/types/config";
import { withUserConfig } from "../utils/config-overlay.ts";

/**
 * 博主资料：头像 / 名称 / 简介 / 社交链接（侧栏 Profile 卡片、页脚、RSS 作者等消费）。
 * 类型见 src/types/config.ts。
 */
export const profileConfig: ProfileConfig = withUserConfig("profile", {
	avatar: "assets/images/alisa22580-avatar.webp",
	name: "alisa22580",
	bio: "您想生活在怎样的虚拟世界里？",
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
});

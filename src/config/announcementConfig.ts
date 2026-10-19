import type { AnnouncementConfig } from "@/types/announcementConfig";
import { withUserConfig } from "../utils/config-overlay.ts";

/**
 * 公告栏配置
 * 组件显示由 sidebarConfig 统一控制
 */
export const announcementConfig: AnnouncementConfig = withUserConfig(
	"announcement",
	{
		title: "公告",
		content: "记录一些比较面向基础的东西，满足个人的一点创作欲，希望能帮到你。",
		closable: true,
		link: {
			enable: true,
			text: "Learn More",
			url: "/about/",
			external: false,
		},
	},
);

// 「我的」分栏下的工具箱数据。
// 该文件是软件与插件条目的唯一数据源。

export type ToolboxItemType = "software" | "extension";

export interface ToolboxSettingItem {
	label: string;
	value: string;
}

export interface ToolboxItem {
	id: string;
	name: string;
	type: ToolboxItemType;
	description: string;
	platform: string;
	url: string;
	icon: string;
	tags: string[];
	softwareId?: string;
	settings?: ToolboxSettingItem[];
	pluginEnabled?: boolean;
}

export const toolboxData: ToolboxItem[] = [
	{
		id: "vscode",
		name: "Visual Studio Code",
		type: "software",
		description: "日常开发与文档编写的主力编辑器，插件生态完善。",
		platform: "Windows / macOS / Linux",
		url: "https://code.visualstudio.com/",
		icon: "logos:visual-studio-code",
		tags: ["编辑器", "开发"],
		settings: [
			{ label: "主题", value: "暗色主题 + 护眼配色" },
			{ label: "字体", value: "JetBrains Mono / Maple Mono" },
			{ label: "保存行为", value: "保存时自动格式化 + 自动修复可修复项" },
			{ label: "代码规范", value: "ESLint + Prettier 统一规则" },
		],
	},
	{
		id: "obsidian",
		name: "Obsidian",
		type: "software",
		description: "基于 Markdown 的知识管理工具，用于整理项目笔记和草稿。",
		platform: "Windows / macOS / Linux / 移动端",
		url: "https://obsidian.md/",
		icon: "simple-icons:obsidian",
		tags: ["笔记", "Markdown"],
		settings: [
			{ label: "仓库结构", value: "按主题分目录，统一模板与命名规范" },
			{ label: "同步策略", value: "定期备份，重要资料多端同步" },
			{ label: "插件策略", value: "尽量少装高价值插件，避免生态过重" },
		],
	},
	{
		id: "obs-studio",
		name: "OBS Studio",
		type: "software",
		description: "用于录屏与直播，适合做演示、教程录制和分享。",
		platform: "Windows / macOS / Linux",
		url: "https://obsproject.com/",
		icon: "simple-icons:obsstudio",
		tags: ["录屏", "直播"],
		settings: [
			{
				label: "录制格式",
				value: "优先 MKV，后转 MP4，降低中断损坏风险",
			},
			{ label: "输出参数", value: "按场景设置码率、分辨率与帧率" },
			{ label: "场景模板", value: "固定录屏/直播模板，减少重复配置" },
		],
	},
	{
		id: "clash-verge-rev",
		name: "Clash Verge Rev",
		type: "software",
		description:
			"基于 Clash.Meta 内核的代理客户端，用于规则分流与网络调试。",
		platform: "Windows / macOS / Linux",
		url: "https://www.clashverge.dev/",
		icon: "https://www.clashverge.dev/assets/logo.png",
		tags: ["代理", "网络"],
		pluginEnabled: false,
		settings: [
			// { label: "订阅管理", value: "按场景拆分订阅，定期校验可用性" },
			// {
			// 	label: "规则策略",
			// 	value: "按国内/国外与服务类型分组，减少误代理",
			// },
			// { label: "延迟测试", value: "启用自动测速并优先低延迟节点" },
		],
	},
	{
		id: "gkd",
		name: "GKD",
		type: "software",
		description:
			"基于无障碍的 Android 自动点击工具，用于跳过常见开屏广告。",
		platform: "Android",
		url: "https://gkd.li/",
		icon: "material-symbols:touch-app-rounded",
		tags: ["自动化", "Android"],
		pluginEnabled: false,
		settings: [
			// { label: "规则订阅", value: "仅启用常用应用规则，避免误触" },
			// { label: "黑名单", value: "支付与输入类页面强制禁用" },
			// { label: "触发频率", value: "限制触发间隔，降低后台占用" },
		],
	},
	{
		id: "ani",
		name: "Ani",
		type: "software",
		description: "Animeko 客户端，聚合追番与媒体管理体验。",
		platform: "Windows / macOS / Linux / Android",
		url: "https://animeko.org/",
		icon: "https://animeko.org/logo.png",
		tags: ["追番", "媒体"],
		pluginEnabled: false,
		settings: [
			// { label: "数据源", value: "优先稳定源，异常时手动切换" },
			// { label: "字幕偏好", value: "默认简中，保留双语备选" },
			// { label: "播放策略", value: "自动续播 + 记录观看进度" },
		],
	},
	{
		id: "uu-remote",
		name: "UU远程",
		type: "software",
		description: "网易 UU 远程工具，用于跨设备远程连接与协作。",
		platform: "Windows / macOS / iOS / Android",
		url: "https://uuyc.163.com/",
		icon: "material-symbols:devices-rounded",
		tags: ["远程控制", "协作"],
		pluginEnabled: false,
		settings: [
			// { label: "连接方式", value: "优先同局域网直连，外网走中继" },
			// { label: "安全策略", value: "开启访问密码与设备白名单" },
			// { label: "画质设置", value: "按网络状况动态调整分辨率和帧率" },
		],
	},
	{
		id: "prettier",
		name: "Prettier",
		type: "extension",
		description: "自动格式化代码，统一项目代码风格。",
		platform: "VS Code 插件",
		url: "https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode",
		icon: "simple-icons:prettier",
		tags: ["格式化", "代码风格"],
		softwareId: "vscode",
	},
	{
		id: "eslint",
		name: "ESLint",
		type: "extension",
		description: "为 JavaScript/TypeScript 项目提供代码规范检查。",
		platform: "VS Code 插件",
		url: "https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint",
		icon: "mdi:eslint",
		tags: ["Lint", "JavaScript"],
		softwareId: "vscode",
	},
	{
		id: "gitlens",
		name: "GitLens",
		type: "extension",
		description: "增强 Git 可视化能力，便于查看提交历史与代码责任归属。",
		platform: "VS Code 插件",
		url: "https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens",
		icon: "mdi:source-branch",
		tags: ["Git", "历史"],
		softwareId: "vscode",
	},
	{
		id: "tailwind-intellisense",
		name: "Tailwind CSS IntelliSense",
		type: "extension",
		description: "提供 Tailwind CSS 类名补全与内联提示。",
		platform: "VS Code 插件",
		url: "https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss",
		icon: "mdi:tailwind",
		tags: ["CSS", "Tailwind"],
		softwareId: "vscode",
	},
	{
		id: "error-lens",
		name: "Error Lens",
		type: "extension",
		description: "在编辑器内联显示报错与告警信息，定位问题更快。",
		platform: "VS Code 插件",
		url: "https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens",
		icon: "material-symbols:error-outline",
		tags: ["诊断", "DX"],
		softwareId: "vscode",
	},
	{
		id: "dataview",
		name: "Dataview",
		type: "extension",
		description: "为 Obsidian 提供基于查询的笔记数据视图能力。",
		platform: "Obsidian 社区插件",
		url: "https://obsidian.md/plugins?id=dataview",
		icon: "simple-icons:obsidian",
		tags: ["查询", "可视化"],
		softwareId: "obsidian",
	},
	{
		id: "templater",
		name: "Templater",
		type: "extension",
		description: "通过模板与脚本快速生成结构化笔记内容。",
		platform: "Obsidian 社区插件",
		url: "https://obsidian.md/plugins?id=templater-obsidian",
		icon: "simple-icons:obsidian",
		tags: ["模板", "自动化"],
		softwareId: "obsidian",
	},
	{
		id: "move-transition",
		name: "Move Transition",
		type: "extension",
		description: "为 OBS 场景切换和元素运动提供更灵活的动画能力。",
		platform: "OBS 插件",
		url: "https://obsproject.com/forum/resources/move-transition.913/",
		icon: "simple-icons:obsstudio",
		tags: ["场景切换", "动画"],
		softwareId: "obs-studio",
	},
	{
		id: "obs-websocket",
		name: "obs-websocket",
		type: "extension",
		description: "通过 WebSocket 接口实现 OBS 的远程控制与联动自动化。",
		platform: "OBS 插件",
		url: "https://github.com/obsproject/obs-websocket",
		icon: "simple-icons:obsstudio",
		tags: ["自动化", "远程控制"],
		softwareId: "obs-studio",
	},
];

export const getToolboxItemsByType = (type: ToolboxItemType) => {
	return toolboxData.filter((item) => item.type === type);
};

export const getSoftwareItems = () => {
	return toolboxData.filter((item) => item.type === "software");
};

export const getSoftwareById = (softwareId: string) => {
	return toolboxData.find(
		(item) => item.type === "software" && item.id === softwareId,
	);
};

export const getExtensionsBySoftware = (softwareId: string) => {
	return toolboxData.filter(
		(item) => item.type === "extension" && item.softwareId === softwareId,
	);
};

export const getToolboxStats = () => {
	const softwareCount = toolboxData.filter(
		(item) => item.type === "software",
	).length;

	return {
		software: softwareCount,
		total: softwareCount,
	};
};

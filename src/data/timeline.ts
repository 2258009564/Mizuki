import type { TimelineItem } from "@/types/timelineConfig";

// 根据用户提供的简历与获奖经历整理；不包含待学习项。
export const timelineData: TimelineItem[] = [
	{
		title: "CCPC 长春区域赛 · 铜牌",
		date: "2026.10.18",
		category: "achievement",
		subtitle: "中国大学生程序设计竞赛（CCPC）",
		location: "长春",
		description:
			"首次参加 CCPC 区域赛，与队友在长春站获得铜牌。铜牌是这一程的纪念，未解出的题目则留给赛后的补题与复盘。",
		tags: ["CCPC", "算法竞赛", "团队协作"],
		links: [
			{
				label: "长春站参赛记",
				url: "/posts/2026-ccpc-changchun/",
			},
		],
		featured: true,
	},
	{
		title: "软件工程本科学习",
		date: "2024.09 – 2028.09",
		category: "education",
		subtitle: "哈尔滨理工大学",
		description: "软件工程本科在读，预计于 2028 年 9 月毕业。",
		highlights: ["专业排名：10/240", "校级一等奖学金、二等奖学金"],
		tags: ["软件工程", "算法与数据结构"],
		featured: true,
	},
	{
		title: "Raft 共识引擎",
		date: "2026.09 – 2026.10",
		category: "project",
		subtitle: "MIT 6.5840 · Go",
		description:
			"基于 MIT 6.5840 分布式系统课程框架，实现 Raft 共识核心，支持多副本日志复制、节点故障恢复与快照同步。",
		highlights: [
			"实现随机超时选举、心跳维护、日志前缀校验和多数派提交。",
			"利用冲突任期提示优化日志追赶，并防止乱序旧回复覆盖复制进度。",
			"持久化任期、投票与日志，原子保存协议状态与快照；串行交付快照及已提交日志。",
			"简历记录：完成 4 轮完整回归，每轮 28 项官方测试全部通过；启用竞态检测，未报告数据竞争。",
		],
		tags: ["Go", "Raft", "分布式系统", "并发"],
		links: [
			{
				label: "项目仓库",
				url: "https://github.com/2258009564/raft-study",
			},
		],
		featured: true,
	},
	{
		title: "重庆市大学生程序设计大赛 · 金牌",
		date: "2026",
		category: "achievement",
		description: "获得金牌，排名第 12 名。",
		tags: ["C++", "算法竞赛"],
	},
	{
		title: "中国—东盟国际大学生程序设计大赛 · 银牌",
		date: "2026",
		category: "achievement",
		tags: ["C++", "算法竞赛"],
	},
	{
		title: "ICPC 全国邀请赛（沈阳）· 银牌",
		date: "2026",
		category: "achievement",
		tags: ["ICPC", "C++", "算法竞赛"],
	},
	{
		title: "蓝桥杯全国总决赛 · 一等奖",
		date: "2026",
		category: "achievement",
		description: "全国大学生软件和信息技术大赛程序设计全国总决赛一等奖。",
		tags: ["蓝桥杯", "算法竞赛"],
	},
];

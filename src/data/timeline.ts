import type { TimelineItem } from "@/types/timelineConfig";

// 比赛日期取正式赛当日；来源：
// 重庆：https://rl.algoux.cn/ranklist/cqcpc14th
// 东盟：https://ac.nowcoder.com/acm/contest/140485
// 沈阳：https://board.xcpcio.com/?s=sh
// 蓝桥杯：https://jx.cri.cn/20260618/8a49ce96-3e68-7c8a-7df7-cda0286969eb.html
export const timelineData: TimelineItem[] = [
	{
		title: "CCPC 长春区域赛 · 铜牌",
		date: "2026.10.18",
		category: "achievement",
		subtitle: "中国大学生程序设计竞赛（CCPC）",
		location: "长春",
		links: [
			{
				label: "长春站参赛记",
				url: "/posts/2026-ccpc-changchun/",
			},
		],
		featured: true,
	},
	{
		title: "软件工程本科",
		date: "2024.09 – 2028.09",
		category: "education",
		subtitle: "哈尔滨理工大学",
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
		title: "重庆市大学生程序设计大赛 · 金牌（第 12 名）",
		date: "2026.06.14",
		category: "achievement",
	},
	{
		title: "中国—东盟国际大学生程序设计大赛 · 银牌",
		date: "2026.05.31",
		category: "achievement",
	},
	{
		title: "ICPC 全国邀请赛（沈阳）· 银牌",
		date: "2026.07.29",
		category: "achievement",
		links: [
			{
				label: "沈阳站参赛记",
				url: "/posts/2026-icpcsy/",
			},
		],
	},
	{
		title: "蓝桥杯全国总决赛 · 一等奖",
		date: "2026.06.06",
		category: "achievement",
	},
	{
		title: "创建 Codeforces 账号",
		date: "2024.10.05",
		category: "achievement",
		links: [
			{ label: "alisa22580", url: "https://codeforces.com/profile/alisa22580" },
		],
	},
];

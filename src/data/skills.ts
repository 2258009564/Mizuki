import type { SkillItem } from "@/types/skillsConfig";

// 根据用户提供的分布式存储简历整理；不包含待学习项。
export const skillsData: SkillItem[] = [
	{
		name: "C++ / STL",
		description:
			"熟练使用 C++ 与 STL 常用容器和算法，具备算法竞赛中的代码实现与调试经验。",
		icon: "simple-icons:cplusplus",
		category: "programming",
		level: "advanced",
	},
	{
		name: "算法与数据结构",
		description:
			"熟悉动态规划、图论、数论及字符串算法，能够分析时间与空间复杂度并选择合适的数据结构。",
		icon: "material-symbols:account-tree",
		category: "algorithms",
		level: "advanced",
	},
	{
		name: "Go",
		description:
			"在 MIT 6.5840 课程框架中使用 Go 实现 Raft 共识核心，处理协程、RPC 与共享状态同步。",
		icon: "simple-icons:go",
		category: "programming",
		level: "intermediate",
	},
	{
		name: "Raft",
		description:
			"理解选举、日志复制、多数派提交、持久化与快照机制，具备网络异常和节点重启场景下的协议实现与调试经验。",
		icon: "material-symbols:hub",
		category: "distributed",
		level: "intermediate",
	},
	{
		name: "并发与故障恢复",
		description:
			"在 Raft 项目中处理乱序回复、复制进度、快照与日志的顺序交付；使用竞态检测排查数据竞争。",
		icon: "material-symbols:sync",
		category: "distributed",
		level: "intermediate",
	},
	{
		name: "Python",
		description: "了解 Python，可用于辅助编程。",
		icon: "simple-icons:python",
		category: "programming",
		level: "beginner",
	},
	{
		name: "Git / GitHub",
		description: "熟悉 Git 基本操作，使用 Git 与 GitHub 进行项目版本管理。",
		icon: "simple-icons:git",
		category: "tools",
		level: "intermediate",
	},
	{
		name: "Vim / Neovim",
		description: "使用过 Vim、Neovim 及 LazyVim 配置。",
		icon: "simple-icons:neovim",
		category: "tools",
		level: "beginner",
	},
];

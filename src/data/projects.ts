import { profileConfig } from "../config";

// 项目数据配置文件
// 用于管理项目展示页面的数据

export interface Project {
	id: string;
	title: string;
	description: string;
	image: string;
	category: "web" | "mobile" | "desktop" | "other";
	techStack: string[];
	status: "completed" | "in-progress" | "planned";
	liveDemo?: string;
	sourceCode?: string;
	startDate: string;
	endDate?: string;
	featured?: boolean;
	tags?: string[];
	visitUrl?: string;
}

interface GitHubRepo {
	name: string;
	description: string | null;
	language: string | null;
	html_url: string;
	homepage: string | null;
	created_at: string;
	pushed_at: string;
	updated_at: string;
	stargazers_count: number;
	fork: boolean;
	topics?: string[];
	archived?: boolean;
	disabled?: boolean;
}

const FALLBACK_GITHUB_USERNAME = "2258009564";

// 手动控制哪些仓库显示在精选区域
// 请使用 GitHub 上的仓库原名；留空则使用自动精选
const FEATURED_REPO_NAMES: string[] = [
	"2258009564.github.io",
	"SelectEcho",
	"MYWORK",
	"maze-explorer",
];

// 为 true 时，Fork 仓库仍可出现在完整列表，但不会进入精选
const EXCLUDE_FORKS_FROM_FEATURED = true;

// 设为 true 可同时在完整项目列表中隐藏 Fork 仓库
const HIDE_FORK_PROJECTS = false;

const AUTO_FEATURED_LIMIT = 3;

// 手动覆盖项目状态（仓库名 -> 状态）
// 仅对从 GitHub 拉取的数据生效
const PROJECT_STATUS_OVERRIDE_ENTRIES: Array<[string, Project["status"]]> = [
	["mizuki", "in-progress"],
	["docs-mizuki", "in-progress"],
	["2258009564.github.io", "in-progress"],
];

const fallbackProjectsData: Project[] = [
	{
		id: "mizuki",
		title: "Mizuki",
		description: "Astro blog theme repository.",
		image: "",
		category: "web",
		techStack: ["Astro", "GitHub"],
		status: "in-progress",
		liveDemo: "https://mizuki.mysqil.com",
		sourceCode: "https://github.com/2258009564/Mizuki",
		visitUrl: "https://mizuki.mysqil.com",
		startDate: "2026-03-11",
		endDate: "2026-03-13",
		tags: ["Fork", "Open Source"],
	},
	{
		id: "docs-mizuki",
		title: "Docs-Mizuki",
		description: "Mizuki theme documentation site.",
		image: "",
		category: "web",
		techStack: ["GitHub", "Documentation"],
		status: "in-progress",
		liveDemo: "https://docs.mizuki.mysqil.com/",
		sourceCode: "https://github.com/2258009564/Docs-Mizuki",
		visitUrl: "https://docs.mizuki.mysqil.com/",
		startDate: "2026-03-12",
		endDate: "2026-03-12",
		tags: ["Fork", "Docs"],
	},
	{
		id: "2258009564-github-io",
		title: "2258009564.github.io",
		description: "Personal GitHub Pages repository.",
		image: "",
		category: "web",
		techStack: ["JavaScript", "GitHub Pages"],
		status: "completed",
		sourceCode: "https://github.com/2258009564/2258009564.github.io",
		startDate: "2025-07-18",
		endDate: "2026-03-13",
		featured: true,
		tags: ["Website"],
	},
	{
		id: "mywork",
		title: "MYWORK",
		description: "Personal C++ utility and experiment collection.",
		image: "",
		category: "desktop",
		techStack: ["C++", "GitHub"],
		status: "completed",
		sourceCode: "https://github.com/2258009564/MYWORK",
		startDate: "2024-12-23",
		endDate: "2025-12-04",
		featured: true,
		tags: ["Original"],
	},
	{
		id: "maze-explorer",
		title: "maze-explorer",
		description: "A C++ maze exploration project.",
		image: "",
		category: "desktop",
		techStack: ["C++", "Algorithm"],
		status: "completed",
		sourceCode: "https://github.com/2258009564/maze-explorer",
		startDate: "2025-03-06",
		endDate: "2025-03-09",
		featured: true,
		tags: ["Original"],
	},
];

const WEB_LANGUAGES = new Set([
	"Astro",
	"JavaScript",
	"TypeScript",
	"HTML",
	"CSS",
	"Vue",
	"Svelte",
	"React",
]);

const MOBILE_LANGUAGES = new Set(["Kotlin", "Swift", "Dart", "Objective-C"]);

const DESKTOP_LANGUAGES = new Set(["C", "C++", "C#", "Rust", "Go", "Java"]);

const normalizeRepoName = (name: string) => name.trim().toLowerCase();

const projectStatusOverrideMap = new Map(
	PROJECT_STATUS_OVERRIDE_ENTRIES.map(([repoName, status]) => [
		normalizeRepoName(repoName),
		status,
	]),
);

const sanitizeProjectId = (repoName: string) => {
	return repoName
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
};

const formatDate = (dateStr: string) => {
	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) {
		return new Date().toISOString().slice(0, 10);
	}
	return date.toISOString().slice(0, 10);
};

const parseGitHubUsername = (url: string) => {
	const match = /^https?:\/\/(?:www\.)?github\.com\/([^/?#]+)/i.exec(
		url.trim(),
	);
	return match?.[1];
};

const getGitHubUsername = () => {
	const envUsername = String(
		import.meta.env.PUBLIC_GITHUB_USERNAME ?? "",
	).trim();
	if (envUsername) {
		return envUsername;
	}

	const githubProfileLink = profileConfig.links.find((link) => {
		const normalizedName = link.name.toLowerCase();
		return normalizedName === "github" || link.url.includes("github.com");
	});

	if (githubProfileLink) {
		const username = parseGitHubUsername(githubProfileLink.url);
		if (username) {
			return username;
		}
	}

	return FALLBACK_GITHUB_USERNAME;
};

const classifyCategory = (language: string | null): Project["category"] => {
	if (!language) {
		return "other";
	}
	if (WEB_LANGUAGES.has(language)) {
		return "web";
	}
	if (MOBILE_LANGUAGES.has(language)) {
		return "mobile";
	}
	if (DESKTOP_LANGUAGES.has(language)) {
		return "desktop";
	}
	return "other";
};

const normalizeHomepage = (
	homepage: string | null | undefined,
	sourceCode: string,
) => {
	if (!homepage) {
		return undefined;
	}
	const cleaned = homepage.trim();
	if (!cleaned) {
		return undefined;
	}

	try {
		const parsed = new URL(cleaned);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			return undefined;
		}
		if (parsed.href === sourceCode) {
			return undefined;
		}
		return parsed.href;
	} catch {
		return undefined;
	}
};

const buildTechStack = (repo: GitHubRepo) => {
	const stack = new Set<string>();

	if (repo.language) {
		stack.add(repo.language);
	}

	for (const topic of repo.topics ?? []) {
		const normalizedTopic = topic.replace(/-/g, " ").trim();
		if (normalizedTopic) {
			stack.add(normalizedTopic);
		}
		if (stack.size >= 5) {
			break;
		}
	}

	if (stack.size === 0) {
		stack.add("GitHub");
	}

	return Array.from(stack);
};

const mapRepoToProject = (repo: GitHubRepo): Project => {
	const sourceCode = repo.html_url.trim();
	const visitUrl = normalizeHomepage(repo.homepage, sourceCode);
	const startDate = formatDate(repo.created_at);
	const endDate = formatDate(
		repo.pushed_at || repo.updated_at || repo.created_at,
	);

	return {
		id: sanitizeProjectId(repo.name),
		title: repo.name,
		description:
			repo.description?.trim() || `GitHub repository for ${repo.name}.`,
		image: "",
		category: classifyCategory(repo.language),
		techStack: buildTechStack(repo),
		status:
			projectStatusOverrideMap.get(normalizeRepoName(repo.name)) ??
			"completed",
		liveDemo: visitUrl,
		sourceCode,
		startDate,
		endDate,
		tags: [
			repo.fork ? "Fork" : "Original",
			`${repo.stargazers_count} Stars`,
		],
		visitUrl,
	};
};

const selectFeaturedProjects = (projects: Project[], repos: GitHubRepo[]) => {
	const manualFeaturedSet = new Set(
		FEATURED_REPO_NAMES.map(normalizeRepoName).filter(Boolean),
	);

	if (manualFeaturedSet.size > 0) {
		repos.forEach((repo, index) => {
			if (!manualFeaturedSet.has(normalizeRepoName(repo.name))) {
				return;
			}

			if (EXCLUDE_FORKS_FROM_FEATURED && repo.fork) {
				return;
			}

			projects[index].featured = true;
		});
		return;
	}

	const candidates = repos
		.map((repo, index) => ({ repo, index }))
		.filter(({ repo }) => !EXCLUDE_FORKS_FROM_FEATURED || !repo.fork)
		.slice(0, AUTO_FEATURED_LIMIT);

	if (candidates.length > 0) {
		candidates.forEach(({ index }) => {
			projects[index].featured = true;
		});
		return;
	}

	repos.slice(0, AUTO_FEATURED_LIMIT).forEach((_, index) => {
		projects[index].featured = true;
	});
};

const fetchGitHubRepos = async (username: string): Promise<GitHubRepo[]> => {
	const response = await fetch(
		`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
		{
			headers: {
				Accept: "application/vnd.github+json",
				"User-Agent": "mizuki-projects-module",
			},
		},
	);

	if (!response.ok) {
		throw new Error(
			`GitHub API request failed with status ${response.status}`,
		);
	}

	const repos = (await response.json()) as GitHubRepo[];
	return Array.isArray(repos) ? repos : [];
};

const buildProjectsFromRepos = (repos: GitHubRepo[], username: string) => {
	const normalizedUsername = username.toLowerCase();

	const filteredRepos = repos
		.filter((repo) => !repo.archived && !repo.disabled)
		.filter((repo) => repo.name.toLowerCase() !== normalizedUsername)
		.filter((repo) => !HIDE_FORK_PROJECTS || !repo.fork)
		.sort(
			(a, b) =>
				new Date(b.updated_at).getTime() -
				new Date(a.updated_at).getTime(),
		);

	const projects = filteredRepos.map(mapRepoToProject);
	if (projects.length > 0) {
		selectFeaturedProjects(projects, filteredRepos);
	}

	return projects;
};

const loadProjectsData = async () => {
	const githubUsername = getGitHubUsername();

	try {
		const repos = await fetchGitHubRepos(githubUsername);
		const projects = buildProjectsFromRepos(repos, githubUsername);
		if (projects.length > 0) {
			return projects;
		}
	} catch (error) {
		console.warn("[projects] Failed to load GitHub repositories:", error);
	}

	if (!HIDE_FORK_PROJECTS) {
		return fallbackProjectsData;
	}

	return fallbackProjectsData.filter(
		(project) => !project.tags?.includes("Fork"),
	);
};

export const projectsData: Project[] = await loadProjectsData();

// 获取项目统计信息
export const getProjectStats = () => {
	const total = projectsData.length;
	const completed = projectsData.filter(
		(p) => p.status === "completed",
	).length;
	const inProgress = projectsData.filter(
		(p) => p.status === "in-progress",
	).length;
	const planned = projectsData.filter((p) => p.status === "planned").length;

	return {
		total,
		byStatus: {
			completed,
			inProgress,
			planned,
		},
	};
};

// 按分类获取项目
export const getProjectsByCategory = (category?: string) => {
	if (!category || category === "all") {
		return projectsData;
	}
	return projectsData.filter((p) => p.category === category);
};

// 获取精选项目
export const getFeaturedProjects = () => {
	return projectsData.filter((p) => p.featured);
};

// 获取全部技术栈
export const getAllTechStack = () => {
	const techSet = new Set<string>();
	projectsData.forEach((project) => {
		project.techStack.forEach((tech) => {
			techSet.add(tech);
		});
	});
	return Array.from(techSet).sort();
};

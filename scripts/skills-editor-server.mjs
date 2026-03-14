import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";
import vm from "node:vm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");
const skillsFilePath = path.join(workspaceRoot, "src", "data", "skills.ts");
const editorRoot = path.join(workspaceRoot, "docs", "editor");
const defaultPage = "skills-editor.html";

const HOST = process.env.SKILLS_EDITOR_HOST || "127.0.0.1";
const PORT = Number(process.env.SKILLS_EDITOR_PORT || 4310);
const MAX_PORT_RETRIES = 20;

const CATEGORY_SET = new Set([
	"frontend",
	"backend",
	"database",
	"tools",
	"other",
]);

const LEVEL_SET = new Set(["beginner", "intermediate", "advanced", "expert"]);

const MIME_TYPES = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
};

const sendJson = (res, statusCode, payload) => {
	res.writeHead(statusCode, {
		"Content-Type": "application/json; charset=utf-8",
		"Cache-Control": "no-store",
	});
	res.end(JSON.stringify(payload));
};

const detectEol = (content) => {
	return content.includes("\r\n") ? "\r\n" : "\n";
};

const toNonNegativeInteger = (value) => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0) {
		return 0;
	}
	return Math.trunc(parsed);
};

const normalizeText = (value) => {
	if (typeof value !== "string") {
		return "";
	}
	return value.trim();
};

const normalizeStringArray = (value) => {
	if (!Array.isArray(value)) {
		return undefined;
	}

	const normalized = value
		.map((item) => (typeof item === "string" ? item.trim() : ""))
		.filter(Boolean);

	return normalized.length > 0 ? normalized : undefined;
};

const findMatchingBracket = (content, startIndex) => {
	let depth = 0;
	let inSingleQuote = false;
	let inDoubleQuote = false;
	let inTemplate = false;
	let inLineComment = false;
	let inBlockComment = false;

	for (let index = startIndex; index < content.length; index += 1) {
		const char = content[index];
		const nextChar = content[index + 1];
		const prevChar = content[index - 1];

		if (inLineComment) {
			if (char === "\n") {
				inLineComment = false;
			}
			continue;
		}

		if (inBlockComment) {
			if (char === "*" && nextChar === "/") {
				inBlockComment = false;
				index += 1;
			}
			continue;
		}

		if (inSingleQuote) {
			if (char === "'" && prevChar !== "\\") {
				inSingleQuote = false;
			}
			continue;
		}

		if (inDoubleQuote) {
			if (char === '"' && prevChar !== "\\") {
				inDoubleQuote = false;
			}
			continue;
		}

		if (inTemplate) {
			if (char === "`" && prevChar !== "\\") {
				inTemplate = false;
			}
			continue;
		}

		if (char === "/" && nextChar === "/") {
			inLineComment = true;
			index += 1;
			continue;
		}

		if (char === "/" && nextChar === "*") {
			inBlockComment = true;
			index += 1;
			continue;
		}

		if (char === "'") {
			inSingleQuote = true;
			continue;
		}

		if (char === '"') {
			inDoubleQuote = true;
			continue;
		}

		if (char === "`") {
			inTemplate = true;
			continue;
		}

		if (char === "[") {
			depth += 1;
			continue;
		}

		if (char === "]") {
			depth -= 1;
			if (depth === 0) {
				return index;
			}
		}
	}

	throw new Error("无法定位 skillsData 数组的结束位置");
};

const locateSkillsArray = (content) => {
	const marker = "export const skillsData: Skill[] =";
	const markerIndex = content.indexOf(marker);
	if (markerIndex < 0) {
		throw new Error("未找到 skillsData 定义");
	}

	const openBracketIndex = content.indexOf("[", markerIndex + marker.length);
	if (openBracketIndex < 0) {
		throw new Error("未找到 skillsData 数组起始");
	}

	const closeBracketIndex = findMatchingBracket(content, openBracketIndex);
	return {
		openBracketIndex,
		closeBracketIndex,
	};
};

const parseSkillsArray = (arrayLiteral) => {
	const script = new vm.Script(`(${arrayLiteral})`, {
		filename: "skills-data.literal.js",
	});

	const evaluated = script.runInNewContext(Object.create(null), {
		timeout: 1000,
	});

	if (!Array.isArray(evaluated)) {
		throw new Error("skillsData 不是有效数组");
	}

	return evaluated;
};

const normalizeSkill = (rawSkill) => {
	const years = toNonNegativeInteger(rawSkill?.experience?.years);
	const months = Math.min(
		toNonNegativeInteger(rawSkill?.experience?.months),
		11,
	);

	return {
		id: normalizeText(rawSkill?.id),
		name: normalizeText(rawSkill?.name),
		description: normalizeText(rawSkill?.description),
		icon: normalizeText(rawSkill?.icon),
		category: normalizeText(rawSkill?.category) || "other",
		level: normalizeText(rawSkill?.level) || "beginner",
		experience: {
			years,
			months,
		},
		projects: normalizeStringArray(rawSkill?.projects),
		certifications: normalizeStringArray(rawSkill?.certifications),
		color: normalizeText(rawSkill?.color) || undefined,
	};
};

const validateSkill = (skill, index) => {
	const errors = [];
	const prefix = `第 ${index + 1} 条技能`;

	if (!skill.id) {
		errors.push(`${prefix} 缺少 id`);
	}
	if (!skill.name) {
		errors.push(`${prefix} 缺少 name`);
	}
	if (!skill.description) {
		errors.push(`${prefix} 缺少 description`);
	}
	if (!skill.icon) {
		errors.push(`${prefix} 缺少 icon`);
	}
	if (!CATEGORY_SET.has(skill.category)) {
		errors.push(`${prefix} category 非法: ${skill.category}`);
	}
	if (!LEVEL_SET.has(skill.level)) {
		errors.push(`${prefix} level 非法: ${skill.level}`);
	}
	if (skill.experience.months > 11) {
		errors.push(`${prefix} experience.months 不能大于 11`);
	}

	if (skill.projects && !Array.isArray(skill.projects)) {
		errors.push(`${prefix} projects 必须是字符串数组`);
	}
	if (skill.certifications && !Array.isArray(skill.certifications)) {
		errors.push(`${prefix} certifications 必须是字符串数组`);
	}

	return errors;
};

const validateSkills = (skills) => {
	if (!Array.isArray(skills)) {
		return ["skills 必须是数组"];
	}

	const errors = [];
	const idSet = new Set();

	skills.forEach((rawSkill, index) => {
		const normalized = normalizeSkill(rawSkill);
		errors.push(...validateSkill(normalized, index));

		if (normalized.id) {
			if (idSet.has(normalized.id)) {
				errors.push(`存在重复 id: ${normalized.id}`);
			}
			idSet.add(normalized.id);
		}
	});

	return errors;
};

const serializeSkills = (skills, eol) => {
	const normalizedSkills = skills.map((skill) => {
		const nextSkill = normalizeSkill(skill);
		if (!nextSkill.projects) {
			delete nextSkill.projects;
		}
		if (!nextSkill.certifications) {
			delete nextSkill.certifications;
		}
		if (!nextSkill.color) {
			delete nextSkill.color;
		}
		return nextSkill;
	});

	const objectText = JSON.stringify(normalizedSkills, null, "\t").replace(
		/^(\s*)"([A-Za-z_][A-Za-z0-9_]*)":/gm,
		"$1$2:",
	);

	return objectText.replace(/\n/g, eol);
};

const loadSkills = async () => {
	const content = await fs.readFile(skillsFilePath, "utf8");
	const { openBracketIndex, closeBracketIndex } = locateSkillsArray(content);
	const arrayLiteral = content.slice(openBracketIndex, closeBracketIndex + 1);
	const parsed = parseSkillsArray(arrayLiteral);
	const normalizedSkills = parsed.map((skill) => normalizeSkill(skill));

	return {
		skills: normalizedSkills,
		content,
		openBracketIndex,
		closeBracketIndex,
	};
};

const saveSkills = async (skills) => {
	const source = await fs.readFile(skillsFilePath, "utf8");
	const eol = detectEol(source);
	const { openBracketIndex, closeBracketIndex } = locateSkillsArray(source);
	const nextArrayLiteral = serializeSkills(skills, eol);

	const nextSource =
		source.slice(0, openBracketIndex) +
		nextArrayLiteral +
		source.slice(closeBracketIndex + 1);

	await fs.writeFile(skillsFilePath, nextSource, "utf8");
};

const readRequestBody = async (req) => {
	const chunks = [];
	let totalSize = 0;
	const maxSize = 2 * 1024 * 1024;

	for await (const chunk of req) {
		totalSize += chunk.length;
		if (totalSize > maxSize) {
			throw new Error("请求体过大，超过 2MB 限制");
		}
		chunks.push(chunk);
	}

	return Buffer.concat(chunks).toString("utf8");
};

const serveStaticFile = async (reqPath, res) => {
	const relativePath = reqPath === "/" ? defaultPage : reqPath.slice(1);
	const resolvedPath = path.normalize(path.join(editorRoot, relativePath));

	if (!resolvedPath.startsWith(editorRoot)) {
		sendJson(res, 403, { success: false, message: "非法路径" });
		return;
	}

	try {
		const fileBuffer = await fs.readFile(resolvedPath);
		const ext = path.extname(resolvedPath).toLowerCase();
		const contentType = MIME_TYPES[ext] || "application/octet-stream";

		res.writeHead(200, {
			"Content-Type": contentType,
			"Cache-Control": "no-store",
		});
		res.end(fileBuffer);
	} catch {
		sendJson(res, 404, { success: false, message: "文件不存在" });
	}
};

const handleApi = async (req, res, pathName) => {
	if (pathName === "/api/health" && req.method === "GET") {
		sendJson(res, 200, { success: true, message: "ok" });
		return;
	}

	if (pathName === "/api/skills" && req.method === "GET") {
		try {
			const { skills } = await loadSkills();
			sendJson(res, 200, {
				success: true,
				skills,
				meta: {
					total: skills.length,
					updatedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			sendJson(res, 500, {
				success: false,
				message:
					error instanceof Error ? error.message : "读取 skills 失败",
			});
		}
		return;
	}

	if (pathName === "/api/skills" && req.method === "POST") {
		try {
			const bodyText = await readRequestBody(req);
			const payload = JSON.parse(bodyText);
			const nextSkills = payload?.skills;
			const errors = validateSkills(nextSkills);

			if (errors.length > 0) {
				sendJson(res, 400, {
					success: false,
					message: "数据校验失败",
					errors,
				});
				return;
			}

			const normalizedSkills = nextSkills.map((skill) =>
				normalizeSkill(skill),
			);
			await saveSkills(normalizedSkills);

			sendJson(res, 200, {
				success: true,
				message: "已保存到 src/data/skills.ts",
				meta: {
					total: normalizedSkills.length,
					savedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			sendJson(res, 500, {
				success: false,
				message: error instanceof Error ? error.message : "保存失败",
			});
		}
		return;
	}

	sendJson(res, 404, { success: false, message: "API 不存在" });
};

const createServer = () => {
	return http.createServer(async (req, res) => {
		if (!req.url) {
			sendJson(res, 400, { success: false, message: "无效请求" });
			return;
		}

		const url = new URL(
			req.url,
			`http://${req.headers.host || "localhost"}`,
		);
		const pathName = decodeURIComponent(url.pathname);

		if (pathName.startsWith("/api/")) {
			await handleApi(req, res, pathName);
			return;
		}

		if (req.method !== "GET" && req.method !== "HEAD") {
			sendJson(res, 405, { success: false, message: "仅支持 GET/HEAD" });
			return;
		}

		await serveStaticFile(pathName, res);
	});
};

const startServer = (port, retriesLeft = MAX_PORT_RETRIES) => {
	const server = createServer();

	server.on("error", (error) => {
		if (error?.code === "EADDRINUSE" && retriesLeft > 0) {
			const nextPort = port + 1;
			console.warn(
				`端口 ${HOST}:${port} 已被占用，自动尝试 ${HOST}:${nextPort}`,
			);
			startServer(nextPort, retriesLeft - 1);
			return;
		}

		if (error?.code === "EADDRINUSE") {
			console.error(
				`无法启动技能可视化编辑器：从 ${HOST}:${PORT} 开始连续 ${MAX_PORT_RETRIES + 1} 个端口都被占用。`,
			);
			console.error(
				"可选方案：关闭占用进程，或设置环境变量 SKILLS_EDITOR_PORT 指定新端口。",
			);
			process.exit(1);
			return;
		}

		console.error("技能可视化编辑器启动失败:", error);
		process.exit(1);
	});

	server.listen(port, HOST, () => {
		const url = `http://${HOST}:${port}`;
		console.log("\n技能可视化编辑器已启动");
		console.log(`地址: ${url}`);
		if (port !== PORT) {
			console.log(`提示: 默认端口 ${PORT} 被占用，已自动切换到 ${port}`);
		}
		console.log("保存后将直接写回 src/data/skills.ts\n");
	});
};

startServer(PORT);

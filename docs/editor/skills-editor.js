const state = {
	skills: [],
	filteredIndexes: [],
	selectedIndex: -1,
	dirty: false,
	isRendering: false,
};

const elements = {
	searchInput: document.querySelector("#searchInput"),
	skillsList: document.querySelector("#skillsList"),
	reloadBtn: document.querySelector("#reloadBtn"),
	saveBtn: document.querySelector("#saveBtn"),
	addBtn: document.querySelector("#addBtn"),
	duplicateBtn: document.querySelector("#duplicateBtn"),
	deleteBtn: document.querySelector("#deleteBtn"),
	statusBox: document.querySelector("#statusBox"),
	idInput: document.querySelector("#idInput"),
	nameInput: document.querySelector("#nameInput"),
	descriptionInput: document.querySelector("#descriptionInput"),
	iconInput: document.querySelector("#iconInput"),
	colorInput: document.querySelector("#colorInput"),
	categorySelect: document.querySelector("#categorySelect"),
	levelSelect: document.querySelector("#levelSelect"),
	yearsInput: document.querySelector("#yearsInput"),
	monthsInput: document.querySelector("#monthsInput"),
	projectsInput: document.querySelector("#projectsInput"),
	certificationsInput: document.querySelector("#certificationsInput"),
};

const textArrayToMultiline = (items) => {
	if (!Array.isArray(items) || items.length === 0) {
		return "";
	}
	return items.join("\n");
};

const multilineToTextArray = (text) => {
	return text
		.split(/[\n,]/)
		.map((item) => item.trim())
		.filter(Boolean);
};

const toNonNegativeInteger = (value) => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0) {
		return 0;
	}
	return Math.trunc(parsed);
};

const setStatus = (message, type = "info") => {
	elements.statusBox.textContent = message;
	elements.statusBox.className = `status ${type === "error" ? "error" : type === "success" ? "success" : ""}`;
};

const setDirty = (isDirty) => {
	state.dirty = isDirty;
	document.title = isDirty
		? "技能可视化编辑器 *未保存"
		: "技能可视化编辑器";
};

const getSelectedSkill = () => {
	if (state.selectedIndex < 0 || state.selectedIndex >= state.skills.length) {
		return null;
	}
	return state.skills[state.selectedIndex];
};

const uniqueSkillId = (baseId) => {
	const normalizedBase = baseId
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/^-+|-+$/g, "") || "new-skill";

	let candidate = normalizedBase;
	let suffix = 1;
	const existingIds = new Set(state.skills.map((skill) => skill.id));

	while (existingIds.has(candidate)) {
		candidate = `${normalizedBase}-${suffix}`;
		suffix += 1;
	}

	return candidate;
};

const selectSkill = (index) => {
	state.selectedIndex = index;
	renderSkillsList();
	fillForm();
};

const fillForm = () => {
	const skill = getSelectedSkill();
	state.isRendering = true;

	if (!skill) {
		elements.idInput.value = "";
		elements.nameInput.value = "";
		elements.descriptionInput.value = "";
		elements.iconInput.value = "";
		elements.colorInput.value = "";
		elements.categorySelect.value = "frontend";
		elements.levelSelect.value = "beginner";
		elements.yearsInput.value = "0";
		elements.monthsInput.value = "0";
		elements.projectsInput.value = "";
		elements.certificationsInput.value = "";
		state.isRendering = false;
		return;
	}

	elements.idInput.value = skill.id || "";
	elements.nameInput.value = skill.name || "";
	elements.descriptionInput.value = skill.description || "";
	elements.iconInput.value = skill.icon || "";
	elements.colorInput.value = skill.color || "";
	elements.categorySelect.value = skill.category || "frontend";
	elements.levelSelect.value = skill.level || "beginner";
	elements.yearsInput.value = String(skill.experience?.years ?? 0);
	elements.monthsInput.value = String(skill.experience?.months ?? 0);
	elements.projectsInput.value = textArrayToMultiline(skill.projects);
	elements.certificationsInput.value = textArrayToMultiline(skill.certifications);

	state.isRendering = false;
};

const renderSkillsList = () => {
	const keyword = elements.searchInput.value.trim().toLowerCase();

	state.filteredIndexes = state.skills
		.map((skill, index) => ({ skill, index }))
		.filter(({ skill }) => {
			if (!keyword) {
				return true;
			}

			const haystack = [
				skill.id,
				skill.name,
				skill.category,
				skill.level,
			]
				.join(" ")
				.toLowerCase();

			return haystack.includes(keyword);
		})
		.map(({ index }) => index);

	elements.skillsList.innerHTML = "";

	if (state.filteredIndexes.length === 0) {
		const empty = document.createElement("li");
		empty.className = "skills-item";
		empty.textContent = "没有匹配项";
		elements.skillsList.appendChild(empty);
		return;
	}

	for (const index of state.filteredIndexes) {
		const skill = state.skills[index];
		const item = document.createElement("li");
		item.className = `skills-item ${index === state.selectedIndex ? "active" : ""}`;
		item.dataset.index = String(index);
		item.innerHTML = `
			<div class="name">${skill.name || "(未命名)"}</div>
			<div class="meta">${skill.id || "-"} | ${skill.category} | ${skill.level}</div>
		`;
		item.addEventListener("click", () => selectSkill(index));
		elements.skillsList.appendChild(item);
	}
};

const syncCurrentSkillFromForm = () => {
	if (state.isRendering) {
		return;
	}

	const skill = getSelectedSkill();
	if (!skill) {
		return;
	}

	skill.id = elements.idInput.value.trim();
	skill.name = elements.nameInput.value.trim();
	skill.description = elements.descriptionInput.value.trim();
	skill.icon = elements.iconInput.value.trim();
	skill.color = elements.colorInput.value.trim() || undefined;
	skill.category = elements.categorySelect.value;
	skill.level = elements.levelSelect.value;
	skill.experience = {
		years: toNonNegativeInteger(elements.yearsInput.value),
		months: Math.min(toNonNegativeInteger(elements.monthsInput.value), 11),
	};

	const projects = multilineToTextArray(elements.projectsInput.value);
	const certifications = multilineToTextArray(elements.certificationsInput.value);

	skill.projects = projects.length > 0 ? projects : undefined;
	skill.certifications = certifications.length > 0 ? certifications : undefined;

	setDirty(true);
	renderSkillsList();
};

const loadSkills = async () => {
	setStatus("正在加载 skills 数据...");

	const response = await fetch("/api/skills", {
		method: "GET",
		headers: {
			"Accept": "application/json",
		},
	});

	const payload = await response.json();
	if (!response.ok || !payload.success) {
		throw new Error(payload.message || "加载失败");
	}

	state.skills = Array.isArray(payload.skills) ? payload.skills : [];
	setDirty(false);

	if (state.skills.length === 0) {
		state.selectedIndex = -1;
	} else if (state.selectedIndex < 0 || state.selectedIndex >= state.skills.length) {
		state.selectedIndex = 0;
	}

	renderSkillsList();
	fillForm();
	setStatus(`加载完成，共 ${state.skills.length} 条技能`, "success");
};

const saveSkills = async () => {
	syncCurrentSkillFromForm();

	setStatus("正在保存到 src/data/skills.ts ...");

	const response = await fetch("/api/skills", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ skills: state.skills }),
	});

	const payload = await response.json();
	if (!response.ok || !payload.success) {
		const errorList = Array.isArray(payload.errors)
			? payload.errors.join("；")
			: payload.message || "保存失败";
		throw new Error(errorList);
	}

	setDirty(false);
	setStatus(payload.message || "保存成功", "success");
};

const addSkill = () => {
	const templateName = "新技能";
	const newSkill = {
		id: uniqueSkillId("new-skill"),
		name: templateName,
		description: "请填写技能描述",
		icon: "logos:javascript",
		category: "frontend",
		level: "beginner",
		experience: { years: 0, months: 1 },
		projects: [],
	};

	state.skills.push(newSkill);
	state.selectedIndex = state.skills.length - 1;
	setDirty(true);
	renderSkillsList();
	fillForm();
	setStatus("已新增技能，请继续编辑字段", "success");
};

const duplicateSkill = () => {
	const skill = getSelectedSkill();
	if (!skill) {
		setStatus("请先选中一个技能", "error");
		return;
	}

	const clone = structuredClone(skill);
	clone.id = uniqueSkillId(`${skill.id || "skill"}-copy`);
	clone.name = `${skill.name || "技能"} 副本`;

	state.skills.splice(state.selectedIndex + 1, 0, clone);
	state.selectedIndex += 1;
	setDirty(true);
	renderSkillsList();
	fillForm();
	setStatus("已复制当前技能", "success");
};

const deleteSkill = () => {
	const skill = getSelectedSkill();
	if (!skill) {
		setStatus("请先选中一个技能", "error");
		return;
	}

	const confirmed = window.confirm(`确定删除技能 ${skill.name} (${skill.id}) 吗？`);
	if (!confirmed) {
		return;
	}

	state.skills.splice(state.selectedIndex, 1);
	if (state.selectedIndex >= state.skills.length) {
		state.selectedIndex = state.skills.length - 1;
	}
	setDirty(true);
	renderSkillsList();
	fillForm();
	setStatus("技能已删除", "success");
};

const withErrorToast = async (task) => {
	try {
		await task();
	} catch (error) {
		setStatus(error instanceof Error ? error.message : "发生未知错误", "error");
	}
};

const bindEvents = () => {
	elements.searchInput.addEventListener("input", () => {
		renderSkillsList();
	});

	[
		elements.idInput,
		elements.nameInput,
		elements.descriptionInput,
		elements.iconInput,
		elements.colorInput,
		elements.categorySelect,
		elements.levelSelect,
		elements.yearsInput,
		elements.monthsInput,
		elements.projectsInput,
		elements.certificationsInput,
	].forEach((element) => {
		element.addEventListener("input", syncCurrentSkillFromForm);
	});

	elements.reloadBtn.addEventListener("click", () => {
		withErrorToast(async () => {
			if (state.dirty) {
				const confirmed = window.confirm("有未保存内容，确定重新加载吗？");
				if (!confirmed) {
					return;
				}
			}
			await loadSkills();
		});
	});

	elements.saveBtn.addEventListener("click", () => {
		withErrorToast(saveSkills);
	});

	elements.addBtn.addEventListener("click", addSkill);
	elements.duplicateBtn.addEventListener("click", duplicateSkill);
	elements.deleteBtn.addEventListener("click", deleteSkill);

	window.addEventListener("keydown", (event) => {
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
			event.preventDefault();
			withErrorToast(saveSkills);
		}
	});

	window.addEventListener("beforeunload", (event) => {
		if (!state.dirty) {
			return;
		}
		event.preventDefault();
		event.returnValue = "";
	});
};

const bootstrap = async () => {
	bindEvents();
	await withErrorToast(loadSkills);
};

bootstrap();

<script>
import { onDestroy, onMount } from "svelte";
import { pioConfig } from "@/config";

const defaultLegacyModel = "/pio/models/pio/model.json";
const configuredModels =
	Array.isArray(pioConfig.models) && pioConfig.models.length > 0
		? pioConfig.models
		: [defaultLegacyModel];

// 将配置转换为 Pio 插件需要的格式
const pioOptions = {
	mode: pioConfig.mode,
	hidden: pioConfig.hiddenOnMobile,
	content: pioConfig.dialog || {},
	model: configuredModels,
};

const primaryModel = configuredModels[0] || defaultLegacyModel;
const useCubism4 = /\.model3\.json$/i.test(primaryModel);
const mobileHideBreakpoint = 768;

// 全局Pio实例引用
let pioInstance = null;
let pioInitialized = false;
let pioContainer;
let pioCanvas;
let pioDialog;

let pixiApp = null;
let cubismModel = null;
let cubismModelIndex = 0;
let cubismDragCleanup = null;
let dialogTimer = null;
let cubismPIXI = null;
let cubismLive2DModel = null;
let cubismRuntimeSource = "none";
let cubismCoreSource = "none";
let isRestoringCubism = false;

// 样式已通过 Layout.astro 静态引入，无需动态加载

// 等待 DOM 加载完成后再初始化 Pio
function initPio() {
	if (typeof window !== "undefined" && typeof Paul_Pio !== "undefined") {
		try {
			// 确保DOM元素存在
			if (pioContainer && pioCanvas && !pioInitialized) {
				pioInstance = new Paul_Pio(pioOptions);
				pioInitialized = true;
				console.log("Pio initialized successfully (Svelte)");
			} else if (!pioContainer || !pioCanvas) {
				console.warn("Pio DOM elements not found, retrying...");
				setTimeout(initPio, 100);
			}
		} catch (e) {
			console.error("Pio initialization error:", e);
		}
	} else {
		// 如果 Paul_Pio 还未定义，稍后再试
		setTimeout(initPio, 100);
	}
}

function pickDialogText(value, fallback = "") {
	if (Array.isArray(value) && value.length > 0) {
		const index = Math.floor(Math.random() * value.length);
		return value[index] || fallback;
	}

	if (typeof value === "string" && value.trim().length > 0) {
		return value;
	}

	return fallback;
}

function showCubismDialog(message, duration = 3000) {
	if (!useCubism4 || !pioDialog || !message) return;

	pioDialog.textContent = message;
	pioDialog.classList.add("active");

	if (dialogTimer) {
		window.clearTimeout(dialogTimer);
	}

	dialogTimer = window.setTimeout(() => {
		if (pioDialog) {
			pioDialog.classList.remove("active");
		}
	}, duration);
}

function navigateHome() {
	if (typeof window !== "undefined" && window.swup) {
		try {
			window.swup.navigate("/");
			return;
		} catch (error) {
			console.error("Swup navigation failed:", error);
		}
	}

	window.location.href = "/";
}

function hideCubismModel() {
	if (!pioContainer) return;
	pioContainer.classList.add("pio-hidden");
}

async function restoreCubismModel() {
	if (!pioContainer) return;
	pioContainer.classList.remove("pio-hidden");

	if (
		useCubism4 &&
		pioInitialized &&
		cubismPIXI &&
		cubismLive2DModel &&
		!isRestoringCubism &&
		pioOptions.model?.[0] !== defaultLegacyModel
	) {
		isRestoringCubism = true;
		try {
			if (pixiApp?.renderer && pioCanvas) {
				pixiApp.renderer.resize(pioCanvas.width || 280, pioCanvas.height || 250);
			}

			const currentModelPath =
				pioOptions.model[cubismModelIndex] ||
				pioOptions.model[0] ||
				primaryModel;

			await loadCubismModel(currentModelPath);
		} catch (error) {
			console.error("Failed to restore Cubism model state:", error);
		} finally {
			isRestoringCubism = false;
		}
	}

	showCubismDialog(pickDialogText(pioConfig.dialog?.welcome, "欢迎回来喵~"), 2500);
}

function loadScript(src, id) {
	return new Promise((resolve, reject) => {
		const existing = document.querySelector(`#${id}`);
		if (existing) {
			const status = existing.getAttribute("data-load-status");

			if (status === "loaded") {
				resolve();
				return;
			}

			if (status === "loading") {
				existing.addEventListener("load", () => resolve(), { once: true });
				existing.addEventListener(
					"error",
					() => reject(new Error(`Failed to load script: ${src}`)),
					{ once: true },
				);
				return;
			}

			existing.remove();
		}

		const script = document.createElement("script");
		script.id = id;
		script.src = src;
		script.setAttribute("data-load-status", "loading");
		script.onload = () => {
			script.setAttribute("data-load-status", "loaded");
			resolve();
		};
		script.onerror = () => {
			script.setAttribute("data-load-status", "failed");
			reject(new Error(`Failed to load script: ${src}`));
		};
		document.head.appendChild(script);
	});
}

async function loadScriptWithFallback(sources, id) {
	let lastError = null;

	for (const source of sources) {
		try {
			await loadScript(source, id);
			return;
		} catch (error) {
			lastError = error;
			const failed = document.querySelector(`#${id}`);
			if (failed && failed.getAttribute("data-load-status") === "failed") {
				failed.remove();
			}
		}
	}

	throw lastError || new Error(`Failed to load any script for ${id}`);
}

async function ensureCubismCoreLoaded() {
	if (typeof window === "undefined") {
		return false;
	}

	if (window.Live2DCubismCore) {
		cubismCoreSource = cubismCoreSource === "none" ? "existing-global" : cubismCoreSource;
		return true;
	}

	try {
		await import("live2dcubismcore/live2dcubismcore.min.js");
		if (window.Live2DCubismCore) {
			cubismCoreSource = "local-package";
			return true;
		}
	} catch (error) {
		console.warn("Failed to load local live2dcubismcore package, fallback to script:", error);
	}

	try {
		await loadScriptWithFallback(
			["https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js"],
			"cubism-core-script",
		);
	} catch (error) {
		console.error("Failed to load Live2DCubismCore script:", error);
		return false;
	}

	if (!window.Live2DCubismCore) {
		console.error("Live2DCubismCore script loaded but runtime not available");
		return false;
	}

	cubismCoreSource = "remote-script";

	return true;
}

async function loadCubismRuntimeFromCdn() {
	const coreReady = await ensureCubismCoreLoaded();
	if (!coreReady) {
		throw new Error("Live2DCubismCore is unavailable");
	}

	await loadScriptWithFallback(
		[
			"https://unpkg.com/pixi.js@6.5.10/dist/browser/pixi.min.js",
			"https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js",
		],
		"pixi-script",
	);

	await loadScriptWithFallback(
		[
			"https://unpkg.com/pixi-live2d-display@0.4.0/dist/cubism4.min.js",
			"https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism4.min.js",
		],
		"pixi-live2d-script",
	);
}

async function ensureCubism4Runtime() {
	if (cubismPIXI && cubismLive2DModel) {
		return true;
	}

	const coreReady = await ensureCubismCoreLoaded();
	if (!coreReady) {
		console.warn("Live2DCubismCore is not available, skip Cubism4 runtime");
		return false;
	}

	try {
		const pixiModule = await import("pixi.js");
		if (typeof window !== "undefined") {
			window.PIXI = pixiModule;
		}

		const live2dModule = await import("pixi-live2d-display/cubism4");
		const Live2DModel =
			live2dModule?.Live2DModel ||
			pixiModule?.live2d?.Live2DModel ||
			window?.PIXI?.live2d?.Live2DModel;

		if (!Live2DModel) {
			throw new Error("Local Live2DModel export not found");
		}

		cubismPIXI = pixiModule;
		cubismLive2DModel = Live2DModel;
		cubismRuntimeSource = "local-module";
		return true;
	} catch (error) {
		console.warn("Local Cubism4 modules unavailable, fallback to CDN scripts:", error);
	}

	try {
		await loadCubismRuntimeFromCdn();
		cubismPIXI = window.PIXI;
		cubismLive2DModel = window.PIXI?.live2d?.Live2DModel || null;

		if (!cubismPIXI || !cubismLive2DModel) {
			throw new Error("CDN runtime loaded but Live2DModel missing");
		}

		cubismRuntimeSource = "cdn-script";
		return true;
	} catch (error) {
		console.error("Failed to load Cubism4 runtime from all sources:", error);
		return false;
	}
}

function fallbackToLegacyPio(reason = "unknown") {
	console.warn(`Fallback to legacy Pio model due to: ${reason}`);
	pioOptions.model = [defaultLegacyModel];

	loadScript("/pio/static/l2d.js", "pio-l2d-script")
		.then(() => loadScript("/pio/static/pio.js", "pio-main-script"))
		.then(() => {
			setTimeout(initPio, 100);
		})
		.catch((error) => {
			console.error("Failed to fallback to legacy Pio scripts:", error);
		});
}

function fitCubismModelToCanvas() {
	if (!cubismModel || !pioCanvas) return;

	const canvasWidth = pioCanvas.width || 280;
	const canvasHeight = pioCanvas.height || 250;
	const bounds =
		typeof cubismModel.getLocalBounds === "function"
			? cubismModel.getLocalBounds()
			: {
					x: 0,
					y: 0,
					width: cubismModel.width || canvasWidth,
					height: cubismModel.height || canvasHeight,
			  };

	const modelWidth = Math.max(bounds.width || canvasWidth, 1);
	const modelHeight = Math.max(bounds.height || canvasHeight, 1);
	const scale = Math.min(
		(canvasWidth * 0.9) / modelWidth,
		(canvasHeight * 0.95) / modelHeight,
	);

	cubismModel.scale.set(scale);
	cubismModel.x = canvasWidth / 2 - (bounds.x + modelWidth / 2) * scale;
	cubismModel.y = canvasHeight - (bounds.y + modelHeight) * scale;
}

async function loadCubismModel(modelPath) {
	if (!pixiApp || !cubismLive2DModel) return false;

	try {
		const nextModel = await cubismLive2DModel.from(modelPath);

		if (cubismModel) {
			pixiApp.stage.removeChild(cubismModel);
			if (typeof cubismModel.destroy === "function") {
				cubismModel.destroy();
			}
		}

		cubismModel = nextModel;
		pixiApp.stage.addChild(cubismModel);
		fitCubismModelToCanvas();
		return true;
	} catch (error) {
		console.error("Failed to load Cubism4 model:", error);
		showCubismDialog("模型加载失败，请检查资源路径。", 4000);
		fallbackToLegacyPio("cubism-model-load-failed");
		return false;
	}
}

function enableCubismDragging() {
	if (!pioContainer || !pioCanvas) return null;

	const dragState = {
		active: false,
		offsetX: 0,
		offsetY: 0,
	};

	const handleMouseDown = (event) => {
		if (event.button !== 0) return;
		const rect = pioContainer.getBoundingClientRect();
		dragState.active = true;
		dragState.offsetX = event.clientX - rect.left;
		dragState.offsetY = event.clientY - rect.top;
		pioContainer.classList.add("active");
		pioContainer.classList.remove("right");
		event.preventDefault();
	};

	const handleMouseMove = (event) => {
		if (!dragState.active) return;

		pioContainer.style.left = `${event.clientX - dragState.offsetX}px`;
		pioContainer.style.top = `${event.clientY - dragState.offsetY}px`;
		pioContainer.style.bottom = "auto";
	};

	const handleMouseUp = () => {
		if (!dragState.active) return;
		dragState.active = false;
		pioContainer.classList.remove("active");
	};

	pioCanvas.addEventListener("mousedown", handleMouseDown);
	document.addEventListener("mousemove", handleMouseMove);
	document.addEventListener("mouseup", handleMouseUp);

	return () => {
		pioCanvas.removeEventListener("mousedown", handleMouseDown);
		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("mouseup", handleMouseUp);
	};
}

function applyCubismModeBehavior() {
	if (!pioContainer) return;

	pioContainer.classList.remove("static");
	if (pioConfig.mode === "static") {
		pioContainer.classList.add("static");
	}

	if (cubismDragCleanup) {
		cubismDragCleanup();
		cubismDragCleanup = null;
	}

	if (pioConfig.mode === "draggable") {
		cubismDragCleanup = enableCubismDragging();
	}
}

function setupCubismActions() {
	if (!pioContainer) return;

	const actionContainer = pioContainer.querySelector(".pio-action");
	if (!actionContainer) return;

	actionContainer.innerHTML = "";

	const homeButton = document.createElement("span");
	homeButton.className = "pio-home";
	homeButton.onclick = navigateHome;
	homeButton.onmouseover = () =>
		showCubismDialog(pickDialogText(pioConfig.dialog?.home, "点击这里回到首页"));
	actionContainer.appendChild(homeButton);

	if (pioOptions.model.length > 1) {
		const skinButton = document.createElement("span");
		skinButton.className = "pio-skin";
		skinButton.onclick = async () => {
			cubismModelIndex = (cubismModelIndex + 1) % pioOptions.model.length;
			const modelPath = pioOptions.model[cubismModelIndex];
			const switched = await loadCubismModel(modelPath);
			if (switched) {
				showCubismDialog(
					pickDialogText(
						pioConfig.dialog?.skin?.[1],
						"新衣服看起来不错喵~",
					),
					2000,
				);
			}
		};
		skinButton.onmouseover = () =>
			showCubismDialog(
				pickDialogText(pioConfig.dialog?.skin?.[0], "想看看我的新衣服吗？"),
			);
		actionContainer.appendChild(skinButton);
	}

	const infoButton = document.createElement("span");
	infoButton.className = "pio-info";
	infoButton.onclick = () =>
		window.open(
			pioConfig.dialog?.link || "https://github.com/2258009564",
			"_blank",
		);
	infoButton.onmouseover = () => showCubismDialog("想了解更多关于我的信息吗？");
	actionContainer.appendChild(infoButton);

	const closeButton = document.createElement("span");
	closeButton.className = "pio-close";
	closeButton.onclick = hideCubismModel;
	closeButton.onmouseover = () =>
		showCubismDialog(pickDialogText(pioConfig.dialog?.close, "QWQ 下次再见吧~"));
	actionContainer.appendChild(closeButton);
}

async function initCubism4Pio() {
	if (typeof window === "undefined") {
		return;
	}

	if (!cubismPIXI || !cubismLive2DModel) {
		const ready = await ensureCubism4Runtime();
		if (!ready) {
			showCubismDialog("UG 核心加载失败，已自动切换备用模型。", 4200);
			fallbackToLegacyPio("cubism-runtime-not-ready");
			return;
		}

		setTimeout(initCubism4Pio, 50);
		return;
	}

	if (!pioContainer || !pioCanvas || pioInitialized) {
		if (!pioInitialized) {
			setTimeout(initCubism4Pio, 100);
		}
		return;
	}

	try {
		pioCanvas.width = pioConfig.width || 280;
		pioCanvas.height = pioConfig.height || 250;
		pioContainer.classList.remove("pio-hidden");

		pixiApp = new cubismPIXI.Application({
			view: pioCanvas,
			width: pioCanvas.width,
			height: pioCanvas.height,
			antialias: true,
			transparent: true,
			backgroundAlpha: 0,
			autoStart: true,
		});

		setupCubismActions();
		applyCubismModeBehavior();

		const loaded = await loadCubismModel(pioOptions.model[cubismModelIndex]);
		if (loaded) {
			pioInitialized = true;
			showCubismDialog(
				pickDialogText(pioConfig.dialog?.welcome, "欢迎来访喵~"),
				2600,
			);
			console.log(
				`Cubism4 model initialized successfully (runtime=${cubismRuntimeSource}, core=${cubismCoreSource})`,
			);
		}
	} catch (error) {
		console.error("Cubism4 initialization error:", error);
	}
}

// 加载必要的脚本
function loadPioAssets() {
	if (typeof window === "undefined") return;

	if (useCubism4) {
		ensureCubism4Runtime()
			.then((ready) => {
				if (!ready) {
					showCubismDialog("UG 核心加载失败，已自动切换备用模型。", 4200);
					fallbackToLegacyPio("cubism-runtime-prepare-failed");
					return;
				}

				setTimeout(initCubism4Pio, 50);
			})
			.catch((error) => {
				console.error("Failed to prepare Cubism4 runtime:", error);
			});
		return;
	}

	loadScript("/pio/static/l2d.js", "pio-l2d-script")
		.then(() => loadScript("/pio/static/pio.js", "pio-main-script"))
		.then(() => {
			setTimeout(initPio, 100);
		})
		.catch((error) => {
			console.error("Failed to load legacy Pio scripts:", error);
		});
}

// 样式已通过 Layout.astro 静态引入，无需页面切换监听

onMount(() => {
	if (!pioConfig.enable) return;

	if (pioContainer) {
		pioContainer.classList.remove("pio-hidden");
	}

	// 如果配置了手机端隐藏，且当前屏幕宽度小于阈值，则直接终止，不加载脚本
	if (
		pioConfig.hiddenOnMobile &&
		window.matchMedia(`(max-width: ${mobileHideBreakpoint}px)`).matches
	) {
		return;
	}

	// 加载资源并初始化
	loadPioAssets();
});

onDestroy(() => {
	if (dialogTimer) {
		window.clearTimeout(dialogTimer);
		dialogTimer = null;
	}

	if (cubismDragCleanup) {
		cubismDragCleanup();
		cubismDragCleanup = null;
	}

	if (cubismModel && typeof cubismModel.destroy === "function") {
		cubismModel.destroy();
		cubismModel = null;
	}

	if (pixiApp && typeof pixiApp.destroy === "function") {
		pixiApp.destroy(true, {
			children: true,
			texture: false,
			baseTexture: false,
		});
		pixiApp = null;
	}

	console.log("Pio component destroyed");
});
</script>

{#if pioConfig.enable}
<div class={`pio-container ${pioConfig.position || "right"} ${useCubism4 ? "cubism4-mode" : ""}`} bind:this={pioContainer}>
	{#if useCubism4}
		<div class="pio-show" on:click={restoreCubismModel}></div>
		<div class="pio-action"></div>
		<div class="pio-dialog" bind:this={pioDialog}></div>
	{:else}
		<div class="pio-action"></div>
	{/if}
	<canvas
		id="pio"
		bind:this={pioCanvas}
		width={pioConfig.width || 280}
		height={pioConfig.height || 250}
	></canvas>
</div>
{/if}

<style>
  /* Pio 相关样式将通过外部CSS文件加载 */
	:global(.pio-container) {
		z-index: 999;
	}

	:global(.pio-container.cubism4-mode #pio) {
		transition: opacity 0.2s ease;
	}

	:global(.pio-container.cubism4-mode.pio-hidden #pio) {
		display: block !important;
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
	}
</style>
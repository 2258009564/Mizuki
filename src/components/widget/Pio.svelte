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
	const dragThresholdPx = 6;
	const clickSuppressWindowMs = 240;
	const scriptLoadTimeoutMs = 10000;
	const modelLoadTimeoutMs = 15000;
	const viewportPaddingPx = 8;
	const showBubbleOffsetEm = 1;

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
	let cubismShowDragCleanup = null;
	let cubismResizeCleanup = null;
	let cubismTapCleanup = null;
	let dialogTimer = null;
	let cubismPIXI = null;
	let cubismLive2DModel = null;
	let cubismRuntimeSource = "none";
	let cubismCoreSource = "none";
	let isRestoringCubism = false;
	let cubismSuppressClickUntil = 0;
	let pioShowButton;
	let cubismResizeRafId = 0;
	let lastTouchDialogText = "";
	let showAnchorX = "left";
	let showAnchorY = "bottom";

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

	function pickTouchDialogText() {
		const source = pioConfig.dialog?.touch;

		if (!Array.isArray(source) || source.length <= 1) {
			const text = pickDialogText(source, "不可以这样欺负我啦！");
			lastTouchDialogText = text;
			return text;
		}

		const candidates = source.filter(
			(item) => typeof item === "string" && item.trim().length > 0,
		);

		if (candidates.length === 0) {
			return "不可以这样欺负我啦！";
		}

		let next = candidates[Math.floor(Math.random() * candidates.length)];
		if (candidates.length > 1 && next === lastTouchDialogText) {
			const alternatives = candidates.filter(
				(item) => item !== lastTouchDialogText,
			);
			next =
				alternatives[Math.floor(Math.random() * alternatives.length)] ||
				next;
		}

		lastTouchDialogText = next;
		return next;
	}

	function showCubismDialog(message, duration = 3000) {
		if (!useCubism4 || !pioDialog || !message) return;

		if (pioDialog.classList.contains("active")) {
			pioDialog.classList.remove("active");
			void pioDialog.offsetWidth;
		}

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

		if (typeof window !== "undefined") {
			window.requestAnimationFrame(() => {
				keepPioInsideViewport();
			});
		}
	}

	function clampValue(value, min, max) {
		if (!Number.isFinite(value)) return min;
		if (max < min) return min;
		return Math.min(Math.max(value, min), max);
	}

	function getShowBubbleSizePx() {
		if (typeof window === "undefined") return { width: 48, height: 48 };

		if (pioShowButton) {
			const rect = pioShowButton.getBoundingClientRect();
			if (rect.width > 0 && rect.height > 0) {
				return { width: rect.width, height: rect.height };
			}

			const style = window.getComputedStyle(pioShowButton);
			const width = Number.parseFloat(style.width);
			const height = Number.parseFloat(style.height);
			if (Number.isFinite(width) && Number.isFinite(height)) {
				return { width, height };
			}
		}

		return { width: 48, height: 48 };
	}

	function getShowAnchorMetrics(
		containerWidth,
		containerHeight,
		xMode = showAnchorX,
		yMode = showAnchorY,
	) {
		const { width: bubbleWidth, height: bubbleHeight } =
			getShowBubbleSizePx();
		const rootFontSize =
			typeof window === "undefined"
				? 16
				: Number.parseFloat(
						window.getComputedStyle(document.documentElement)
							.fontSize,
					) || 16;
		const bubbleOffsetPx = rootFontSize * showBubbleOffsetEm;

		const centerX =
			xMode === "right"
				? containerWidth + bubbleOffsetPx - bubbleWidth / 2
				: -bubbleOffsetPx + bubbleWidth / 2;
		const centerY =
			yMode === "top"
				? bubbleOffsetPx + bubbleHeight / 2
				: containerHeight - bubbleOffsetPx - bubbleHeight / 2;

		return {
			centerX,
			centerY,
			minX: centerX - bubbleWidth / 2,
			maxX: centerX + bubbleWidth / 2,
			minY: centerY - bubbleHeight / 2,
			maxY: centerY + bubbleHeight / 2,
		};
	}

	function setContainerPosition(nextLeft, nextTop, options = {}) {
		if (!pioContainer || typeof window === "undefined") return;

		const {
			useBubbleBounds = false,
			containerWidth = null,
			containerHeight = null,
		} = options;

		const rect = pioContainer.getBoundingClientRect();
		const width = Number.isFinite(containerWidth)
			? containerWidth
			: rect.width;
		const height = Number.isFinite(containerHeight)
			? containerHeight
			: rect.height;

		let minLeft;
		let minTop;
		let maxLeft;
		let maxTop;

		if (useBubbleBounds) {
			const metrics = getShowAnchorMetrics(width, height);
			minLeft = viewportPaddingPx - metrics.minX;
			maxLeft = window.innerWidth - viewportPaddingPx - metrics.maxX;
			minTop = viewportPaddingPx - metrics.minY;
			maxTop = window.innerHeight - viewportPaddingPx - metrics.maxY;
		} else {
			minLeft = viewportPaddingPx;
			minTop = viewportPaddingPx;
			maxLeft = Math.max(
				minLeft,
				window.innerWidth - width - viewportPaddingPx,
			);
			maxTop = Math.max(
				minTop,
				window.innerHeight - height - viewportPaddingPx,
			);
		}

		const left = clampValue(nextLeft, minLeft, maxLeft);
		const top = clampValue(nextTop, minTop, maxTop);

		pioContainer.style.left = `${left}px`;
		pioContainer.style.top = `${top}px`;
		pioContainer.style.right = "auto";
		pioContainer.style.bottom = "auto";
		pioContainer.classList.remove("left");
		pioContainer.classList.remove("right");
	}

	function evaluateShowAnchorCandidate(
		bubbleCenterX,
		bubbleCenterY,
		containerWidth,
		containerHeight,
		xMode,
		yMode,
	) {
		const metrics = getShowAnchorMetrics(
			containerWidth,
			containerHeight,
			xMode,
			yMode,
		);
		const left = bubbleCenterX - metrics.centerX;
		const top = bubbleCenterY - metrics.centerY;

		const overflowLeft = Math.max(0, viewportPaddingPx - left);
		const overflowTop = Math.max(0, viewportPaddingPx - top);
		const overflowRight = Math.max(
			0,
			left + containerWidth - (window.innerWidth - viewportPaddingPx),
		);
		const overflowBottom = Math.max(
			0,
			top + containerHeight - (window.innerHeight - viewportPaddingPx),
		);

		return {
			xMode,
			yMode,
			left,
			top,
			overflow:
				overflowLeft + overflowTop + overflowRight + overflowBottom,
		};
	}

	function placeModelAroundBubble(bubbleRect) {
		if (!bubbleRect || typeof window === "undefined") return;

		const { width, height } = getCubismCanvasMetrics();
		const bubbleCenterX = bubbleRect.left + bubbleRect.width / 2;
		const bubbleCenterY = bubbleRect.top + bubbleRect.height / 2;

		const candidates = [
			evaluateShowAnchorCandidate(
				bubbleCenterX,
				bubbleCenterY,
				width,
				height,
				"left",
				"bottom",
			),
			evaluateShowAnchorCandidate(
				bubbleCenterX,
				bubbleCenterY,
				width,
				height,
				"right",
				"bottom",
			),
			evaluateShowAnchorCandidate(
				bubbleCenterX,
				bubbleCenterY,
				width,
				height,
				"left",
				"top",
			),
			evaluateShowAnchorCandidate(
				bubbleCenterX,
				bubbleCenterY,
				width,
				height,
				"right",
				"top",
			),
		];

		let best = candidates[0];
		for (let index = 1; index < candidates.length; index += 1) {
			const candidate = candidates[index];

			if (candidate.overflow < best.overflow) {
				best = candidate;
				continue;
			}

			if (
				candidate.overflow === best.overflow &&
				candidate.xMode === showAnchorX &&
				candidate.yMode === showAnchorY
			) {
				best = candidate;
			}
		}

		showAnchorX = best.xMode;
		showAnchorY = best.yMode;

		setContainerPosition(best.left, best.top, {
			containerWidth: width,
			containerHeight: height,
		});
	}

	function keepPioInsideViewport() {
		if (!pioContainer || typeof window === "undefined") return;

		const containerRect = pioContainer.getBoundingClientRect();
		const useBubbleBounds = pioContainer.classList.contains("pio-hidden");
		setContainerPosition(containerRect.left, containerRect.top, {
			useBubbleBounds,
		});
	}

	function cleanupCubismBindings() {
		if (cubismDragCleanup) {
			cubismDragCleanup();
			cubismDragCleanup = null;
		}

		if (cubismShowDragCleanup) {
			cubismShowDragCleanup();
			cubismShowDragCleanup = null;
		}

		if (cubismTapCleanup) {
			cubismTapCleanup();
			cubismTapCleanup = null;
		}

		if (cubismResizeCleanup) {
			cubismResizeCleanup();
			cubismResizeCleanup = null;
		}

		if (cubismResizeRafId && typeof window !== "undefined") {
			window.cancelAnimationFrame(cubismResizeRafId);
			cubismResizeRafId = 0;
		}
	}

	function destroyCubismRenderer() {
		if (cubismModel && typeof cubismModel.destroy === "function") {
			cubismModel.destroy({
				children: true,
				texture: true,
				baseTexture: true,
			});
			cubismModel = null;
		}

		if (pixiApp && typeof pixiApp.destroy === "function") {
			pixiApp.destroy(true, {
				children: true,
				texture: true,
				baseTexture: true,
			});
			pixiApp = null;
		}
	}

	function loadLegacyPioScripts() {
		return loadScript("/pio/static/l2d.js", "pio-l2d-script")
			.then(() => loadScript("/pio/static/pio.js", "pio-main-script"))
			.then(() => {
				setTimeout(initPio, 100);
			});
	}

	function withTimeout(promise, timeoutMs, timeoutMessage) {
		if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
			return promise;
		}

		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				reject(new Error(timeoutMessage));
			}, timeoutMs);

			promise
				.then((value) => {
					clearTimeout(timer);
					resolve(value);
				})
				.catch((error) => {
					clearTimeout(timer);
					reject(error);
				});
		});
	}

	function shouldSuppressCubismClick() {
		return Date.now() < cubismSuppressClickUntil;
	}

	function markCubismDragEnd() {
		cubismSuppressClickUntil = Date.now() + clickSuppressWindowMs;
	}

	function getCubismCanvasMetrics() {
		const width = pioConfig.width || 280;
		const height = pioConfig.height || 250;
		const resolution =
			typeof window === "undefined"
				? 1
				: Math.min(window.devicePixelRatio || 1, 2);

		return { width, height, resolution };
	}

	function applyCubismCanvasStyle() {
		if (!pioCanvas) return;

		const { width, height } = getCubismCanvasMetrics();
		pioCanvas.style.width = `${width}px`;
		pioCanvas.style.height = `${height}px`;
	}

	function syncCubismCanvasViewport() {
		if (!pixiApp || !pioCanvas) return;

		const { width, height, resolution } = getCubismCanvasMetrics();
		applyCubismCanvasStyle();
		pixiApp.renderer.resolution = resolution;
		pixiApp.renderer.resize(width, height);
		fitCubismModelToCanvas();
		keepPioInsideViewport();
	}

	function bindCubismResizeHandlers() {
		if (typeof window === "undefined") return null;

		const handleResize = () => {
			if (cubismResizeRafId) return;

			cubismResizeRafId = window.requestAnimationFrame(() => {
				cubismResizeRafId = 0;
				syncCubismCanvasViewport();
			});
		};

		window.addEventListener("resize", handleResize);
		window.addEventListener("orientationchange", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("orientationchange", handleResize);

			if (cubismResizeRafId) {
				window.cancelAnimationFrame(cubismResizeRafId);
				cubismResizeRafId = 0;
			}
		};
	}

	async function restoreCubismModel(event) {
		if (event && shouldSuppressCubismClick()) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		if (!pioContainer) return;
		const wasHidden = pioContainer.classList.contains("pio-hidden");
		const bubbleRect =
			wasHidden && pioShowButton
				? pioShowButton.getBoundingClientRect()
				: null;

		if (bubbleRect) {
			placeModelAroundBubble(bubbleRect);
		}

		pioContainer.classList.remove("pio-hidden");
		keepPioInsideViewport();

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
					const { width, height } = getCubismCanvasMetrics();
					pixiApp.renderer.resize(width, height);
					fitCubismModelToCanvas();
				}

				if (!cubismModel) {
					const currentModelPath =
						pioOptions.model[cubismModelIndex] ||
						pioOptions.model[0] ||
						primaryModel;

					await loadCubismModel(currentModelPath);
				}
			} catch (error) {
				console.error("Failed to restore Cubism model state:", error);
			} finally {
				isRestoringCubism = false;
			}
		}

		showCubismDialog(
			pickDialogText(pioConfig.dialog?.welcome, "欢迎回来喵~"),
			2500,
		);
		keepPioInsideViewport();
	}

	async function handleShowClick(event) {
		if (shouldSuppressCubismClick()) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		await restoreCubismModel();
	}

	function handleCubismCanvasTap(event) {
		if (shouldSuppressCubismClick()) {
			if (event) {
				event.preventDefault();
				event.stopPropagation();
			}
			return;
		}

		if (!pioContainer || pioContainer.classList.contains("pio-hidden")) {
			return;
		}

		showCubismDialog(pickTouchDialogText(), 2200);
	}

	function bindCubismCanvasTap() {
		if (!pioCanvas || typeof window === "undefined") return null;

		const handleCanvasPointerUp = (event) => {
			handleCubismCanvasTap(event);
		};

		pioCanvas.addEventListener("pointerup", handleCanvasPointerUp);
		return () => {
			pioCanvas.removeEventListener("pointerup", handleCanvasPointerUp);
		};
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
					withTimeout(
						new Promise((resolveExisting, rejectExisting) => {
							existing.addEventListener(
								"load",
								() => resolveExisting(),
								{ once: true },
							);
							existing.addEventListener(
								"error",
								() =>
									rejectExisting(
										new Error(
											`Failed to load script: ${src}`,
										),
									),
								{ once: true },
							);
						}),
						scriptLoadTimeoutMs,
						`Timed out while waiting for script: ${src}`,
					)
						.then(() => resolve())
						.catch((error) => reject(error));
					return;
				}

				existing.remove();
			}

			const script = document.createElement("script");
			script.id = id;
			script.src = src;
			script.setAttribute("data-load-status", "loading");

			let settled = false;
			const timeoutId = setTimeout(() => {
				if (settled) return;
				settled = true;
				script.setAttribute("data-load-status", "failed");
				script.remove();
				reject(new Error(`Timed out while loading script: ${src}`));
			}, scriptLoadTimeoutMs);

			script.onload = () => {
				if (settled) return;
				settled = true;
				clearTimeout(timeoutId);
				script.setAttribute("data-load-status", "loaded");
				resolve();
			};

			script.onerror = () => {
				if (settled) return;
				settled = true;
				clearTimeout(timeoutId);
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
				if (
					failed &&
					failed.getAttribute("data-load-status") === "failed"
				) {
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
			cubismCoreSource =
				cubismCoreSource === "none"
					? "existing-global"
					: cubismCoreSource;
			return true;
		}

		try {
			await import("live2dcubismcore/live2dcubismcore.min.js");
			if (window.Live2DCubismCore) {
				cubismCoreSource = "local-package";
				return true;
			}
		} catch (error) {
			console.warn(
				"Failed to load local live2dcubismcore package, fallback to script:",
				error,
			);
		}

		try {
			await loadScriptWithFallback(
				[
					"https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js",
				],
				"cubism-core-script",
			);
		} catch (error) {
			console.error("Failed to load Live2DCubismCore script:", error);
			return false;
		}

		if (!window.Live2DCubismCore) {
			console.error(
				"Live2DCubismCore script loaded but runtime not available",
			);
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
			console.warn(
				"Live2DCubismCore is not available, skip Cubism4 runtime",
			);
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
			console.warn(
				"Local Cubism4 modules unavailable, fallback to CDN scripts:",
				error,
			);
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
			console.error(
				"Failed to load Cubism4 runtime from all sources:",
				error,
			);
			return false;
		}
	}

	function fallbackToLegacyPio(reason = "unknown") {
		console.warn(`Fallback to legacy Pio model due to: ${reason}`);

		cleanupCubismBindings();
		destroyCubismRenderer();

		pioInstance = null;
		pioInitialized = false;
		isRestoringCubism = false;
		cubismSuppressClickUntil = 0;
		pioOptions.model = [defaultLegacyModel];

		loadLegacyPioScripts().catch((error) => {
			console.error("Failed to fallback to legacy Pio scripts:", error);
		});
	}

	function fitCubismModelToCanvas() {
		if (!cubismModel || !pioCanvas) return;

		const canvasWidth = pixiApp?.screen?.width || pioConfig.width || 280;
		const canvasHeight = pixiApp?.screen?.height || pioConfig.height || 250;
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
			const nextModel = await withTimeout(
				cubismLive2DModel.from(modelPath),
				modelLoadTimeoutMs,
				`Timed out while loading model: ${modelPath}`,
			);

			if (cubismModel) {
				pixiApp.stage.removeChild(cubismModel);
				if (typeof cubismModel.destroy === "function") {
					cubismModel.destroy({
						children: true,
					});
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

	function enableContainerDragging(
		targetElement,
		markActiveClass = true,
		onTap = null,
	) {
		if (!pioContainer || !targetElement || typeof window === "undefined") {
			return null;
		}

		const dragState = {
			pointerDown: false,
			dragging: false,
			startX: 0,
			startY: 0,
			offsetX: 0,
			offsetY: 0,
			pointerId: null,
			useBubbleAnchor: false,
		};

		const handlePointerDown = (event) => {
			if (event.pointerType === "mouse" && event.button !== 0) return;

			const useBubbleAnchor =
				targetElement === pioShowButton &&
				pioContainer.classList.contains("pio-hidden");
			const rect = useBubbleAnchor
				? pioShowButton.getBoundingClientRect()
				: pioContainer.getBoundingClientRect();
			dragState.pointerDown = true;
			dragState.dragging = false;
			dragState.pointerId = event.pointerId;
			dragState.useBubbleAnchor = useBubbleAnchor;
			dragState.startX = event.clientX;
			dragState.startY = event.clientY;
			dragState.offsetX = event.clientX - rect.left;
			dragState.offsetY = event.clientY - rect.top;

			if (typeof targetElement.setPointerCapture === "function") {
				try {
					targetElement.setPointerCapture(event.pointerId);
				} catch (error) {
					console.warn("Failed to capture pointer for drag:", error);
				}
			}

			event.preventDefault();
			event.stopPropagation();
		};

		const handlePointerMove = (event) => {
			if (!dragState.pointerDown) return;

			const distance = Math.hypot(
				event.clientX - dragState.startX,
				event.clientY - dragState.startY,
			);

			if (!dragState.dragging && distance < dragThresholdPx) {
				return;
			}

			if (!dragState.dragging) {
				dragState.dragging = true;
				if (markActiveClass) {
					pioContainer.classList.add("active");
				}
				pioContainer.classList.remove("right");
			}

			if (dragState.useBubbleAnchor) {
				const containerRect = pioContainer.getBoundingClientRect();
				const metrics = getShowAnchorMetrics(
					containerRect.width,
					containerRect.height,
				);
				const bubbleLeft = event.clientX - dragState.offsetX;
				const bubbleTop = event.clientY - dragState.offsetY;

				setContainerPosition(
					bubbleLeft - metrics.minX,
					bubbleTop - metrics.minY,
					{ useBubbleBounds: true },
				);
			} else {
				setContainerPosition(
					event.clientX - dragState.offsetX,
					event.clientY - dragState.offsetY,
				);
			}

			event.preventDefault();
		};

		const finishDragging = (event) => {
			if (!dragState.pointerDown) return;

			const wasDragging = dragState.dragging;
			if (wasDragging) {
				markCubismDragEnd();
			}

			dragState.pointerDown = false;
			dragState.dragging = false;
			dragState.useBubbleAnchor = false;
			if (markActiveClass) {
				pioContainer.classList.remove("active");
			}

			if (
				dragState.pointerId !== null &&
				typeof targetElement.releasePointerCapture === "function"
			) {
				try {
					targetElement.releasePointerCapture(dragState.pointerId);
				} catch (error) {
					console.warn("Failed to release pointer capture:", error);
				}
			}

			dragState.pointerId = null;

			if (!wasDragging && typeof onTap === "function") {
				onTap(event);
			}

			keepPioInsideViewport();

			if (event && wasDragging) {
				event.preventDefault();
			}
		};

		const suppressSyntheticClick = (event) => {
			if (shouldSuppressCubismClick()) {
				event.preventDefault();
				event.stopPropagation();
			}
		};

		targetElement.addEventListener("pointerdown", handlePointerDown);
		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", finishDragging);
		window.addEventListener("pointercancel", finishDragging);
		targetElement.addEventListener("click", suppressSyntheticClick, true);

		return () => {
			targetElement.removeEventListener("pointerdown", handlePointerDown);
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", finishDragging);
			window.removeEventListener("pointercancel", finishDragging);
			targetElement.removeEventListener(
				"click",
				suppressSyntheticClick,
				true,
			);
		};
	}

	function enableCubismDragging() {
		return enableContainerDragging(pioCanvas, true, handleCubismCanvasTap);
	}

	function enableCubismShowDragging() {
		return enableContainerDragging(pioShowButton, false);
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

		if (cubismShowDragCleanup) {
			cubismShowDragCleanup();
			cubismShowDragCleanup = null;
		}

		if (cubismTapCleanup) {
			cubismTapCleanup();
			cubismTapCleanup = null;
		}

		if (pioConfig.mode === "draggable") {
			cubismDragCleanup = enableCubismDragging();
			cubismShowDragCleanup = enableCubismShowDragging();
			return;
		}

		cubismTapCleanup = bindCubismCanvasTap();
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
			showCubismDialog(
				pickDialogText(pioConfig.dialog?.home, "点击这里回到首页"),
			);
		actionContainer.appendChild(homeButton);

		if (pioOptions.model.length > 1) {
			const skinButton = document.createElement("span");
			skinButton.className = "pio-skin";
			skinButton.onclick = async () => {
				cubismModelIndex =
					(cubismModelIndex + 1) % pioOptions.model.length;
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
					pickDialogText(
						pioConfig.dialog?.skin?.[0],
						"想看看我的新衣服吗？",
					),
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
		infoButton.onmouseover = () =>
			showCubismDialog("想了解更多关于我的信息吗？");
		actionContainer.appendChild(infoButton);

		const closeButton = document.createElement("span");
		closeButton.className = "pio-close";
		closeButton.onclick = hideCubismModel;
		closeButton.onmouseover = () =>
			showCubismDialog(
				pickDialogText(pioConfig.dialog?.close, "QWQ 下次再见吧~"),
			);
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
			const { width, height, resolution } = getCubismCanvasMetrics();
			applyCubismCanvasStyle();
			pioContainer.classList.remove("pio-hidden");

			pixiApp = new cubismPIXI.Application({
				view: pioCanvas,
				width,
				height,
				antialias: true,
				transparent: true,
				backgroundAlpha: 0,
				autoStart: true,
				autoDensity: true,
				resolution,
			});

			if (cubismResizeCleanup) {
				cubismResizeCleanup();
			}
			cubismResizeCleanup = bindCubismResizeHandlers();

			setupCubismActions();
			applyCubismModeBehavior();

			const loaded = await loadCubismModel(
				pioOptions.model[cubismModelIndex],
			);
			if (loaded) {
				pioInitialized = true;
				keepPioInsideViewport();
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
			showCubismDialog("UG 初始化失败，已切换备用模型。", 3800);
			fallbackToLegacyPio("cubism-initialize-failed");
		}
	}

	// 加载必要的脚本
	function loadPioAssets() {
		if (typeof window === "undefined") return;

		if (useCubism4) {
			ensureCubism4Runtime()
				.then((ready) => {
					if (!ready) {
						showCubismDialog(
							"UG 核心加载失败，已自动切换备用模型。",
							4200,
						);
						fallbackToLegacyPio("cubism-runtime-prepare-failed");
						return;
					}

					setTimeout(initCubism4Pio, 50);
				})
				.catch((error) => {
					console.error("Failed to prepare Cubism4 runtime:", error);
					showCubismDialog("UG 运行时异常，已切换备用模型。", 3800);
					fallbackToLegacyPio("cubism-runtime-prepare-throw");
				});
			return;
		}

		loadLegacyPioScripts().catch((error) => {
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

		window.requestAnimationFrame(() => {
			keepPioInsideViewport();
		});
	});

	onDestroy(() => {
		if (dialogTimer) {
			window.clearTimeout(dialogTimer);
			dialogTimer = null;
		}

		cleanupCubismBindings();
		destroyCubismRenderer();

		pioInstance = null;
		pioInitialized = false;
		isRestoringCubism = false;
		cubismSuppressClickUntil = 0;
		lastTouchDialogText = "";

		console.log("Pio component destroyed");
	});
</script>

{#if pioConfig.enable}
	<div
		class={`pio-container ${pioConfig.position || "right"} ${useCubism4 ? "cubism4-mode" : ""} ${useCubism4 && showAnchorX === "right" ? "show-right" : ""} ${useCubism4 && showAnchorY === "top" ? "show-top" : ""}`}
		bind:this={pioContainer}
	>
		{#if useCubism4}
			<div
				class="pio-show"
				bind:this={pioShowButton}
				on:click={handleShowClick}
			></div>
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

	:global(.pio-container.cubism4-mode .pio-action) {
		left: auto !important;
		right: 0 !important;
	}

	:global(.pio-container.cubism4-mode.show-right .pio-show) {
		left: auto;
		right: -1em;
	}

	:global(.pio-container.cubism4-mode.show-top .pio-show) {
		top: 1em;
		bottom: auto;
	}

	:global(.pio-container.cubism4-mode.show-right.pio-hidden .pio-show:hover) {
		transform: translateX(-0.5em);
	}

	:global(.pio-container.cubism4-mode.pio-hidden #pio) {
		display: block !important;
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
	}
</style>

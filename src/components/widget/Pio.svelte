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
	}

	function bindCubismResizeHandlers() {
		if (typeof window === "undefined") return null;

		const handleResize = () => {
			syncCubismCanvasViewport();
		};

		window.addEventListener("resize", handleResize);
		window.addEventListener("orientationchange", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("orientationchange", handleResize);
		};
	}

	async function restoreCubismModel(event) {
		if (event && shouldSuppressCubismClick()) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}

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

		showCubismDialog(
			pickDialogText(pioConfig.dialog?.touch, "不可以这样欺负我啦！"),
			2200,
		);
	}

	function bindCubismCanvasTap() {
		if (!pioCanvas || typeof window === "undefined") return null;

		const handleCanvasClick = (event) => {
			handleCubismCanvasTap(event);
		};

		pioCanvas.addEventListener("click", handleCanvasClick);
		return () => {
			pioCanvas.removeEventListener("click", handleCanvasClick);
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

		pioInitialized = false;
		isRestoringCubism = false;
		pioOptions.model = [defaultLegacyModel];

		loadScript("/pio/static/l2d.js", "pio-l2d-script")
			.then(() => loadScript("/pio/static/pio.js", "pio-main-script"))
			.then(() => {
				setTimeout(initPio, 100);
			})
			.catch((error) => {
				console.error(
					"Failed to fallback to legacy Pio scripts:",
					error,
				);
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
		};

		const handlePointerDown = (event) => {
			if (event.pointerType === "mouse" && event.button !== 0) return;

			const rect = pioContainer.getBoundingClientRect();
			dragState.pointerDown = true;
			dragState.dragging = false;
			dragState.pointerId = event.pointerId;
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

			pioContainer.style.left = `${event.clientX - dragState.offsetX}px`;
			pioContainer.style.top = `${event.clientY - dragState.offsetY}px`;
			pioContainer.style.bottom = "auto";

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

		pioInstance = null;
		pioInitialized = false;
		isRestoringCubism = false;
		cubismSuppressClickUntil = 0;

		console.log("Pio component destroyed");
	});
</script>

{#if pioConfig.enable}
	<div
		class={`pio-container ${pioConfig.position || "right"} ${useCubism4 ? "cubism4-mode" : ""}`}
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

	:global(.pio-container.cubism4-mode.pio-hidden #pio) {
		display: block !important;
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
	}
</style>

/* ----

# Pio Plugin
# By: Dreamer-Paul
# Last Update: 2022.8.12

一个支持更换 Live2D 模型的 JS 插件

本代码为奇趣保罗原创，并遵守 GPL 2.0 开源协议。欢迎访问我的博客：https://paugram.com

---- */

var Paul_Pio = function (prop) {
	const current = {
		idol: 0,
		timeout: undefined,
		menu: document.querySelector(".pio-container .pio-action"),
		canvas: document.getElementById("pio"),
		body: document.querySelector(".pio-container"),
		root: document.location.origin + "/",
	};

	const dragThresholdPx = 6;
	const clickSuppressWindowMs = 240;
	let suppressClickUntil = 0;

	const shouldSuppressClick = () => Date.now() < suppressClickUntil;
	const markDragEnd = () => {
		suppressClickUntil = Date.now() + clickSuppressWindowMs;
	};

	// 工具通用函数
	const tools = {
		// 创建内容
		create: (tag, options) => {
			const el = document.createElement(tag);
			options.class && (el.className = options.class);

			return el;
		},
		// 随机内容
		rand: (arr) => {
			return arr[Math.floor(Math.random() * arr.length + 1) - 1];
		},
		// 是否为移动设备
		isMobile: () => {
			const ua = window.navigator.userAgent.toLowerCase();
			const mobilePattern = /mobile|android|iphone|ipad|ipod|ios/;

			return window.innerWidth < 768 || mobilePattern.test(ua);
		},
	};

	const elements = {
		home: tools.create("span", { class: "pio-home" }),
		skin: tools.create("span", { class: "pio-skin" }),
		info: tools.create("span", { class: "pio-info" }),
		night: tools.create("span", { class: "pio-night" }),
		close: tools.create("span", { class: "pio-close" }),

		dialog: tools.create("div", { class: "pio-dialog" }),
		show: tools.create("div", { class: "pio-show" }),
	};

	current.body.appendChild(elements.dialog);
	current.body.appendChild(elements.show);

	/* - 方法 */
	const modules = {
		// 更换模型
		idol: () => {
			current.idol < prop.model.length - 1
				? current.idol++
				: (current.idol = 0);

			return current.idol;
		},
		// 创建对话框方法
		message: (text, options = {}) => {
			const { dialog } = elements;

			if (text.constructor === Array) {
				dialog.innerText = tools.rand(text);
			} else if (text.constructor === String) {
				dialog[options.html ? "innerHTML" : "innerText"] = text;
			} else {
				dialog.innerText = "输入内容出现问题了 X_X";
			}

			dialog.classList.add("active");

			current.timeout = clearTimeout(current.timeout) || undefined;
			current.timeout = setTimeout(() => {
				dialog.classList.remove("active");
			}, options.time || 3000);
		},
		// 移除方法
		destroy: () => {
			this.initHidden();
			localStorage.setItem("posterGirl", "0");
		},
	};

	this.destroy = modules.destroy;
	this.message = modules.message;

	/* - 提示操作 */
	const action = {
		// 欢迎
		welcome: () => {
			if (document.referrer && document.referrer.includes(current.root)) {
				const referrer = document.createElement("a");
				referrer.href = document.referrer;

				if (prop.content.referer) {
					modules.message(
						prop.content.referer.replace(
							/%t/,
							`“${referrer.hostname}”`,
						),
					);
				} else {
					modules.message(`欢迎来自 “${referrer.hostname}” 的朋友！`);
				}
			} else if (prop.tips) {
				let text,
					hour = new Date().getHours();

				if (hour > 22 || hour <= 5) {
					text = "你是夜猫子呀？这么晚还不睡觉，明天起的来嘛";
				} else if (hour > 5 && hour <= 8) {
					text = "早上好！";
				} else if (hour > 8 && hour <= 11) {
					text = "上午好！工作顺利嘛，不要久坐，多起来走动走动哦！";
				} else if (hour > 11 && hour <= 14) {
					text = "中午了，工作了一个上午，现在是午餐时间！";
				} else if (hour > 14 && hour <= 17) {
					text = "午后很容易犯困呢，今天的运动目标完成了吗？";
				} else if (hour > 17 && hour <= 19) {
					text = "傍晚了！窗外夕阳的景色很美丽呢，最美不过夕阳红~";
				} else if (hour > 19 && hour <= 21) {
					text = "晚上好，今天过得怎么样？";
				} else if (hour > 21 && hour <= 23) {
					text = "已经这么晚了呀，早点休息吧，晚安~";
				} else {
					text = "奇趣保罗说：这个是无法被触发的吧，哈哈";
				}

				modules.message(text);
			} else {
				modules.message(prop.content.welcome || "欢迎来到本站！");
			}
		},
		// 触摸
		touch: () => {
			current.canvas.onclick = () => {
				modules.message(
					prop.content.touch || [
						"你在干什么？",
						"再摸我就报警了！",
						"HENTAI!",
						"不可以这样欺负我啦！",
					],
				);
			};
		},
		// 右侧按钮
		buttons: () => {
			// 返回首页 - 使用 Swup 无刷新跳转
			elements.home.onclick = () => {
				// 检查 Swup 是否可用
				if (typeof window !== "undefined" && window.swup) {
					try {
						// 使用 Swup 进行无刷新跳转
						window.swup.navigate("/");
					} catch (error) {
						console.error("Swup navigation failed:", error);
						// 降级到普通跳转
						location.href = current.root;
					}
				} else {
					// Swup 不可用时使用普通跳转
					location.href = current.root;
				}
			};
			elements.home.onmouseover = () => {
				modules.message(prop.content.home || "点击这里回到首页！");
			};
			current.menu.appendChild(elements.home);

			// 更换模型
			if (prop.model && prop.model.length > 1) {
				elements.skin.onclick = () => {
					loadlive2d("pio", prop.model[modules.idol()]);

					prop.content.skin &&
						modules.message(
							prop.content.skin[1] || "新衣服真漂亮~",
						);
				};
				elements.skin.onmouseover = () => {
					prop.content.skin &&
						modules.message(
							prop.content.skin[0] || "想看看我的新衣服吗？",
						);
				};
				current.menu.appendChild(elements.skin);
			}

			// 关于我
			elements.info.onclick = () => {
				window.open(
					prop.content.link ||
						"https://paugram.com/coding/add-poster-girl-with-plugin.html",
				);
			};
			elements.info.onmouseover = () => {
				modules.message("想了解更多关于我的信息吗？");
			};
			current.menu.appendChild(elements.info);

			// 夜间模式
			if (prop.night) {
				elements.night.onclick = () => {
					typeof prop.night === "function"
						? prop.night()
						: eval(prop.night);
				};
				elements.night.onmouseover = () => {
					modules.message("夜间点击这里可以保护眼睛呢");
				};
				current.menu.appendChild(elements.night);
			}

			// 关闭看板娘
			elements.close.onclick = () => {
				modules.destroy();
			};
			elements.close.onmouseover = () => {
				modules.message(prop.content.close || "QWQ 下次再见吧~");
			};
			current.menu.appendChild(elements.close);
		},
		// 自定义选择器
		custom: () => {
			prop.content.custom.forEach((item) => {
				const el = document.querySelectorAll(item.selector);

				if (!el.length) return;

				for (let i = 0; i < el.length; i++) {
					if (item.type === "read") {
						el[i].onmouseover = (ev) => {
							const text =
								ev.currentTarget.title ||
								ev.currentTarget.innerText;
							modules.message(
								"想阅读 %t 吗？".replace(
									/%t/,
									"“" + text + "”",
								),
							);
						};
					} else if (item.type === "link") {
						el[i].onmouseover = (ev) => {
							const text =
								ev.currentTarget.title ||
								ev.currentTarget.innerText;
							modules.message(
								"想了解一下 %t 吗？".replace(
									/%t/,
									"“" + text + "”",
								),
							);
						};
					} else if (item.text) {
						el[i].onmouseover = () => {
							modules.message(t.text);
						};
					}
				}
			});
		},
	};

	/* - 运行 */
	const begin = {
		static: () => {
			current.body.classList.add("static");
		},
		fixed: () => {
			action.touch();
			action.buttons();
		},
		draggable: () => {
			action.touch();
			action.buttons();

			const body = current.body;
			if (typeof body.__pioDragCleanup === "function") {
				body.__pioDragCleanup();
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

			const suppressSyntheticClick = (ev) => {
				if (shouldSuppressClick()) {
					ev.preventDefault();
					ev.stopPropagation();
				}
			};

			const pointerdown = (ev) => {
				if (ev.pointerType === "mouse" && ev.button !== 0) return;

				const rect = body.getBoundingClientRect();
				dragState.pointerDown = true;
				dragState.dragging = false;
				dragState.pointerId = ev.pointerId;
				dragState.startX = ev.clientX;
				dragState.startY = ev.clientY;
				dragState.offsetX = ev.clientX - rect.left;
				dragState.offsetY = ev.clientY - rect.top;

				if (typeof body.setPointerCapture === "function") {
					try {
						body.setPointerCapture(ev.pointerId);
					} catch (error) {
						console.warn(
							"Failed to capture pointer in legacy mode:",
							error,
						);
					}
				}

				ev.preventDefault();
			};

			const pointermove = (ev) => {
				if (!dragState.pointerDown) return;

				const distance = Math.hypot(
					ev.clientX - dragState.startX,
					ev.clientY - dragState.startY,
				);

				if (!dragState.dragging && distance < dragThresholdPx) {
					return;
				}

				if (!dragState.dragging) {
					dragState.dragging = true;
					body.classList.add("active");
					body.classList.remove("right");
				}

				body.style.left = ev.clientX - dragState.offsetX + "px";
				body.style.top = ev.clientY - dragState.offsetY + "px";
				body.style.bottom = "auto";

				ev.preventDefault();
			};

			const pointerup = (ev) => {
				if (!dragState.pointerDown) return;

				if (dragState.dragging) {
					markDragEnd();
				}

				dragState.pointerDown = false;
				dragState.dragging = false;

				if (
					dragState.pointerId !== null &&
					typeof body.releasePointerCapture === "function"
				) {
					try {
						body.releasePointerCapture(dragState.pointerId);
					} catch (error) {
						console.warn(
							"Failed to release pointer in legacy mode:",
							error,
						);
					}
				}

				dragState.pointerId = null;
				body.classList.remove("active");

				if (ev) {
					ev.preventDefault();
				}
			};

			body.onpointerdown = pointerdown;
			document.addEventListener("pointermove", pointermove);
			document.addEventListener("pointerup", pointerup);
			document.addEventListener("pointercancel", pointerup);
			body.addEventListener("click", suppressSyntheticClick, true);

			body.__pioDragCleanup = () => {
				body.onpointerdown = null;
				document.removeEventListener("pointermove", pointermove);
				document.removeEventListener("pointerup", pointerup);
				document.removeEventListener("pointercancel", pointerup);
				body.removeEventListener("click", suppressSyntheticClick, true);
				body.classList.remove("active");
			};
		},
	};

	// 运行
	this.init = (noModel) => {
		// 未隐藏 + 非手机版，出现操作功能
		if (!(prop.hidden && tools.isMobile())) {
			if (!noModel) {
				action.welcome();
				loadlive2d("pio", prop.model[0]);
			}

			switch (prop.mode) {
				case "static":
					begin.static();
					break;
				case "fixed":
					begin.fixed();
					break;
				case "draggable":
					begin.draggable();
					break;
			}

			prop.content.custom && action.custom();
		}
	};

	// 隐藏状态
	this.initHidden = () => {
		// ! 清除预设好的间距
		if (prop.mode === "draggable") {
			if (typeof current.body.__pioDragCleanup === "function") {
				current.body.__pioDragCleanup();
			}

			current.body.style.top = null;
			current.body.style.left = null;
			current.body.style.bottom = null;
		}

		current.body.classList.add("pio-hidden");
		elements.dialog.classList.remove("active");

		if (typeof elements.show.__pioShowDragCleanup === "function") {
			elements.show.__pioShowDragCleanup();
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

		const pointerdown = (ev) => {
			if (ev.pointerType === "mouse" && ev.button !== 0) return;

			const rect = current.body.getBoundingClientRect();
			dragState.pointerDown = true;
			dragState.dragging = false;
			dragState.pointerId = ev.pointerId;
			dragState.startX = ev.clientX;
			dragState.startY = ev.clientY;
			dragState.offsetX = ev.clientX - rect.left;
			dragState.offsetY = ev.clientY - rect.top;

			if (typeof elements.show.setPointerCapture === "function") {
				try {
					elements.show.setPointerCapture(ev.pointerId);
				} catch (error) {
					console.warn(
						"Failed to capture pointer on hidden bubble:",
						error,
					);
				}
			}

			ev.preventDefault();
			ev.stopPropagation();
		};

		const pointermove = (ev) => {
			if (!dragState.pointerDown) return;

			const distance = Math.hypot(
				ev.clientX - dragState.startX,
				ev.clientY - dragState.startY,
			);

			if (!dragState.dragging && distance < dragThresholdPx) {
				return;
			}

			if (!dragState.dragging) {
				dragState.dragging = true;
				current.body.classList.add("active");
				current.body.classList.remove("right");
			}

			current.body.style.left = ev.clientX - dragState.offsetX + "px";
			current.body.style.top = ev.clientY - dragState.offsetY + "px";
			current.body.style.bottom = "auto";

			ev.preventDefault();
		};

		const pointerup = (ev) => {
			if (!dragState.pointerDown) return;

			if (dragState.dragging) {
				markDragEnd();
			}

			dragState.pointerDown = false;
			dragState.dragging = false;

			if (
				dragState.pointerId !== null &&
				typeof elements.show.releasePointerCapture === "function"
			) {
				try {
					elements.show.releasePointerCapture(dragState.pointerId);
				} catch (error) {
					console.warn(
						"Failed to release pointer on hidden bubble:",
						error,
					);
				}
			}

			dragState.pointerId = null;
			current.body.classList.remove("active");

			if (ev) {
				ev.preventDefault();
			}
		};

		const clickHandler = (ev) => {
			if (shouldSuppressClick()) {
				ev.preventDefault();
				ev.stopPropagation();
				return;
			}

			current.body.classList.remove("pio-hidden");
			localStorage.setItem("posterGirl", "1");

			this.init();
		};

		elements.show.onpointerdown = pointerdown;
		document.addEventListener("pointermove", pointermove);
		document.addEventListener("pointerup", pointerup);
		document.addEventListener("pointercancel", pointerup);
		elements.show.addEventListener("click", clickHandler);

		elements.show.__pioShowDragCleanup = () => {
			elements.show.onpointerdown = null;
			document.removeEventListener("pointermove", pointermove);
			document.removeEventListener("pointerup", pointerup);
			document.removeEventListener("pointercancel", pointerup);
			elements.show.removeEventListener("click", clickHandler);
			current.body.classList.remove("active");
		};
	};

	localStorage.getItem("posterGirl") === "0"
		? this.initHidden()
		: this.init();
};

// 请保留版权说明
if (window.console && window.console.log) {
	console.log(
		"%c Pio %c https://paugram.com ",
		"color: #fff; margin: 1em 0; padding: 5px 0; background: #673ab7;",
		"margin: 1em 0; padding: 5px 0; background: #efefef;",
	);
}

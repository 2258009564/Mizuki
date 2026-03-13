<script lang="ts">
	import Icon from "@iconify/svelte";
	import { onDestroy, onMount } from "svelte";
	import { slide } from "svelte/transition";
	// 从配置文件中导入音乐播放器配置
	import { musicPlayerConfig } from "../../config";
	// 导入国际化相关的 Key 和 i18n 实例
	import Key from "../../i18n/i18nKey";
	import { i18n } from "../../i18n/translation";

	// 音乐播放器模式，可选 "local" 或 "meting"，从本地配置中获取或使用默认值 "meting"
	let mode = musicPlayerConfig.mode ?? "meting";
	// Meting API 地址，从配置中获取或使用默认地址(bilibili.uno(由哔哩哔哩松坂有希公益管理)),服务器在海外,部分音乐平台可能不支持并且速度可能慢,也可以自建Meting API
	let meting_api =
		musicPlayerConfig.meting_api ??
		"https://www.bilibili.uno/api?server=:server&type=:type&id=:id&auth=:auth&r=:r";
	// Meting API 的 ID，从配置中获取或使用默认值
	let meting_id = musicPlayerConfig.id ?? "14164869977";
	// Meting API 的服务器，从配置中获取或使用默认值,有的meting的api源支持更多平台,一般来说,netease=网易云音乐, tencent=QQ音乐, kugou=酷狗音乐, xiami=虾米音乐, baidu=百度音乐
	let meting_server = musicPlayerConfig.server ?? "netease";
	// Meting API 的类型，从配置中获取或使用默认值
	let meting_type = musicPlayerConfig.type ?? "playlist";

	// 播放状态，默认为 false (未播放)
	let isPlaying = false;
	// 播放器是否展开，默认为 false
	let isExpanded = false;
	// 播放器是否隐藏，默认为 false
	let isHidden = false;
	// 是否显示播放列表，默认为 false
	let showPlaylist = false;
	// 当前播放时间，默认为 0
	let currentTime = 0;
	// 歌曲总时长，默认为 0
	let duration = 0;

	// localStorage 存储音量
	const STORAGE_KEY_VOLUME = "music-player-volume";
	// localStorage 存储播放进度
	const STORAGE_KEY_PROGRESS = "music-player-progress";
	// localStorage 缓存歌单（用于提升刷新后的恢复速度）
	const STORAGE_KEY_PLAYLIST_CACHE = "music-player-playlist-cache";
	const PLAYLIST_CACHE_MAX_AGE = 12 * 60 * 60 * 1000; // 12小时
	const MIN_REMAINING_SECONDS_TO_RESUME = 1.5;

	// 音量，默认为 0.7
	let volume = 0.7;
	// 是否静音，默认为 false
	let isMuted = false;
	// 是否正在加载，默认为 false
	let isLoading = false;
	// 是否随机播放，默认为 false
	let isShuffled = false;
	// 循环模式，0: 不循环, 1: 单曲循环, 2: 列表循环，默认为 0
	let isRepeating = 0;
	// 错误信息，默认为空字符串
	let errorMessage = "";
	// 是否显示错误信息，默认为 false
	let showError = false;

	// 当前歌曲信息
	let currentSong = {
		title: "Sample Song",
		artist: "Sample Artist",
		cover: "/favicon/favicon.ico",
		url: "",
		duration: 0,
	};

	type Song = {
		id: string | number;
		title: string;
		artist: string;
		cover: string;
		url: string;
		duration: number;
	};

	let playlist: Song[] = [];
	let currentIndex = 0;
	let audio: HTMLAudioElement;
	let progressBar: HTMLElement;
	let volumeBar: HTMLElement;

	const localPlaylist = [
		{
			id: 1,
			title: "ひとり上手",
			artist: "Kaya",
			cover: "assets/music/cover/hitori.jpg",
			url: "assets/music/url/hitori.mp3",
			duration: 240,
		},
		{
			id: 2,
			title: "眩耀夜行",
			artist: "スリーズブーケ",
			cover: "assets/music/cover/xryx.jpg",
			url: "assets/music/url/xryx.mp3",
			duration: 180,
		},
		{
			id: 3,
			title: "春雷の頃",
			artist: "22/7",
			cover: "assets/music/cover/cl.jpg",
			url: "assets/music/url/cl.mp3",
			duration: 200,
		},
	];

	// 从localStorage加载音量设置
	function loadVolumeSettings() {
		try {
			if (typeof localStorage !== "undefined") {
				const savedVolume = localStorage.getItem(STORAGE_KEY_VOLUME);
				if (savedVolume !== null && !isNaN(parseFloat(savedVolume))) {
					volume = parseFloat(savedVolume);
				}
			}
		} catch (e) {
			console.warn(
				"Failed to load volume settings from localStorage:",
				e,
			);
		}
	}
	// 保存音量设置到localStorage
	function saveVolumeSettings() {
		try {
			if (typeof localStorage !== "undefined") {
				localStorage.setItem(STORAGE_KEY_VOLUME, volume.toString());
			}
		} catch (e) {
			console.warn("Failed to save volume settings to localStorage:", e);
		}
	}

	type SavedPlaybackProgress = {
		currentIndex: number;
		currentTime: number;
		songKey: string;
		timestamp: number;
	};

	type PlaylistCache = {
		timestamp: number;
		playlist: Song[];
	};

	let hasInitializedSong = false;

	let pendingRestoreTime: number | null = null;

	function normalizeDuration(rawDuration: unknown): number {
		const dur = Number(rawDuration ?? 0);
		if (!Number.isFinite(dur) || dur <= 0) return 0;
		return dur > 10000 ? Math.floor(dur / 1000) : Math.floor(dur);
	}

	function mapMetingSong(song: any): Song {
		const title = song.name ?? song.title ?? i18n(Key.unknownSong);
		const artist = song.artist ?? song.author ?? i18n(Key.unknownArtist);
		const cover = song.pic ?? "";
		const url = song.url ?? "";
		const rawId = song.id;
		const id =
			typeof rawId === "string" || typeof rawId === "number"
				? rawId
				: `${title}|${artist}|${url}`;

		return {
			id,
			title,
			artist,
			cover,
			url,
			duration: normalizeDuration(song.duration),
		};
	}

	function normalizeCachedSong(song: any): Song | null {
		if (!song || typeof song !== "object") return null;

		const title =
			typeof song.title === "string" && song.title.length > 0
				? song.title
				: i18n(Key.unknownSong);
		const artist =
			typeof song.artist === "string" && song.artist.length > 0
				? song.artist
				: i18n(Key.unknownArtist);
		const cover = typeof song.cover === "string" ? song.cover : "";
		const url = typeof song.url === "string" ? song.url : "";
		const rawId = song.id;
		const id =
			typeof rawId === "string" || typeof rawId === "number"
				? rawId
				: `${title}|${artist}|${url}`;

		return {
			id,
			title,
			artist,
			cover,
			url,
			duration: normalizeDuration(song.duration),
		};
	}

	function savePlaylistCache(songs: Song[]) {
		try {
			if (typeof localStorage === "undefined") return;
			const cache: PlaylistCache = {
				timestamp: Date.now(),
				playlist: songs,
			};
			localStorage.setItem(
				STORAGE_KEY_PLAYLIST_CACHE,
				JSON.stringify(cache),
			);
		} catch (e) {
			console.warn("Failed to save playlist cache:", e);
		}
	}

	function loadPlaylistCache(): Song[] | null {
		try {
			if (typeof localStorage === "undefined") return null;
			const raw = localStorage.getItem(STORAGE_KEY_PLAYLIST_CACHE);
			if (!raw) return null;

			const parsed = JSON.parse(raw) as Partial<PlaylistCache>;
			if (!parsed || !Array.isArray(parsed.playlist)) return null;

			if (
				typeof parsed.timestamp === "number" &&
				Date.now() - parsed.timestamp > PLAYLIST_CACHE_MAX_AGE
			) {
				return null;
			}

			const cachedSongs = parsed.playlist
				.map((song) => normalizeCachedSong(song))
				.filter((song): song is Song => song !== null)
				.filter((song) => song.url.length > 0);

			return cachedSongs.length > 0 ? cachedSongs : null;
		} catch (e) {
			console.warn("Failed to load playlist cache:", e);
			return null;
		}
	}

	function getSongKey(song: {
		id?: string | number;
		title?: string;
		artist?: string;
		url?: string;
	}): string {
		if (song.id !== undefined && song.id !== null) {
			return String(song.id);
		}
		return `${song.title ?? ""}|${song.artist ?? ""}|${song.url ?? ""}`;
	}

	// 播放进度保存的节流机制
	let lastProgressSaveTime = 0;
	const PROGRESS_SAVE_INTERVAL = 2000; // 2秒保存一次

	// 保存播放进度到localStorage
	function savePlaybackProgress(forceTime?: number) {
		try {
			if (typeof localStorage !== "undefined") {
				const activeSong = currentSong.url
					? currentSong
					: (playlist[currentIndex] ?? currentSong);
				const audioTime =
					audio && Number.isFinite(audio.currentTime)
						? audio.currentTime
						: currentTime;
				const playbackTime =
					typeof forceTime === "number" ? forceTime : audioTime;
				const progress: SavedPlaybackProgress = {
					currentIndex,
					currentTime: playbackTime || 0,
					songKey: getSongKey(activeSong),
					timestamp: Date.now(),
				};
				localStorage.setItem(
					STORAGE_KEY_PROGRESS,
					JSON.stringify(progress),
				);
			}
		} catch (e) {
			console.warn("Failed to save playback progress:", e);
		}
	}

	// 带节流的保存进度函数
	function savePlaybackProgressThrottled() {
		const now = Date.now();
		if (now - lastProgressSaveTime >= PROGRESS_SAVE_INTERVAL) {
			savePlaybackProgress();
			lastProgressSaveTime = now;
		}
	}

	function readSavedPlaybackProgress(): SavedPlaybackProgress | null {
		try {
			if (typeof localStorage !== "undefined") {
				const savedProgress =
					localStorage.getItem(STORAGE_KEY_PROGRESS);
				if (savedProgress) {
					const parsed = JSON.parse(
						savedProgress,
					) as Partial<SavedPlaybackProgress>;
					const legacySongId = (parsed as { currentSongId?: unknown })
						.currentSongId;
					const fallbackSongKey =
						typeof legacySongId === "string"
							? legacySongId
							: undefined;
					if (
						typeof parsed.currentIndex === "number" &&
						typeof parsed.currentTime === "number" &&
						(typeof parsed.songKey === "string" ||
							typeof fallbackSongKey === "string")
					) {
						return {
							currentIndex: parsed.currentIndex,
							currentTime: parsed.currentTime,
							songKey: parsed.songKey ?? fallbackSongKey ?? "",
							timestamp:
								typeof parsed.timestamp === "number"
									? parsed.timestamp
									: Date.now(),
						};
					}
				}
			}
		} catch (e) {
			console.warn("Failed to parse playback progress:", e);
		}
		return null;
	}

	function restorePlaybackProgressFromPlaylist(): boolean {
		const saved = readSavedPlaybackProgress();
		if (!saved || playlist.length === 0) return false;

		let restoreIndex = playlist.findIndex(
			(song) => getSongKey(song) === saved.songKey,
		);

		if (restoreIndex < 0) {
			restoreIndex = playlist.findIndex(
				(song) => `${song.title}${song.artist}` === saved.songKey,
			);
		}

		if (
			restoreIndex < 0 &&
			saved.currentIndex >= 0 &&
			saved.currentIndex < playlist.length
		) {
			restoreIndex = saved.currentIndex;
		}

		if (restoreIndex < 0) return false;

		currentIndex = restoreIndex;
		pendingRestoreTime = saved.currentTime > 0 ? saved.currentTime : null;
		loadSong(playlist[restoreIndex]);
		return true;
	}

	function initializePlayerFromPlaylist() {
		if (playlist.length === 0) return;
		hasInitializedSong = true;
		if (!restorePlaybackProgressFromPlaylist()) {
			loadSong(playlist[0]);
		}
	}

	async function fetchMetingPlaylist(showLoading = true) {
		if (!meting_api || !meting_id) return;
		if (showLoading || !currentSong.url) {
			isLoading = true;
		}
		const apiUrl = meting_api
			.replace(":server", meting_server)
			.replace(":type", meting_type)
			.replace(":id", meting_id)
			.replace(":auth", "")
			.replace(":r", Date.now().toString());
		try {
			const res = await fetch(apiUrl);
			if (!res.ok) throw new Error("meting api error");
			const list = await res.json();

			if (!Array.isArray(list) || list.length === 0) {
				throw new Error("empty meting playlist");
			}

			playlist = list
				.map((song: any) => mapMetingSong(song))
				.filter((song) => song.url.length > 0);

			if (playlist.length === 0) {
				throw new Error("no playable songs in meting playlist");
			}

			savePlaylistCache(playlist);

			if (!hasInitializedSong) {
				initializePlayerFromPlaylist();
			} else {
				const currentSongKey = getSongKey(currentSong);
				const matchedIndex = playlist.findIndex(
					(song) =>
						song.url === currentSong.url ||
						getSongKey(song) === currentSongKey,
				);
				if (matchedIndex >= 0) {
					currentIndex = matchedIndex;
				} else {
					const fallbackIndex = playlist.findIndex(
						(song) =>
							song.title === currentSong.title &&
							song.artist === currentSong.artist,
					);
					if (fallbackIndex >= 0) {
						currentIndex = fallbackIndex;
					}
				}
			}

			isLoading = false;
		} catch (e) {
			console.warn("Failed to fetch meting playlist:", e);
			if (!hasInitializedSong && !currentSong.url) {
				showErrorMessage(i18n(Key.musicPlayerErrorPlaylist));
			}
			isLoading = false;
		}
	}

	function togglePlay() {
		if (!audio || !currentSong.url) return;
		if (isPlaying) {
			audio.pause();
		} else {
			audio.play().catch(() => {});
		}
	}

	function toggleExpanded() {
		isExpanded = !isExpanded;
		if (isExpanded) {
			showPlaylist = false;
			isHidden = false;
		}
	}

	function toggleHidden() {
		isHidden = !isHidden;
		if (isHidden) {
			isExpanded = false;
			showPlaylist = false;
		}
	}

	function togglePlaylist() {
		showPlaylist = !showPlaylist;
	}

	function toggleShuffle() {
		isShuffled = !isShuffled;
		if (isShuffled) {
			isRepeating = 0;
		}
	}

	function toggleRepeat() {
		isRepeating = (isRepeating + 1) % 3;
		if (isRepeating !== 0) {
			isShuffled = false;
		}
	}

	function previousSong() {
		if (playlist.length <= 1) return;
		const newIndex =
			currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
		playSong(newIndex);
	}

	function nextSong(autoPlay: boolean = true) {
		if (playlist.length <= 1) return;

		let newIndex: number;
		if (isShuffled) {
			do {
				newIndex = Math.floor(Math.random() * playlist.length);
			} while (newIndex === currentIndex && playlist.length > 1);
		} else {
			newIndex =
				currentIndex < playlist.length - 1 ? currentIndex + 1 : 0;
		}
		playSong(newIndex, autoPlay);
	}

	// 记录切歌时的播放意图，用于解决加载失败时的状态传递问题
	let willAutoPlay = false;

	function playSong(index: number, autoPlay = true) {
		if (index < 0 || index >= playlist.length) return;

		willAutoPlay = autoPlay;
		pendingRestoreTime = null; // 用户主动切歌时，避免使用旧恢复时间
		currentIndex = index;
		loadSong(playlist[currentIndex]);
		savePlaybackProgress(0); // 切歌后立即记录新歌曲，从 0 秒开始
	}

	function getAssetPath(path: string): string {
		if (path.startsWith("http://") || path.startsWith("https://"))
			return path;
		if (path.startsWith("/")) return path;
		return `/${path}`;
	}

	function loadSong(song: typeof currentSong) {
		if (!song) return;
		if (song.url !== currentSong.url) {
			currentSong = { ...song };
			currentTime = 0;
			duration = song.duration || 0;
			if (song.url) {
				isLoading = true;
			} else {
				isLoading = false;
			}
		}
	}

	// 标记是否因浏览器策略导致自动播放失败
	let autoplayFailed = false;

	function syncDurationFromAudio() {
		if (audio?.duration && audio.duration > 1) {
			duration = Math.floor(audio.duration);
			if (playlist[currentIndex])
				playlist[currentIndex].duration = duration;
			currentSong.duration = duration;
		}
	}

	function applyPendingRestoreTime() {
		if (
			pendingRestoreTime === null ||
			!audio ||
			!Number.isFinite(audio.duration) ||
			audio.duration <= 0
		) {
			return;
		}

		const safeRestoreTime = Math.min(
			Math.max(
				audio.duration - pendingRestoreTime <=
					MIN_REMAINING_SECONDS_TO_RESUME
					? 0
					: pendingRestoreTime,
				0,
			),
			Math.max(audio.duration - 0.5, 0),
		);
		const currentAudioTime = Number.isFinite(audio.currentTime)
			? audio.currentTime
			: 0;

		if (Math.abs(currentAudioTime - safeRestoreTime) > 0.8) {
			audio.currentTime = safeRestoreTime;
		}
		currentTime = safeRestoreTime;
		pendingRestoreTime = null;
	}

	function handleLoadedMetadata() {
		syncDurationFromAudio();
		applyPendingRestoreTime();
	}

	function handleLoadSuccess() {
		isLoading = false;
		syncDurationFromAudio();
		applyPendingRestoreTime();

		if (willAutoPlay || isPlaying) {
			const playPromise = audio.play();
			if (playPromise !== undefined) {
				playPromise.catch((error) => {
					console.warn("自动播放被拦截，等待用户交互:", error);
					autoplayFailed = true;
					isPlaying = false;
				});
			}
		}
	}

	function handleUserInteraction() {
		if (autoplayFailed && audio) {
			const playPromise = audio.play();
			if (playPromise !== undefined) {
				playPromise
					.then(() => {
						autoplayFailed = false;
					})
					.catch(() => {});
			}
		}
	}

	function handleLoadError(_event: Event) {
		if (!currentSong.url) return;
		isLoading = false;
		pendingRestoreTime = null;
		showErrorMessage(i18n(Key.musicPlayerErrorSong));

		const shouldContinue = isPlaying || willAutoPlay;
		if (playlist.length > 1) {
			setTimeout(() => nextSong(shouldContinue), 1000);
		} else {
			showErrorMessage(i18n(Key.musicPlayerErrorEmpty));
		}
	}

	function handleLoadStart() {}

	function handleAudioEnded() {
		if (isRepeating === 1) {
			audio.currentTime = 0;
			audio.play().catch(() => {});
		} else if (isRepeating === 2 || isShuffled) {
			nextSong(true);
		} else {
			isPlaying = false;
		}
	}

	function showErrorMessage(message: string) {
		errorMessage = message;
		showError = true;
		setTimeout(() => {
			showError = false;
		}, 3000);
	}
	function hideError() {
		showError = false;
	}

	function setProgress(event: MouseEvent) {
		if (!audio || !progressBar) return;
		const rect = progressBar.getBoundingClientRect();
		const percent = (event.clientX - rect.left) / rect.width;
		const newTime = percent * duration;
		audio.currentTime = newTime;
		currentTime = newTime;
		savePlaybackProgress();
	}

	let isVolumeDragging = false;
	let isPointerDown = false;
	let volumeBarRect: DOMRect | null = null;
	let rafId: number | null = null;

	function startVolumeDrag(event: PointerEvent) {
		if (!volumeBar) return;
		event.preventDefault();

		isPointerDown = true;
		volumeBar.setPointerCapture(event.pointerId);

		volumeBarRect = volumeBar.getBoundingClientRect();
		updateVolumeLogic(event.clientX);
	}

	function handleVolumeMove(event: PointerEvent) {
		if (!isPointerDown) return;
		event.preventDefault();

		isVolumeDragging = true;
		if (rafId) return;

		rafId = requestAnimationFrame(() => {
			updateVolumeLogic(event.clientX);
			rafId = null;
		});
	}

	function stopVolumeDrag(event: PointerEvent) {
		if (!isPointerDown) return;
		isPointerDown = false;
		isVolumeDragging = false;
		volumeBarRect = null;
		if (volumeBar) {
			volumeBar.releasePointerCapture(event.pointerId);
		}

		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		saveVolumeSettings();
	}

	function updateVolumeLogic(clientX: number) {
		if (!audio || !volumeBar) return;

		const rect = volumeBarRect || volumeBar.getBoundingClientRect();
		const percent = Math.max(
			0,
			Math.min(1, (clientX - rect.left) / rect.width),
		);
		volume = percent;
	}

	function toggleMute() {
		isMuted = !isMuted;
	}

	function formatTime(seconds: number): string {
		if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}

	const interactionEvents = ["click", "keydown", "touchstart"];

	// 页面卸载时保存进度
	function handlePageUnload() {
		savePlaybackProgress(); // 强制保存进度，不受节流限制
	}

	onMount(() => {
		loadVolumeSettings();
		interactionEvents.forEach((event) => {
			document.addEventListener(event, handleUserInteraction, {
				capture: true,
			});
		});

		// 监听页面即将卸载，强制保存进度
		if (typeof window !== "undefined") {
			window.addEventListener("pagehide", handlePageUnload);
			window.addEventListener("beforeunload", handlePageUnload);
		}

		if (!musicPlayerConfig.enable) {
			return;
		}
		if (mode === "meting") {
			const cachedPlaylist = loadPlaylistCache();
			if (cachedPlaylist && cachedPlaylist.length > 0) {
				playlist = cachedPlaylist;
				initializePlayerFromPlaylist();
			}
			fetchMetingPlaylist(!(cachedPlaylist && cachedPlaylist.length > 0));
		} else {
			// 使用本地播放列表，不发送任何API请求
			playlist = [...localPlaylist];
			if (playlist.length > 0) {
				initializePlayerFromPlaylist();
			} else {
				showErrorMessage("本地播放列表为空");
			}
		}
	});

	onDestroy(() => {
		if (typeof document !== "undefined") {
			interactionEvents.forEach((event) => {
				document.removeEventListener(event, handleUserInteraction, {
					capture: true,
				});
			});
		}

		// 清理页面卸载监听
		if (typeof window !== "undefined") {
			window.removeEventListener("pagehide", handlePageUnload);
			window.removeEventListener("beforeunload", handlePageUnload);
		}

		// 组件销毁时保存最终进度
		savePlaybackProgress();
	});
</script>

<audio
	bind:this={audio}
	src={getAssetPath(currentSong.url)}
	bind:volume
	bind:muted={isMuted}
	on:play={() => (isPlaying = true)}
	on:pause={() => {
		isPlaying = false;
		savePlaybackProgress(); // 暂停时立即保存进度
	}}
	on:timeupdate={() => {
		currentTime = audio.currentTime;
		savePlaybackProgressThrottled();
	}}
	on:ended={handleAudioEnded}
	on:error={handleLoadError}
	on:loadedmetadata={handleLoadedMetadata}
	on:loadeddata={handleLoadSuccess}
	on:loadstart={handleLoadStart}
	preload="auto"
></audio>

<svelte:window
	on:pointermove={handleVolumeMove}
	on:pointerup={stopVolumeDrag}
/>

{#if musicPlayerConfig.enable}
	{#if showError}
		<div class="fixed bottom-20 right-4 z-60 max-w-sm">
			<div
				class="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up"
			>
				<Icon icon="material-symbols:error" class="text-xl shrink-0" />
				<span class="text-sm flex-1">{errorMessage}</span>
				<button
					on:click={hideError}
					class="text-white/80 hover:text-white transition-colors"
				>
					<Icon icon="material-symbols:close" class="text-lg" />
				</button>
			</div>
		</div>
	{/if}

	<div
		class="music-player fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out"
		class:expanded={isExpanded}
		class:hidden-mode={isHidden}
	>
		<!-- 隐藏状态的小圆球 -->
		<div
			class="orb-player w-12 h-12 bg-(--primary) rounded-full shadow-lg cursor-pointer transition-all duration-500 ease-in-out flex items-center justify-center hover:scale-110 active:scale-95"
			class:opacity-0={!isHidden}
			class:scale-0={!isHidden}
			class:pointer-events-none={!isHidden}
			on:click={toggleHidden}
			on:keydown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					toggleHidden();
				}
			}}
			role="button"
			tabindex="0"
			aria-label={i18n(Key.musicPlayerShow)}
		>
			{#if isLoading}
				<Icon icon="eos-icons:loading" class="text-white text-lg" />
			{:else if isPlaying}
				<div class="flex space-x-0.5">
					<div
						class="w-0.5 h-3 bg-white rounded-full animate-pulse"
					></div>
					<div
						class="w-0.5 h-4 bg-white rounded-full animate-pulse"
						style="animation-delay: 150ms;"
					></div>
					<div
						class="w-0.5 h-2 bg-white rounded-full animate-pulse"
						style="animation-delay: 300ms;"
					></div>
				</div>
			{:else}
				<Icon
					icon="material-symbols:music-note"
					class="text-white text-lg"
				/>
			{/if}
		</div>
		<!-- 收缩状态的迷你播放器（封面圆形） -->
		<div
			class="mini-player card-base bg-(--float-panel-bg) shadow-xl rounded-2xl p-3 transition-all duration-500 ease-in-out"
			class:opacity-0={isExpanded || isHidden}
			class:scale-95={isExpanded || isHidden}
			class:pointer-events-none={isExpanded || isHidden}
		>
			<div class="flex items-center gap-3">
				<!-- 封面区域：点击控制播放/暂停 -->
				<div
					class="cover-container relative w-12 h-12 rounded-full overflow-hidden cursor-pointer"
					on:click={togglePlay}
					on:keydown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							togglePlay();
						}
					}}
					role="button"
					tabindex="0"
					aria-label={isPlaying
						? i18n(Key.musicPlayerPause)
						: i18n(Key.musicPlayerPlay)}
				>
					<img
						src={getAssetPath(currentSong.cover)}
						alt={i18n(Key.musicPlayerCover)}
						class="w-full h-full object-cover transition-transform duration-300"
						class:spinning={isPlaying && !isLoading}
						class:animate-pulse={isLoading}
					/>
					<div
						class="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
					>
						{#if isLoading}
							<Icon
								icon="eos-icons:loading"
								class="text-white text-xl"
							/>
						{:else if isPlaying}
							<Icon
								icon="material-symbols:pause"
								class="text-white text-xl"
							/>
						{:else}
							<Icon
								icon="material-symbols:play-arrow"
								class="text-white text-xl"
							/>
						{/if}
					</div>
				</div>
				<!-- 歌曲信息区域：点击展开播放器 -->
				<div
					class="flex-1 min-w-0 cursor-pointer"
					on:click={toggleExpanded}
					on:keydown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							toggleExpanded();
						}
					}}
					role="button"
					tabindex="0"
					aria-label={i18n(Key.musicPlayerExpand)}
				>
					<div class="text-sm font-medium text-90 truncate">
						{currentSong.title}
					</div>
					<div class="text-xs text-50 truncate">
						{currentSong.artist}
					</div>
				</div>
				<div class="flex items-center gap-1">
					<button
						class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"
						on:click|stopPropagation={toggleHidden}
						title={i18n(Key.musicPlayerHide)}
					>
						<Icon
							icon="material-symbols:visibility-off"
							class="text-lg"
						/>
					</button>
					<button
						class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"
						on:click|stopPropagation={toggleExpanded}
					>
						<Icon
							icon="material-symbols:expand-less"
							class="text-lg"
						/>
					</button>
				</div>
			</div>
		</div>
		<!-- 展开状态的完整播放器（封面圆形） -->
		<div
			class="expanded-player card-base bg-(--float-panel-bg) shadow-xl rounded-2xl p-4 transition-all duration-500 ease-in-out"
			class:opacity-0={!isExpanded}
			class:scale-95={!isExpanded}
			class:pointer-events-none={!isExpanded}
		>
			<div class="flex items-center gap-4 mb-4">
				<div
					class="cover-container relative w-16 h-16 rounded-full overflow-hidden shrink-0"
				>
					<img
						src={getAssetPath(currentSong.cover)}
						alt={i18n(Key.musicPlayerCover)}
						class="w-full h-full object-cover transition-transform duration-300"
						class:spinning={isPlaying && !isLoading}
						class:animate-pulse={isLoading}
					/>
				</div>
				<div class="flex-1 min-w-0">
					<div
						class="song-title text-lg font-bold text-90 truncate mb-1"
					>
						{currentSong.title}
					</div>
					<div class="song-artist text-sm text-50 truncate">
						{currentSong.artist}
					</div>
					<div class="text-xs text-30 mt-1">
						{formatTime(currentTime)} / {formatTime(duration)}
					</div>
				</div>
				<div class="flex items-center gap-1">
					<button
						class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"
						on:click={toggleHidden}
						title={i18n(Key.musicPlayerHide)}
					>
						<Icon
							icon="material-symbols:visibility-off"
							class="text-lg"
						/>
					</button>
					<button
						class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"
						class:text-[var(--primary)]={showPlaylist}
						on:click={togglePlaylist}
						title={i18n(Key.musicPlayerPlaylist)}
					>
						<Icon
							icon="material-symbols:queue-music"
							class="text-lg"
						/>
					</button>
				</div>
			</div>
			<div class="progress-section mb-4">
				<div
					class="progress-bar flex-1 h-2 bg-(--btn-regular-bg) rounded-full cursor-pointer"
					bind:this={progressBar}
					on:click={setProgress}
					on:keydown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							const percent = 0.5;
							const newTime = percent * duration;
							if (audio) {
								audio.currentTime = newTime;
								currentTime = newTime;
							}
						}
					}}
					role="slider"
					tabindex="0"
					aria-label={i18n(Key.musicPlayerProgress)}
					aria-valuemin="0"
					aria-valuemax="100"
					aria-valuenow={duration > 0
						? (currentTime / duration) * 100
						: 0}
				>
					<div
						class="h-full bg-(--primary) rounded-full transition-all duration-100"
						style="width: {duration > 0
							? (currentTime / duration) * 100
							: 0}%"
					></div>
				</div>
			</div>
			<div class="controls flex items-center justify-center gap-2 mb-4">
				<button
					class="w-10 h-10 rounded-lg"
					class:btn-regular={isShuffled}
					class:btn-plain={!isShuffled}
					on:click={toggleShuffle}
					disabled={playlist.length <= 1}
				>
					<Icon icon="material-symbols:shuffle" class="text-lg" />
				</button>
				<button
					class="btn-plain w-10 h-10 rounded-lg"
					on:click={previousSong}
					disabled={playlist.length <= 1}
				>
					<Icon
						icon="material-symbols:skip-previous"
						class="text-xl"
					/>
				</button>
				<button
					class="btn-regular w-12 h-12 rounded-full"
					class:opacity-50={isLoading}
					disabled={isLoading}
					on:click={togglePlay}
				>
					{#if isLoading}
						<Icon icon="eos-icons:loading" class="text-xl" />
					{:else if isPlaying}
						<Icon icon="material-symbols:pause" class="text-xl" />
					{:else}
						<Icon
							icon="material-symbols:play-arrow"
							class="text-xl"
						/>
					{/if}
				</button>
				<button
					class="btn-plain w-10 h-10 rounded-lg"
					on:click={() => nextSong()}
					disabled={playlist.length <= 1}
				>
					<Icon icon="material-symbols:skip-next" class="text-xl" />
				</button>
				<button
					class="w-10 h-10 rounded-lg"
					class:btn-regular={isRepeating > 0}
					class:btn-plain={isRepeating === 0}
					on:click={toggleRepeat}
				>
					{#if isRepeating === 1}
						<Icon
							icon="material-symbols:repeat-one"
							class="text-lg"
						/>
					{:else if isRepeating === 2}
						<Icon icon="material-symbols:repeat" class="text-lg" />
					{:else}
						<Icon
							icon="material-symbols:repeat"
							class="text-lg opacity-50"
						/>
					{/if}
				</button>
			</div>
			<div class="bottom-controls flex items-center gap-2">
				<button
					class="btn-plain w-8 h-8 rounded-lg"
					on:click={toggleMute}
				>
					{#if isMuted || volume === 0}
						<Icon
							icon="material-symbols:volume-off"
							class="text-lg"
						/>
					{:else if volume < 0.5}
						<Icon
							icon="material-symbols:volume-down"
							class="text-lg"
						/>
					{:else}
						<Icon
							icon="material-symbols:volume-up"
							class="text-lg"
						/>
					{/if}
				</button>
				<div
					class="flex-1 h-2 bg-(--btn-regular-bg) rounded-full cursor-pointer touch-none"
					bind:this={volumeBar}
					on:pointerdown={startVolumeDrag}
					on:keydown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							if (e.key === "Enter") toggleMute();
						}
					}}
					role="slider"
					tabindex="0"
					aria-label={i18n(Key.musicPlayerVolume)}
					aria-valuemin="0"
					aria-valuemax="100"
					aria-valuenow={volume * 100}
				>
					<div
						class="h-full bg-(--primary) rounded-full transition-all"
						class:duration-100={!isVolumeDragging}
						class:duration-0={isVolumeDragging}
						style="width: {volume * 100}%"
					></div>
				</div>
				<button
					class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"
					on:click={toggleExpanded}
					title={i18n(Key.musicPlayerCollapse)}
				>
					<Icon icon="material-symbols:expand-more" class="text-lg" />
				</button>
			</div>
		</div>
		{#if showPlaylist}
			<div
				class="playlist-panel float-panel fixed bottom-20 right-4 w-80 max-h-96 overflow-hidden z-50"
				transition:slide={{ duration: 300, axis: "y" }}
			>
				<div
					class="playlist-header flex items-center justify-between p-4 border-b border-(--line-divider)"
				>
					<h3 class="text-lg font-semibold text-90">
						{i18n(Key.musicPlayerPlaylist)}
					</h3>
					<button
						class="btn-plain w-8 h-8 rounded-lg"
						on:click={togglePlaylist}
					>
						<Icon icon="material-symbols:close" class="text-lg" />
					</button>
				</div>
				<div
					class="playlist-content overflow-y-auto max-h-80 hide-scrollbar"
				>
					{#each playlist as song, index}
						<div
							class="playlist-item flex items-center gap-3 p-3 hover:bg-(--btn-plain-bg-hover) cursor-pointer transition-colors"
							class:bg-[var(--btn-plain-bg)]={index ===
								currentIndex}
							class:text-[var(--primary)]={index === currentIndex}
							on:click={() => playSong(index)}
							on:keydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									playSong(index);
								}
							}}
							role="button"
							tabindex="0"
							aria-label="播放 {song.title} - {song.artist}"
						>
							<div
								class="w-6 h-6 flex items-center justify-center"
							>
								{#if index === currentIndex && isPlaying}
									<Icon
										icon="material-symbols:graphic-eq"
										class="text-(--primary) animate-pulse"
									/>
								{:else if index === currentIndex}
									<Icon
										icon="material-symbols:pause"
										class="text-(--primary)"
									/>
								{:else}
									<span class="text-sm text-(--content-meta)"
										>{index + 1}</span
									>
								{/if}
							</div>
							<div
								class="w-10 h-10 rounded-lg overflow-hidden bg-(--btn-regular-bg) shrink-0"
							>
								<img
									src={getAssetPath(song.cover)}
									alt={song.title}
									loading="lazy"
									class="w-full h-full object-cover"
								/>
							</div>
							<div class="flex-1 min-w-0">
								<div
									class="font-medium truncate"
									class:text-[var(--primary)]={index ===
										currentIndex}
									class:text-90={index !== currentIndex}
								>
									{song.title}
								</div>
								<div
									class="text-sm text-(--content-meta) truncate"
									class:text-[var(--primary)]={index ===
										currentIndex}
								>
									{song.artist}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<style>
		.orb-player {
			position: relative;
			backdrop-filter: blur(10px);
			-webkit-backdrop-filter: blur(10px);
		}
		.orb-player::before {
			content: "";
			position: absolute;
			inset: -0.125rem;
			background: linear-gradient(
				45deg,
				var(--primary),
				transparent,
				var(--primary)
			);
			border-radius: 50%;
			z-index: -1;
			opacity: 0;
			transition: opacity 0.3s ease;
		}
		.orb-player:hover::before {
			opacity: 0.3;
			animation: rotate 2s linear infinite;
		}
		.orb-player .animate-pulse {
			animation: musicWave 1.5s ease-in-out infinite;
		}
		@keyframes rotate {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}
		@keyframes musicWave {
			0%,
			100% {
				transform: scaleY(0.5);
			}
			50% {
				transform: scaleY(1);
			}
		}
		.music-player.hidden-mode {
			width: 3rem;
			height: 3rem;
		}
		.music-player {
			max-width: 20rem;
			user-select: none;
		}
		.mini-player {
			width: 17.5rem;
			position: absolute;
			bottom: 0;
			right: 0;
			/*left: 0;*/
		}
		.expanded-player {
			width: 20rem;
			position: absolute;
			bottom: 0;
			right: 0;
		}

		.animate-pulse {
			animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
		}
		@keyframes pulse {
			0%,
			100% {
				opacity: 1;
			}
			50% {
				opacity: 0.5;
			}
		}
		.progress-section div:hover,
		.bottom-controls > div:hover {
			transform: scaleY(1.2);
			transition: transform 0.2s ease;
		}
		@media (max-width: 768px) {
			.music-player {
				max-width: 280px !important;
				/*left: 0.5rem !important;*/
				bottom: 0.5rem !important;
				right: 0.5rem !important;
			}
			.mini-player {
				width: 280px;
			}
			.music-player.expanded {
				width: calc(100vw - 16px);
				max-width: none;
				/*left: 0.5rem !important;*/
				right: 0.5rem !important;
			}
			.playlist-panel {
				width: calc(100vw - 16px) !important;
				/*left: 0.5rem !important;*/
				right: 0.5rem !important;
				max-width: none;
			}
			.controls {
				gap: 8px;
			}
			.controls button {
				width: 36px;
				height: 36px;
			}
			.controls button:nth-child(3) {
				width: 44px;
				height: 44px;
			}
		}
		@media (max-width: 480px) {
			.music-player {
				max-width: 260px;
			}
			.song-title {
				font-size: 14px;
			}
			.song-artist {
				font-size: 12px;
			}
			.controls {
				gap: 6px;
				margin-bottom: 12px;
			}
			.controls button {
				width: 32px;
				height: 32px;
			}
			.controls button:nth-child(3) {
				width: 40px;
				height: 40px;
			}
			.playlist-item {
				padding: 8px 12px;
			}
			.playlist-item .w-10 {
				width: 32px;
				height: 32px;
			}
		}
		@keyframes slide-up {
			from {
				transform: translateY(100%);
				opacity: 0;
			}
			to {
				transform: translateY(0);
				opacity: 1;
			}
		}
		.animate-slide-up {
			animation: slide-up 0.3s ease-out;
		}
		@media (hover: none) and (pointer: coarse) {
			.music-player button,
			.playlist-item {
				min-height: 44px;
			}
			.progress-section > div,
			.bottom-controls > div:nth-child(2) {
				height: 12px;
			}
		}
		/* 自定义旋转动画，停止时保持当前位置 */
		@keyframes spin-continuous {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}

		.cover-container img {
			animation: spin-continuous 3s linear infinite;
			animation-play-state: paused;
		}

		.cover-container img.spinning {
			animation-play-state: running;
		}

		/* 让主题色按钮更有视觉反馈 */
		button.bg-\[var\(--primary\)\] {
			box-shadow: 0 0 0 2px var(--primary);
			border: none;
		}
	</style>
{/if}

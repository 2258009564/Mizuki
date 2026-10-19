import type { MusicPlayerConfig } from "../types/config";

// 音乐播放器配置
export const musicPlayerConfig: MusicPlayerConfig = {
	enable: true,
	showFloatingPlayer: true,
	floatingEntryMode: "fab",
	mode: "meting",
	meting_api:
		"https://meting.mysqil.com/api?server=:server&type=:type&id=:id&auth=:auth&r=:r",
	id: "17739906691",
	server: "netease",
	type: "playlist",
};

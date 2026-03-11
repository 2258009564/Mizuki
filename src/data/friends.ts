// 友情链接数据配置
// 用于管理友情链接页面的数据

export interface FriendItem {
	id: number;
	title: string;
	imgurl: string;
	desc: string;
	siteurl: string;
	tags: string[];
}

// 友情链接数据
export const friendsData: FriendItem[] = [
	{
		id: 1,
		title: "GitHub",
		imgurl: "https://avatars.githubusercontent.com/u/9919?v=4&s=640",
		desc: "Where the world builds software",
		siteurl: "https://github.com",
		tags: ["Development", "Platform"],
	},
	{
		id: 2,
		title: "我的个人图书馆(?",
		imgurl: "https://thirdqq.qlogo.cn/ek_qqapp/AQJeM5LFEiaYWuE6KvTZvBb7MIhmWAIxIkhU3Ck3oo3WtnpDfGIBKu6CJzNfFzjqSyECvPiaKeUHZ3YbFTGsVk9mBLiaBJGoVyQzUOkmWNW33IUy6FTGs0/0",
		desc: "存了一堆没有分类没有维护的md",
		siteurl: "https://2258009564.github.io/",
		tags: ["Docs", "Reference"],
	},
	{
		id: 3,
		title: "imicola的猫咖",
		imgurl: "https://imicola.com/_astro/nona_cut.D2OfEpoP_Z1NkkW9.webp",
		desc: "一个天才",
		siteurl: "https://imicola.com",
		tags: ["Docs", "Reference"],
	},
];

// 获取所有友情链接数据
export function getFriendsList(): FriendItem[] {
	return friendsData;
}

// 获取随机排序的友情链接数据
export function getShuffledFriendsList(): FriendItem[] {
	const shuffled = [...friendsData];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

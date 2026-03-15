// 日记数据配置
// 用于管理日记页面的数据

export interface DiaryItem {
	id: number;
	content: string;
	date: string;
	images?: string[];
	location?: string;
	mood?: string;
	tags?: string[];
}

// 示例日记数据
const diaryData: DiaryItem[] = [
	{
		id: 1,
		content:
			"超时空辉夜姬真好看！好吧也没那么好看，看了七八集，怎么讲的是一样的东西。",
		date: "2026-03-12T16:20:00Z",
		images: ["/images/diary/pc6.jpg"],
	},
	{
		id: 2,
		content:
			"打了一下午羽毛球，感觉不运动一下人要腐烂了。虽然水平下降的很严重，但总体是开心的，大概吧。",
		date: "2026-03-13T20:18:21Z",
		images: [
			"/images/diary/51eeafee168445c8616f6eb489f6c00e.jpg",
			"/images/diary/f164495ed0ecaf5a8cf0f7f815f94f13.jpg",
		],
	},
	{
		id: 3,
		content:
			"今天写了一下午划词翻译，结果发现好像是在手造轮子，心累。不过本身是为了满足个人需求，看到确实有朋友需要，我还是很开心的。",
		date: "2026-03-15T22:41:38Z",
		images: [
			"/images/diary/image.png",
		],
	},
];

// 获取日记统计数据
export const getDiaryStats = () => {
	const total = diaryData.length;
	const hasImages = diaryData.filter(
		(item) => item.images && item.images.length > 0,
	).length;
	const hasLocation = diaryData.filter((item) => item.location).length;
	const hasMood = diaryData.filter((item) => item.mood).length;

	return {
		total,
		hasImages,
		hasLocation,
		hasMood,
		imagePercentage: Math.round((hasImages / total) * 100),
		locationPercentage: Math.round((hasLocation / total) * 100),
		moodPercentage: Math.round((hasMood / total) * 100),
	};
};

// 获取日记列表（按时间倒序）
export const getDiaryList = (limit?: number) => {
	const sortedData = diaryData.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);

	if (limit && limit > 0) {
		return sortedData.slice(0, limit);
	}

	return sortedData;
};

// 获取最新的日记
export const getLatestDiary = () => {
	return getDiaryList(1)[0];
};

// 根据ID获取日记
export const getDiaryById = (id: number) => {
	return diaryData.find((item) => item.id === id);
};

// 获取包含图片的日记
export const getDiaryWithImages = () => {
	return diaryData.filter((item) => item.images && item.images.length > 0);
};

// 根据标签筛选日记
export const getDiaryByTag = (tag: string) => {
	return diaryData
		.filter((item) => item.tags?.includes(tag))
		.sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		);
};

// 获取所有标签
export const getAllTags = () => {
	const tags = new Set<string>();
	diaryData.forEach((item) => {
		if (item.tags) {
			item.tags.forEach((tag) => tags.add(tag));
		}
	});
	return Array.from(tags).sort();
};

export default diaryData;

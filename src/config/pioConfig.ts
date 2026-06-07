import type { PioConfig } from "../types/config";

// Pio 看板娘配置
export const pioConfig: PioConfig = {
	enable: true,
	models: ["/pio/UG/ugofficial.model3.json"],
	position: "left",
	width: 280,
	height: 250,
	mode: "draggable",
	hiddenOnMobile: true,
	hideAboutMenu: false,
	dialog: {
		welcome: "欢迎来访喵~",
		touch: [
			"过去和便宜的书一样。读完了就可以丢掉。",
			"你将遇到的不幸、是你所蹉跎时间的报应。",
			"不可以为了悲伤而摧残自己。死人已死。人生是为了活着的人而存在的。",
			"『现在你必从这地受咒诅你必流离飘荡在地上』神对犯了罪的该隐这么说。………『于是该隐离开耶和华的面去住在伊甸东边挪得之地该隐与妻子同房』………完全没有在流离飘荡。…怎样都好、别再朗诵圣经了。…？",
			"还活着时胡思乱想、烦恼死後的事简直无聊至极。为了能含笑九泉而活吧。",
			"生命的价值、和金钱一样、是会随着时代而改变的。 也会随地点而改变吧、果然。",
			"我觉得、如果有来生的话、我想当一只猫。…虽然也不错、但我觉得当个人更好。",
			"谁试图窥探我人生的几分之几？不如说，谁会窥探呢？",
		],
		home: "摸这里回到首页~",
		skin: ["Want to see my new outfit?", "The new outfit looks great~"],
		close: "QWQ See u nxt time~",
		link: "https://github.com/2258009564",
	},
};

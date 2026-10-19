/** Site-owned Live2D settings migrated from the original blog. */
export interface PioConfig {
	enable: boolean;
	models: string[];
	position: "left" | "right";
	width: number;
	height: number;
	mode: "draggable" | "static" | "fixed";
	hiddenOnMobile: boolean;
	hideAboutMenu: boolean;
	actionLabels: Record<
		"home" | "skin" | "info" | "close" | "show" | "model",
		string
	>;
	dialog: {
		welcome: string;
		touch: string[];
		home: string;
		skin: string[];
		close: string;
		link: string;
	};
}

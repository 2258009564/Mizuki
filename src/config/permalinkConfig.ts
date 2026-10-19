import type { PermalinkConfig } from "../types/permalinkConfig.ts";
import { withUserConfig } from "../utils/config-overlay.ts";

/**
 * Permalink 固定链接配置
 * 控制文章 URL 路由与生成模板
 */
export const permalinkConfig: PermalinkConfig = withUserConfig("permalink", {
	enable: false,
	format: "%postname%",
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const animePagePath = new URL("../src/pages/anime.astro", import.meta.url);
const animeCardPath = new URL(
	"../src/components/features/anime/AnimeCard.astro",
	import.meta.url,
);
const animeDataPath = new URL("../src/utils/anime-data.ts", import.meta.url);
const bangumiUpdaterPath = new URL(
	"../scripts/update-bangumi.mjs",
	import.meta.url,
);
const animeUpdaterPath = new URL(
	"../scripts/update-anime.mjs",
	import.meta.url,
);

describe("anime interaction wiring", () => {
	it("reads the selected status before applying the filter", async () => {
		const source = await readFile(animePagePath, "utf8");

		assert.match(
			source,
			/const selectedStatus\s*=\s*this\.getAttribute\("data-status"\)/,
		);
	});

	it("renders all metadata required by the sort controls", async () => {
		const source = await readFile(animeCardPath, "utf8");

		for (const attribute of [
			"data-anime-index",
			"data-anime-year",
			"data-anime-rating",
			"data-anime-title",
		]) {
			assert.match(source, new RegExp(attribute));
		}
	});

	it("connects development loading to the site configuration", async () => {
		const source = await readFile(animeDataPath, "utf8");

		assert.match(source, /siteConfig\.bangumi\?\.fetchOnDev/);
		assert.match(source, /siteConfig\.bilibili\?\.fetchOnDev/);
	});

	it("retries API failures and writes generated data atomically", async () => {
		const source = await readFile(bangumiUpdaterPath, "utf8");

		assert.match(source, /MAX_REQUEST_ATTEMPTS = 3/);
		assert.match(source, /throw e;/);
		assert.match(source, /fs\.rename\(temporaryFile, OUTPUT_FILE\)/);
	});

	it("enables Node proxy support when the runtime provides it", async () => {
		const source = await readFile(animeUpdaterPath, "utf8");

		assert.match(
			source,
			/allowedNodeEnvironmentFlags\.has\("--use-env-proxy"\)/,
		);
	});
});

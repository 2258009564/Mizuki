import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchBangumiData } from "../scripts/anime/providers/bangumi.mjs";

const config = {
	userId: "test-user",
	request: { pageSize: 10, maxItems: 12, minDelayMs: 1 },
};
const json = (data, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
const entry = (id) => ({
	subject_id: id,
	ep_status: 2,
	subject: { name_cn: `Anime ${id}`, eps: 12 },
});

test("Bangumi paginates and retains all five collection statuses", async (t) => {
	const calls = [];
	t.mock.method(globalThis, "fetch", async (url) => {
		const parsed = new URL(url);
		if (parsed.pathname.startsWith("/v0/subjects/")) return json({});
		const type = Number(parsed.searchParams.get("type"));
		const offset = Number(parsed.searchParams.get("offset"));
		calls.push([type, offset]);
		const total = type === 3 ? 12 : 1;
		const count = Math.min(
			total - offset,
			Number(parsed.searchParams.get("limit")),
		);
		return json({
			total,
			data: Array.from({ length: count }, (_, i) =>
				entry(type * 100 + offset + i),
			),
		});
	});
	const result = await fetchBangumiData(config);
	assert.equal(result.rawItems.length, 16);
	assert.deepEqual(calls, [
		[3, 0],
		[3, 10],
		[2, 0],
		[1, 0],
		[4, 0],
		[5, 0],
	]);
	assert.deepEqual(
		[...new Set(result.rawItems.map((item) => item.status))],
		["watching", "completed", "planned", "onHold", "dropped"],
	);
	assert.deepEqual(result.rawItems[0].progress, { watched: 2, total: 12 });
});

test("Bangumi accepts genuinely empty collections", async (t) => {
	t.mock.method(globalThis, "fetch", async () => json({ total: 0, data: [] }));
	assert.deepEqual((await fetchBangumiData(config)).rawItems, []);
});

for (const [name, response] of [
	["HTTP failure", () => json({}, 503)],
	["missing user", () => json({}, 404)],
	["invalid response", () => json({ total: 12 })],
	["truncated pagination", () => json({ total: 12, data: [] })],
	["short page", () => json({ total: 12, data: [entry(11)] })],
	[
		"network failure",
		() => {
			throw new Error("offline");
		},
	],
]) {
	test(`Bangumi rejects ${name} after a successful page instead of publishing partial data`, async (t) => {
		let calls = 0;
		t.mock.method(globalThis, "fetch", async () => {
			calls++;
			if (calls === 1)
				return json({
					total: 12,
					data: Array.from({ length: 10 }, (_, i) => entry(i + 1)),
				});
			return response();
		});
		await assert.rejects(fetchBangumiData(config), /\[Bangumi\].*(offset 10)/);
		assert.equal(calls, 2);
	});
}

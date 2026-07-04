// One-off: convert the ESM "工程扩展" 五班阿 into a classic single-file extension.js
// that any standard 无名杀 (电脑/安卓) can import via game.import('extension', fn).
import fs from "node:fs";
import path from "node:path";

const EXT_DIR = path.resolve("apps/core/extension/wubana");
const PARTS_DIR = path.join(EXT_DIR, "parts");
const OUT_DIR = path.resolve("dist-wba-classic");
const OUT_FILE = path.join(OUT_DIR, "extension.js");

const info = JSON.parse(fs.readFileSync(path.join(EXT_DIR, "info.json"), "utf8"));

const N = 6;
const bodies = [];
for (let i = 1; i <= N; i++) {
	let src = fs.readFileSync(path.join(PARTS_DIR, `group${i}.js`), "utf8");
	// drop the ESM import from "noname" (lib/game/... become wrapper params)
	src = src.replace(/^\s*import\s*\{[^}]*\}\s*from\s*["']noname["'];?[ \t]*\r?\n/m, "");
	// rename the three named exports to per-group locals (verbatim bodies preserved)
	src = src.replace(/^export const character =/m, `const character_${i} =`);
	src = src.replace(/^export const skill =/m, `const skill_${i} =`);
	src = src.replace(/^export const translate =/m, `const translate_${i} =`);
	bodies.push(`\t// ===== group${i} =====\n` + src.trim());
}

const merge = (base) => `Object.assign({}, ${Array.from({ length: N }, (_, k) => `${base}_${k + 1}`).join(", ")})`;

const intro = (info.intro || "").replace(/`/g, "\\`");

const out = `"use strict";
// 五班阿 — 经典单文件扩展（由工程扩展自动转换，请勿手动编辑，改动请回到 parts/ 源码后重新生成）
game.import("extension", function (lib, game, ui, get, ai, _status) {
${bodies.join("\n\n")}

	// ===== 合并各分组 =====
	const character = ${merge("character")};
	const skill = ${merge("skill")};
	const translateAll = ${merge("translate")};

	// 拆分翻译：武将名归 character.translate，其余（技能名/描述等）归 skill.translate
	const _charKeys = new Set(Object.keys(character));
	const characterTranslate = {};
	const skillTranslate = {};
	for (const _k in translateAll) {
		if (_charKeys.has(_k)) characterTranslate[_k] = translateAll[_k];
		else skillTranslate[_k] = translateAll[_k];
	}

	return {
		name: ${JSON.stringify(info.name)},
		editable: false,
		connect: true,
		content: function (config, pack) {},
		precontent: function () {},
		config: {},
		help: {},
		package: {
			character: {
				character: character,
				translate: characterTranslate,
				connect: true,
			},
			skill: {
				skill: skill,
				translate: skillTranslate,
			},
			intro: \`${intro}\`,
			author: ${JSON.stringify(info.author || "未知")},
			diskURL: ${JSON.stringify(info.diskURL || "")},
			forumURL: ${JSON.stringify(info.forumURL || "")},
			version: ${JSON.stringify(info.version || "1.0")},
		},
		files: { character: [], card: [], skill: [], audio: [] },
	};
});
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, out, "utf8");
console.log("written:", OUT_FILE, `(${out.length} bytes)`);

// ---- validate: eval with permissive mocks, capture the returned package ----
const makeProxy = () =>
	new Proxy(function () {}, {
		get: (_t, p) => (p === Symbol.toPrimitive ? () => "" : makeProxy()),
		apply: () => makeProxy(),
		construct: () => makeProxy(),
	});
let captured = null;
const gameMock = {
	import: (_type, fn) => {
		captured = fn(makeProxy(), gameMock, makeProxy(), makeProxy(), makeProxy(), makeProxy());
	},
};
try {
	const run = new Function("game", "lib", "ui", "get", "ai", "_status", out);
	run(gameMock, makeProxy(), makeProxy(), makeProxy(), makeProxy(), makeProxy());
	const chars = Object.keys(captured.package.character.character);
	const skills = Object.keys(captured.package.skill.skill);
	const cTr = Object.keys(captured.package.character.translate);
	const sTr = Object.keys(captured.package.skill.translate);
	console.log("OK  name        :", captured.name);
	console.log("OK  characters  :", chars.length);
	console.log("OK  skills      :", skills.length);
	console.log("OK  char transl :", cTr.length);
	console.log("OK  skill transl:", sTr.length);
	const missingName = chars.filter((c) => !captured.package.character.translate[c]);
	if (missingName.length) console.log("WARN characters without name translate:", missingName);
} catch (e) {
	console.error("VALIDATION FAILED:", e);
	process.exit(1);
}

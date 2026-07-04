import { lib, game, ui, get, ai, _status } from "noname";
import * as group1 from "./parts/group1.js";
import * as group2 from "./parts/group2.js";
import * as group3 from "./parts/group3.js";
import * as group4 from "./parts/group4.js";
import * as group5 from "./parts/group5.js";
import * as group6 from "./parts/group6.js";

const groups = [group1, group2, group3, group4, group5, group6];

// 合并各分组导出的武将、技能与翻译
const character = Object.assign({}, ...groups.map(g => g.character));
const skill = Object.assign({}, ...groups.map(g => g.skill));
const translate = Object.assign({}, ...groups.map(g => g.translate));

export const type = "extension";

export default function () {
	return {
		name: "五班阿",
		editable: false,
		connect: true,
		content() {},
		precontent() {},
		config: {},
		help: {},
		package: {
			character: {
				character,
				skill,
				translate,
				connect: true,
			},
			intro: "五班同学主题DIY武将扩展，包含sp、神、球队/乐队及原版共42名武将。",
			author: "五班",
			diskURL: "",
			forumURL: "",
			version: "1.0",
		},
		files: { character: [], card: [], skill: [], audio: [] },
	};
}

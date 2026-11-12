// Launch Readiness Checklist: saves answers in this browser, scores them,
// and builds a summary the visitor can send to their manager or IT team.
(() => {
	const root = document.querySelector("[data-launch-checklist]");
	if (!root) return;

	const STORAGE_KEY = "launch-checklist:v1";
	const PROFILE_KEY = "launch-checklist:profile";
	const LEVELS = ["green", "yellow", "red", "unsure"];
	const REVIEW_URL = "https://adamwills.dev/launch-checklist/#review";

	const read = (key) => {
		try {
			return JSON.parse(localStorage.getItem(key)) || {};
		} catch {
			return {};
		}
	};
	const write = (key, value) => {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch {
			// Storage unavailable (private mode, blocked). The page still works, it just won't remember.
		}
	};

	const state = Object.assign({ answers: {}, notes: {}, fields: {}, summaryEdited: false }, read(STORAGE_KEY));
	const save = () => write(STORAGE_KEY, state);

	const items = [...root.querySelectorAll("[data-item]")].map((el) => ({
		el,
		id: el.dataset.item,
		title: el.dataset.title,
		critical: el.hasAttribute("data-critical"),
	}));
	const total = items.length;

	const summaryEl = root.querySelector("[data-summary]");
	const regenerateBtn = root.querySelector("[data-regenerate]");
	const resultsField = root.querySelector("[data-results-field]");
	const includeResults = root.querySelector("[data-include-results]");

	// Restore saved answers and notes.
	for (const item of items) {
		const answer = state.answers[item.id];
		if (answer) {
			const input = item.el.querySelector(`input[value="${answer}"]`);
			if (input) input.checked = true;
		}
		const note = item.el.querySelector("[data-note]");
		if (note && state.notes[item.id]) note.value = state.notes[item.id];
	}

	// Prefill the summary and review form from the signup form, when we have it.
	const profile = read(PROFILE_KEY);
	if (!state.fields.sender && profile.name) state.fields.sender = profile.name;
	for (const [selector, value] of [["#lr-name", profile.name], ["#lr-email", profile.email], ["#lr-company", profile.company]]) {
		const input = root.querySelector(selector);
		if (input && value && !input.value) input.value = value;
	}

	root.querySelectorAll("[data-field]").forEach((input) => {
		const key = input.dataset.field;
		if (input.type === "checkbox") {
			if (key in state.fields) input.checked = state.fields[key];
		} else if (state.fields[key]) {
			input.value = state.fields[key];
		}
	});

	const tally = () => {
		const counts = { green: 0, yellow: 0, red: 0, unsure: 0 };
		const byLevel = { green: [], yellow: [], red: [], unsure: [] };
		for (const item of items) {
			const level = state.answers[item.id];
			if (LEVELS.includes(level)) {
				counts[level]++;
				byLevel[level].push(item);
			}
		}
		const answered = counts.green + counts.yellow + counts.red + counts.unsure;
		const criticalRed = byLevel.red.filter((item) => item.critical);
		return { counts, byLevel, answered, criticalRed };
	};

	const verdictFor = ({ counts, answered, criticalRed }) => {
		if (answered === 0) {
			return { tone: "none", title: "Work through the checks above to see your result.", text: "" };
		}
		const partial = answered < total ? ` (Based on ${answered} of ${total} checks so far.)` : "";
		if (criticalRed.length) {
			return {
				tone: "red",
				title: "Not ready for wider use yet",
				text: `At least one essential check came back red. That doesn't mean the app is a write-off, it means rolling it out further right now puts company or customer data at risk. Get the red items looked at first.${partial}`,
			};
		}
		if (counts.red) {
			return {
				tone: "red",
				title: "Needs work before a wider rollout",
				text: `Nothing essential came back red, but there are real gaps to close before more people depend on this.${partial}`,
			};
		}
		if (counts.yellow + counts.unsure >= 4) {
			return {
				tone: "yellow",
				title: "Close, with some gaps to close",
				text: `No red flags, but enough yellows and unknowns that it's worth tightening things up, or getting a second opinion, before rolling it out further.${partial}`,
			};
		}
		if (counts.yellow + counts.unsure) {
			return {
				tone: "yellow",
				title: "In good shape, with a few loose ends",
				text: `Mostly green. Sort out the handful of yellow and not-sure items and you're likely in a good place.${partial}`,
			};
		}
		return {
			tone: "green",
			title: answered < total ? "Looking good so far" : "Looking good",
			text: answered < total
				? `Everything you've answered is green.${partial}`
				: "Everything came back green. That's genuinely uncommon. The main thing left is making sure IT and your manager know, and keeping it up to date.",
		};
	};

	const lineFor = (item) => {
		const note = (state.notes[item.id] || "").trim();
		return `- ${item.title}${note ? `\n  Notes: ${note.replace(/\n+/g, " ")}` : ""}`;
	};

	const buildSummary = (t, verdict) => {
		const { appName, recipient, sender, mentionReview = true } = state.fields;
		const app = (appName || "").trim() || "the app I built";
		const lines = [];
		lines.push(`Hi${recipient ? ` ${recipient.trim()}` : ""},`, "");
		lines.push(
			`I've been checking whether ${app} is ready to be used more widely, using a launch readiness checklist for tools built with AI. I went through ${t.answered} of ${total} checks covering sign-in and access, company data, backups and errors, hosting and costs, maintenance, and company approval.`,
			"",
		);
		lines.push(`Overall: ${verdict.title}.`);
		lines.push(`Results: ${t.counts.green} green, ${t.counts.yellow} yellow, ${t.counts.red} red, ${t.counts.unsure} not sure.`, "");

		const group = (heading, list) => {
			if (!list.length) return;
			lines.push(heading, ...list.map(lineFor), "");
		};
		group("Needs attention (red):", t.byLevel.red);
		group("Some gaps (yellow):", t.byLevel.yellow);
		group("Couldn't confirm (not sure):", t.byLevel.unsure);
		if (t.byLevel.green.length) {
			lines.push("Looking good:", ...t.byLevel.green.map((item) => `- ${item.title}`), "");
		}

		const needsWork = t.counts.red + t.counts.yellow + t.counts.unsure > 0;
		if (needsWork) {
			lines.push("Suggested next step: get the red and not-sure items looked at before we roll it out further.");
			if (mentionReview) {
				lines.push(
					"",
					`One option is a fixed-price Launch Readiness Review ($1,500 CAD) from Adam Wills Development, an independent developer: a review of the code and setup, with a written report on what's solid, what's risky, and what fixing it would cost. The fee is credited toward the work if we go ahead: ${REVIEW_URL}`,
				);
			}
		} else {
			lines.push("Suggested next step: let IT know it exists, and agree who looks after it if I'm away.");
		}
		lines.push("", "Happy to walk you through it.", "", sender ? sender.trim() : "");
		return lines.join("\n").trim() + "\n";
	};

	const buildResultsForReview = (t, verdict) => {
		const out = [`Overall: ${verdict.title}`, `Answered ${t.answered}/${total}: ${t.counts.green} green, ${t.counts.yellow} yellow, ${t.counts.red} red, ${t.counts.unsure} not sure`, ""];
		for (const item of items) {
			const level = state.answers[item.id] || "unanswered";
			const note = (state.notes[item.id] || "").trim();
			out.push(`[${level}] ${item.title}${note ? ` (${note.replace(/\n+/g, " ")})` : ""}`);
		}
		if (state.fields.appName) out.unshift(`App: ${state.fields.appName}`);
		return out.join("\n");
	};

	const verdictEl = root.querySelector("[data-verdict]");
	const toneClasses = {
		none: [],
		green: ["bg-green-50", "ring-green-200"],
		yellow: ["bg-amber-50", "ring-amber-200"],
		red: ["bg-brand-red-50", "ring-brand-red-200"],
	};

	const render = () => {
		const t = tally();
		const verdict = verdictFor(t);

		root.querySelector("[data-progress]").textContent = `${t.answered} of ${total} checks answered.`;
		for (const level of LEVELS) root.querySelector(`[data-count="${level}"]`).textContent = t.counts[level];
		root.querySelector("[data-verdict-title]").textContent = verdict.title;
		root.querySelector("[data-verdict-text]").textContent = verdict.text;
		verdictEl.classList.remove(...Object.values(toneClasses).flat());
		verdictEl.classList.add(...toneClasses[verdict.tone]);

		if (!state.summaryEdited) summaryEl.value = buildSummary(t, verdict);
		regenerateBtn.classList.toggle("hidden", !state.summaryEdited);

		resultsField.value = includeResults.checked ? buildResultsForReview(t, verdict) : "";
	};

	// Events
	root.addEventListener("change", (event) => {
		const target = event.target;
		const itemEl = target.closest("[data-item]");
		if (itemEl && target.type === "radio") {
			state.answers[itemEl.dataset.item] = target.value;
		} else if (target.dataset.field) {
			state.fields[target.dataset.field] = target.type === "checkbox" ? target.checked : target.value;
		}
		save();
		render();
	});

	root.addEventListener("input", (event) => {
		const target = event.target;
		if (target.dataset.note) {
			state.notes[target.dataset.note] = target.value;
		} else if (target.dataset.field && target.type !== "checkbox") {
			state.fields[target.dataset.field] = target.value;
		} else if (target === summaryEl) {
			state.summaryEdited = true;
			save();
			regenerateBtn.classList.remove("hidden");
			return;
		} else {
			return;
		}
		save();
		render();
	});

	regenerateBtn.addEventListener("click", () => {
		state.summaryEdited = false;
		save();
		render();
	});

	root.querySelector("[data-reset]").addEventListener("click", () => {
		if (!window.confirm("Clear all your answers and notes on this checklist?")) return;
		state.answers = {};
		state.notes = {};
		state.summaryEdited = false;
		save();
		root.querySelectorAll("[data-item] input[type=radio]").forEach((input) => (input.checked = false));
		root.querySelectorAll("[data-note]").forEach((input) => (input.value = ""));
		render();
	});

	// Copy buttons
	const copyText = async (text) => {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			const area = document.createElement("textarea");
			area.value = text;
			area.setAttribute("readonly", "");
			area.style.position = "fixed";
			area.style.opacity = "0";
			document.body.appendChild(area);
			area.select();
			const ok = document.execCommand("copy");
			area.remove();
			return ok;
		}
	};

	root.querySelectorAll("[data-copy-target]").forEach((button) => {
		const original = button.textContent;
		button.addEventListener("click", async () => {
			const target = document.getElementById(button.dataset.copyTarget);
			if (!target) return;
			const text = "value" in target && target.tagName !== "PRE" ? target.value : target.textContent;
			const ok = await copyText(text);
			button.textContent = ok ? "Copied" : "Press Ctrl+C";
			setTimeout(() => (button.textContent = original), 2000);
		});
	});

	render();
})();

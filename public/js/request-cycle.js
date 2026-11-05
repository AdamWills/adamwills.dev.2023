// Request cycle animation: WordPress vs static vs static + CMS.
(() => {
	const root = document.querySelector("[data-request-cycle]");
	if (!root || !root.animate) return;

	const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

	const move = (from, to, label, kind, extra = {}) => ({ t: "move", from, to, label, kind, ...extra });
	const work = (node, ms, status, kind, extra = {}) => ({ t: "work", node, ms, status, kind, ...extra });
	const REQUEST = "Request: Services";
	const ATTACK = "Malicious request";

	const SCENARIOS = {
		wp: {
			edges: [["visitor", "server"], ["bot", "server"], ["server", "db"]],
			groups: [
				{ text: "A visitor asks for a page.", acts: [move("visitor", "server", REQUEST)] },
				{ text: "The server starts up PHP, WordPress, the theme, and every active plugin.", acts: [work("server", 2600, "Loading WordPress…")] },
				{
					text: "WordPress asks the database for the page’s content, settings, and menus.",
					acts: [{ t: "queries", a: "server", b: "db", labels: ["Get settings", "Get content", "Get menus"] }],
				},
				{ text: "The theme assembles the page from scratch.", acts: [work("server", 1800, "Building the page…")] },
				{ text: "The finished page is sent back. The next visitor triggers all of this again.", acts: [move("server", "visitor", "Your page", "ok")] },
				{
					text: "Bots send requests too, and the server runs every one of them through PHP.",
					acts: [move("bot", "server", ATTACK, "threat"), work("server", 2000, "Running the bot’s input", "threat")],
				},
			],
		},
		static: {
			edges: [["visitor", "cdn"], ["bot", "cdn"]],
			groups: [
				{ text: "A visitor asks for a page.", acts: [move("visitor", "cdn", REQUEST)] },
				{ text: "A nearby server already has that page, finished and ready.", acts: [work("cdn", 1000, "Found it", "shield", { chip: "services" })] },
				{ text: "It sends the page straight back. No code runs, no database.", acts: [move("cdn", "visitor", "Your page", "ok")] },
				{ text: "A bot sends the same malicious request.", acts: [move("bot", "cdn", ATTACK, "threat")] },
				{
					text: "There’s nothing behind the files for it to attack, so it gets “not found” and moves on.",
					acts: [work("cdn", 1200, "Nothing to run", "shield"), move("cdn", "bot", "Not found", "muted")],
				},
			],
		},
		cms: {
			edges: [["editor", "cms"], ["cms", "build"], ["build", "cdn"], ["visitor", "cdn"], ["bot", "cdn"]],
			groups: [
				{ phase: "When you publish", text: "You edit a page in the CMS and hit publish.", acts: [move("editor", "cms", "Publish: Services")] },
				{ phase: "When you publish", text: "The CMS lets the build service know something changed.", acts: [move("cms", "build", "Content changed")] },
				{ phase: "When you publish", text: "The build turns every page into a finished file, once.", acts: [work("build", 2600, "Building pages…")] },
				{ phase: "When you publish", text: "The finished pages are copied out to the nearby servers.", acts: [move("build", "cdn", "New pages", "ok")] },
				{ phase: "On every visit", text: "Later, a visitor asks for a page.", acts: [move("visitor", "cdn", REQUEST)] },
				{
					phase: "On every visit",
					text: "The nearby server sends the finished page. The CMS isn’t involved at all.",
					acts: [work("cdn", 900, "Found it", "shield", { chip: "services" }), move("cdn", "visitor", "Your page", "ok")],
				},
				{
					phase: "On every visit",
					text: "Bots only reach the public files, not your CMS. There’s nothing there to attack.",
					acts: [move("bot", "cdn", ATTACK, "threat"), work("cdn", 1100, "Nothing to run", "shield"), move("cdn", "bot", "Not found", "muted")],
				},
			],
		},
	};

	const tabs = [...root.querySelectorAll("[data-tab]")];
	const panels = Object.fromEntries([...root.querySelectorAll("[data-panel]")].map((p) => [p.dataset.panel, p]));
	const progress = root.querySelector(".rc-progress");
	const caption = root.querySelector(".rc-caption");
	const countEl = root.querySelector(".rc-count");
	const phaseEl = root.querySelector(".rc-phase");
	const textEl = root.querySelector(".rc-text");
	const stepsList = root.querySelector("[data-steps]");
	const toggleBtn = root.querySelector("[data-toggle]");
	const prevBtn = root.querySelector("[data-prev]");
	const nextBtn = root.querySelector("[data-next]");
	const clock = document.createElement("span");
	clock.hidden = true;
	root.append(clock);

	let active = "wp";
	let run = null;
	let step = 0;
	let stepDone = false;
	let paused = false;
	let autoAdvance = true; // false once the viewer takes control or presses pause
	let userPaused = false;
	let visible = false;

	// --- Animation bookkeeping -------------------------------------------
	function track(r, anim) {
		r.anims.add(anim);
		const done = () => r.anims.delete(anim);
		anim.addEventListener("finish", done);
		anim.addEventListener("cancel", done);
		if (paused) anim.pause();
		return anim.finished;
	}
	const sleep = (r, ms) => track(r, clock.animate([{ opacity: 0 }, { opacity: 0 }], { duration: ms }));
	// Time to read a caption after its animation finishes.
	const dwell = (text) => Math.min(5500, Math.max(3000, 1800 + text.length * 30));

	// --- Geometry ----------------------------------------------------------
	const stageOf = (key) => panels[key].querySelector(".rc-stage");
	const nodeOf = (key, id) => panels[key].querySelector(`[data-node="${id}"]`);
	function center(key, id) {
		const s = stageOf(key).getBoundingClientRect();
		const n = nodeOf(key, id).getBoundingClientRect();
		return { x: n.left - s.left + n.width / 2, y: n.top - s.top + n.height / 2, w: n.width, h: n.height };
	}
	// Point where the line from A's center toward B leaves A's box (plus a gap).
	function edgePoint(A, B, gx = 6, gy = gx) {
		const dx = B.x - A.x;
		const dy = B.y - A.y;
		const t = Math.min(
			dx ? (A.w / 2 + gx) / Math.abs(dx) : Infinity,
			dy ? (A.h / 2 + gy) / Math.abs(dy) : Infinity
		);
		return { x: A.x + dx * Math.min(t, 0.5), y: A.y + dy * Math.min(t, 0.5) };
	}
	function drawEdges(key) {
		const svg = stageOf(key).querySelector(".rc-edges");
		const live = new Set([...svg.querySelectorAll(".is-live")].map((l) => l.dataset.edge));
		svg.innerHTML = "";
		for (const [a, b] of SCENARIOS[key].edges) {
			const A = center(key, a);
			const B = center(key, b);
			const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
			line.setAttribute("x1", A.x);
			line.setAttribute("y1", A.y);
			line.setAttribute("x2", B.x);
			line.setAttribute("y2", B.y);
			line.dataset.edge = `${a}|${b}`;
			if (live.has(line.dataset.edge)) line.classList.add("is-live");
			svg.append(line);
		}
	}
	const edgeOf = (key, a, b) =>
		stageOf(key).querySelector(`.rc-edges [data-edge="${a}|${b}"], .rc-edges [data-edge="${b}|${a}"]`);

	// --- Actions -----------------------------------------------------------
	async function doMove(r, key, act, quick = false) {
		const layer = stageOf(key).querySelector(".rc-layer");
		const cA = center(key, act.from);
		const cB = center(key, act.to);
		const edge = edgeOf(key, act.from, act.to);
		edge?.classList.add("is-live");
		edge?.classList.toggle("is-threat", act.kind === "threat");

		// The line draws itself from sender to receiver; the label sits still at its midpoint.
		const svgNS = "http://www.w3.org/2000/svg";
		const svg = stageOf(key).querySelector(".rc-edges");
		const kindClass = act.kind ? ` is-${act.kind}` : "";
		const A = edgePoint(cA, cB, 3);
		const B = edgePoint(cB, cA, 3);
		const len = Math.hypot(B.x - A.x, B.y - A.y);
		const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };

		const flow = document.createElementNS(svgNS, "line");
		flow.setAttribute("class", "rc-flow" + kindClass);
		flow.setAttribute("x1", A.x);
		flow.setAttribute("y1", A.y);
		flow.setAttribute("x2", B.x);
		flow.setAttribute("y2", B.y);
		flow.style.strokeDasharray = `${len}`;
		const head = document.createElementNS(svgNS, "circle");
		head.setAttribute("class", "rc-flow-head" + kindClass);
		head.setAttribute("r", "4.5");
		svg.append(flow, head);

		const p = document.createElement("span");
		p.className = "rc-packet" + kindClass;
		p.textContent = act.label;
		layer.append(p);
		const at = (pt, s = 1) => `translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%) scale(${s})`;
		const pos = (pt) => `translate(${pt.x}px, ${pt.y}px)`;

		const draw = reduce.matches ? 0 : quick ? 700 : 1200;
		const hold = reduce.matches ? (quick ? 1100 : 1700) : quick ? 700 : 1300;
		const fade = reduce.matches ? 0 : 250;
		const opts = (duration) => ({ duration, fill: "forwards", easing: "cubic-bezier(.6,0,.35,1)" });

		try {
			track(r, p.animate([{ transform: at(mid, 0.85), opacity: 0 }, { transform: at(mid, 1), opacity: 1 }], opts(fade || 1)));
			track(r, head.animate([{ transform: pos(A) }, { transform: pos(B) }], opts(draw || 1)));
			await track(r, flow.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], opts(draw || 1)));
			await sleep(r, hold);
			await Promise.all(
				[p, flow, head].map((el) => track(r, el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fade || 1, fill: "forwards" })))
			);
		} finally {
			p.remove();
			flow.remove();
			head.remove();
			edge?.classList.remove("is-live", "is-threat");
		}
		const target = nodeOf(key, act.to);
		target.classList.add("is-ping");
		setTimeout(() => target.classList.remove("is-ping"), 350);
	}

	async function doWork(r, key, act) {
		const n = nodeOf(key, act.node);
		const chips = n.querySelectorAll(".rc-chips:not(.is-files) .rc-chip");
		const hit = act.chip ? n.querySelector(`[data-chip="${act.chip}"]`) : null;
		n.style.setProperty("--chip-step", `${Math.round(act.ms / (chips.length + 1))}ms`);
		n.classList.add("is-busy");
		if (act.kind) n.classList.add(`is-${act.kind}`);
		hit?.classList.add("is-hit");
		n.querySelector(".rc-status").textContent = act.status || "";
		try {
			const bar = n.querySelector(".rc-bar");
			await track(
				r,
				bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
					duration: reduce.matches ? Math.max(act.ms, 1600) : act.ms,
				})
			);
		} finally {
			n.classList.remove("is-busy", "is-threat", "is-shield");
			hit?.classList.remove("is-hit");
			n.querySelector(".rc-status").textContent = "";
		}
	}

	async function doQueries(r, key, act) {
		const db = nodeOf(key, act.b);
		db.classList.add("is-query");
		db.querySelector(".rc-status").textContent = "Looking things up…";
		try {
			for (const label of act.labels) {
				await doMove(r, key, { from: act.a, to: act.b, label, kind: "query" }, true);
				await doMove(r, key, { from: act.b, to: act.a, label: "Here you go", kind: "query" }, true);
			}
		} finally {
			db.classList.remove("is-query");
			db.querySelector(".rc-status").textContent = "";
		}
	}

	function doAct(r, key, act) {
		if (act.t === "move") return doMove(r, key, act);
		if (act.t === "work") return doWork(r, key, act);
		if (act.t === "queries") return doQueries(r, key, act);
		return Promise.resolve();
	}

	// --- Caption, progress, and screen reader steps ---------------------------
	function buildMeta(key) {
		const groups = SCENARIOS[key].groups;
		progress.innerHTML = "";
		stepsList.innerHTML = "";
		groups.forEach((g, i) => {
			const b = document.createElement("button");
			b.type = "button";
			b.className = "rc-seg";
			b.setAttribute("aria-label", `Step ${i + 1}: ${g.text}`);
			b.addEventListener("click", () => takeControl(i));
			progress.append(b);
			const li = document.createElement("li");
			li.textContent = (g.phase ? `${g.phase}: ` : "") + g.text;
			stepsList.append(li);
		});
	}
	function setStep(key, i) {
		const groups = SCENARIOS[key].groups;
		[...progress.children].forEach((s, j) => {
			s.classList.toggle("is-done", j < i);
			s.classList.toggle("is-active", j === i);
			if (j === i) s.setAttribute("aria-current", "step");
			else s.removeAttribute("aria-current");
		});
		countEl.textContent = `Step ${i + 1} of ${groups.length}`;
		phaseEl.textContent = groups[i].phase || "";
		textEl.textContent = groups[i].text;
		textEl.classList.remove("is-in");
		void textEl.offsetWidth;
		textEl.classList.add("is-in");
	}
	function resetStage(key) {
		const panel = panels[key];
		panel.querySelectorAll(".rc-layer").forEach((l) => (l.innerHTML = ""));
		panel.querySelectorAll(".rc-node").forEach((n) => {
			n.classList.remove("is-busy", "is-threat", "is-shield", "is-query", "is-ping");
			n.querySelector(".rc-status").textContent = "";
		});
		panel.querySelectorAll(".rc-chip.is-hit").forEach((c) => c.classList.remove("is-hit"));
	}

	// --- Playing one step at a time ------------------------------------------
	function stop() {
		if (!run) return;
		run.dead = true;
		[...run.anims].forEach((a) => a.cancel());
		run = null;
	}

	function go(i) {
		const groups = SCENARIOS[active].groups;
		stop();
		resetStage(active);
		step = (i + groups.length) % groups.length;
		setStep(active, step);
		drawEdges(active);
		run = { dead: false, anims: new Set() };
		playStep(run, active, step);
		setPaused(userPaused || !visible || document.hidden);
	}

	async function playStep(r, key, i) {
		const group = SCENARIOS[key].groups[i];
		stepDone = false;
		try {
			for (const act of group.acts) await doAct(r, key, act);
			stepDone = true;
			if (i === SCENARIOS[key].groups.length - 1) progress.lastElementChild?.classList.add("is-done");
			if (!autoAdvance) return;
			await sleep(r, dwell(group.text));
			if (i === SCENARIOS[key].groups.length - 1) await sleep(r, 1500);
			if (!r.dead && autoAdvance) go(i + 1);
		} catch (err) {
			if (err?.name !== "AbortError") throw err;
		}
	}

	function setPaused(value) {
		paused = value;
		root.classList.toggle("is-paused", paused);
		run?.anims.forEach((a) => (paused ? a.pause() : a.play()));
	}

	function updateControls() {
		const playing = autoAdvance && !userPaused;
		toggleBtn.textContent = playing ? "Pause" : "Play";
		toggleBtn.setAttribute("aria-label", playing ? "Pause autoplay" : "Play automatically");
		// Announce captions only when the viewer is stepping through manually.
		caption.setAttribute("aria-live", playing ? "off" : "polite");
		root.classList.toggle("is-manual", !playing);
	}

	function syncPlayback() {
		const offscreen = !visible || document.hidden;
		if (!run && !offscreen) go(step);
		else setPaused(userPaused || offscreen);
		updateControls();
	}

	// Viewer clicked Back, Next, or a step: stop autoplay and show that step.
	function takeControl(i) {
		autoAdvance = false;
		userPaused = false;
		go(i);
		updateControls();
	}

	// --- Controls ------------------------------------------------------------
	function select(key, focus = false) {
		tabs.forEach((t) => {
			const on = t.dataset.tab === key;
			t.setAttribute("aria-selected", String(on));
			t.tabIndex = on ? 0 : -1;
			if (on && focus) t.focus();
		});
		Object.entries(panels).forEach(([k, p]) => (p.hidden = k !== key));
		stop();
		active = key;
		autoAdvance = true;
		userPaused = false;
		buildMeta(key);
		go(0);
		updateControls();
	}
	tabs.forEach((t, i) => {
		t.addEventListener("click", () => select(t.dataset.tab));
		t.addEventListener("keydown", (e) => {
			const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
			if (e.key === "Home" || e.key === "End" || dir) {
				e.preventDefault();
				const next = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + dir + tabs.length) % tabs.length;
				select(tabs[next].dataset.tab, true);
			}
		});
	});

	prevBtn.addEventListener("click", () => takeControl(step - 1));
	nextBtn.addEventListener("click", () => takeControl(step + 1));
	toggleBtn.addEventListener("click", () => {
		if (autoAdvance && !userPaused) {
			autoAdvance = false;
			userPaused = true;
			setPaused(true);
		} else {
			const resumeMidStep = userPaused && !stepDone;
			autoAdvance = true;
			userPaused = false;
			if (resumeMidStep) {
				setPaused(false);
				// The step was frozen mid-animation; it will continue on its own.
			} else {
				go(step + 1);
			}
		}
		updateControls();
	});

	new ResizeObserver(() => drawEdges(active)).observe(root);
	new IntersectionObserver(
		([entry]) => {
			visible = entry.isIntersecting;
			syncPlayback();
		},
		{ threshold: 0.35 }
	).observe(root);
	document.addEventListener("visibilitychange", syncPlayback);

	buildMeta(active);
	setStep(active, 0);
	drawEdges(active);
	updateControls();
})();

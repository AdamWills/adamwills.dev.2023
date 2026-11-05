// Request cycle animation: WordPress vs static vs static + CMS.
(() => {
	const root = document.querySelector("[data-request-cycle]");
	if (!root || !root.animate) return;

	const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

	const move = (from, to, label, kind, extra = {}) => ({ t: "move", from, to, label, kind, ...extra });
	const work = (node, ms, status, kind, extra = {}) => ({ t: "work", node, ms, status, kind, ...extra });
	const bot = (target) => [
		move("bot", target, "POST /xmlrpc.php", "threat"),
		work(target, 1100, "Nothing to execute", "shield"),
		move(target, "bot", "404", "muted"),
	];

	const SCENARIOS = {
		wp: {
			edges: [["visitor", "server"], ["bot", "server"], ["server", "db"]],
			groups: [
				{ text: "A visitor asks for a page.", acts: [move("visitor", "server", "GET /services")] },
				{ text: "The server boots PHP, WordPress, the theme, and every active plugin.", acts: [work("server", 2200, "Booting…")] },
				{
					text: "WordPress queries the database for content, settings, and menus.",
					acts: [{ t: "queries", a: "server", b: "db", labels: ["options", "post", "menus", "meta"] }],
				},
				{ text: "The theme’s templates assemble the HTML from scratch.", acts: [work("server", 1500, "Rendering HTML…")] },
				{ text: "The finished page is sent back. The next visitor triggers all of it again.", acts: [move("server", "visitor", "200 · HTML", "ok")] },
				{
					text: "Bots send requests too, and PHP processes every one of them.",
					acts: [move("bot", "server", "POST /xmlrpc.php", "threat"), work("server", 1800, "Executing untrusted input", "threat")],
				},
			],
		},
		static: {
			edges: [["visitor", "cdn"], ["bot", "cdn"]],
			groups: [
				{ text: "A visitor asks for a page.", acts: [move("visitor", "cdn", "GET /services")] },
				{ text: "The nearest CDN edge already has it as a finished file.", acts: [work("cdn", 700, "Found services.html", "shield", { chip: "services" })] },
				{ text: "It sends the file straight back. No code runs, no database.", acts: [move("cdn", "visitor", "200 · HTML", "ok")] },
				{ text: "A bot sends the same malicious request.", acts: [bot("cdn")[0]] },
				{ text: "There’s no PHP or database to reach. It gets a 404 and moves on.", acts: bot("cdn").slice(1) },
			],
		},
		cms: {
			edges: [["editor", "cms"], ["cms", "build"], ["build", "cdn"], ["visitor", "cdn"], ["bot", "cdn"]],
			groups: [
				{ phase: "On publish", text: "You edit a page in the CMS and hit publish.", acts: [move("editor", "cms", "Publish “Services”")] },
				{ phase: "On publish", text: "The CMS tells the build service that content changed.", acts: [move("cms", "build", "webhook")] },
				{ phase: "On publish", text: "The build generates every page as plain HTML, once.", acts: [work("build", 2200, "Building pages…")] },
				{ phase: "On publish", text: "The new files are deployed to the CDN.", acts: [move("build", "cdn", "deploy files", "ok")] },
				{ phase: "On every visit", text: "Later, a visitor asks for a page.", acts: [move("visitor", "cdn", "GET /services")] },
				{
					phase: "On every visit",
					text: "The CDN sends the finished file. The CMS isn’t involved at all.",
					acts: [work("cdn", 600, "Found services.html", "shield", { chip: "services" }), move("cdn", "visitor", "200 · HTML", "ok")],
				},
				{ phase: "On every visit", text: "Bots hit the public files, not your CMS. Nothing there to exploit.", acts: bot("cdn") },
			],
		},
	};

	const tabs = [...root.querySelectorAll("[data-tab]")];
	const panels = Object.fromEntries([...root.querySelectorAll("[data-panel]")].map((p) => [p.dataset.panel, p]));
	const progress = root.querySelector(".rc-progress");
	const countEl = root.querySelector(".rc-count");
	const phaseEl = root.querySelector(".rc-phase");
	const textEl = root.querySelector(".rc-text");
	const stepsList = root.querySelector("[data-steps]");
	const toggleBtn = root.querySelector("[data-toggle]");
	const replayBtn = root.querySelector("[data-replay]");
	const clock = document.createElement("span");
	clock.hidden = true;
	root.append(clock);

	let active = "wp";
	let run = null;
	let paused = false;
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

	// --- Geometry ----------------------------------------------------------
	const stageOf = (key) => panels[key].querySelector(".rc-stage");
	const nodeOf = (key, id) => panels[key].querySelector(`[data-node="${id}"]`);
	function center(key, id) {
		const s = stageOf(key).getBoundingClientRect();
		const n = nodeOf(key, id).getBoundingClientRect();
		return { x: n.left - s.left + n.width / 2, y: n.top - s.top + n.height / 2, w: n.width, h: n.height };
	}
	// Point where the line from A's center toward B leaves A's box (plus a small gap).
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
	async function doMove(r, key, act, fast = false) {
		const layer = stageOf(key).querySelector(".rc-layer");
		const cA = center(key, act.from);
		const cB = center(key, act.to);
		const edge = edgeOf(key, act.from, act.to);
		edge?.classList.add("is-live");
		edge?.classList.toggle("is-threat", act.kind === "threat");

		const p = document.createElement("span");
		p.className = "rc-packet" + (act.kind ? ` is-${act.kind}` : "");
		p.textContent = act.label;
		layer.append(p);
		const gx = p.offsetWidth / 2 + 4;
		const gy = p.offsetHeight / 2 + 4;
		const A = edgePoint(cA, cB, gx, gy);
		const B = edgePoint(cB, cA, gx, gy);
		const at = (pt, s = 1) => `translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%) scale(${s})`;

		try {
			if (reduce.matches) {
				p.style.transform = at({ x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 });
				await sleep(r, fast ? 600 : 1300);
			} else {
				const dist = Math.hypot(B.x - A.x, B.y - A.y);
				const dur = Math.min(1500, Math.max(650, dist * 2.4)) * (fast ? 0.5 : 1);
				await track(
					r,
					p.animate(
						[
							{ transform: at(A, 0.7), opacity: 0 },
							{ transform: at(A, 1), opacity: 1, offset: 0.08 },
							{ transform: at(B, 1), opacity: 1, offset: 0.92 },
							{ transform: at(B, 0.7), opacity: 0 },
						],
						{ duration: dur, easing: "cubic-bezier(.6,0,.35,1)", fill: "forwards" }
					)
				);
			}
		} finally {
			p.remove();
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
					duration: reduce.matches ? Math.max(act.ms, 1300) : act.ms,
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
		db.querySelector(".rc-status").textContent = "Querying…";
		try {
			for (const label of act.labels) {
				await doMove(r, key, { from: act.a, to: act.b, label: `SELECT ${label}`, kind: "query" }, true);
				await doMove(r, key, { from: act.b, to: act.a, label: "rows", kind: "query" }, true);
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
		progress.innerHTML = groups.map(() => "<span></span>").join("");
		stepsList.innerHTML = "";
		for (const g of groups) {
			const li = document.createElement("li");
			li.textContent = (g.phase ? `${g.phase}: ` : "") + g.text;
			stepsList.append(li);
		}
	}
	function setStep(key, i) {
		const groups = SCENARIOS[key].groups;
		[...progress.children].forEach((s, j) => {
			s.classList.toggle("is-done", j < i);
			s.classList.toggle("is-active", j === i);
		});
		countEl.textContent = `${String(i + 1).padStart(2, "0")} / ${String(groups.length).padStart(2, "0")}`;
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

	// --- Run loop ------------------------------------------------------------
	async function loop(r, key) {
		const groups = SCENARIOS[key].groups;
		try {
			while (!r.dead) {
				for (let i = 0; i < groups.length; i++) {
					setStep(key, i);
					for (const act of groups[i].acts) await doAct(r, key, act);
					await sleep(r, reduce.matches ? 1200 : 550);
				}
				[...progress.children].forEach((s) => s.classList.add("is-done"));
				await sleep(r, 1800);
			}
		} catch (err) {
			if (err?.name !== "AbortError") throw err;
		}
	}

	function stop() {
		if (!run) return;
		run.dead = true;
		[...run.anims].forEach((a) => a.cancel());
		run = null;
	}

	function start(key) {
		stop();
		resetStage(key);
		active = key;
		buildMeta(key);
		drawEdges(key);
		run = { dead: false, anims: new Set() };
		loop(run, key);
	}

	function setPaused(value) {
		paused = value;
		root.classList.toggle("is-paused", paused);
		run?.anims.forEach((a) => (paused ? a.pause() : a.play()));
	}
	function syncPlayback() {
		const shouldPause = userPaused || !visible || document.hidden;
		if (!run && !shouldPause) start(active);
		setPaused(shouldPause);
		toggleBtn.textContent = userPaused ? "Play" : "Pause";
		toggleBtn.setAttribute("aria-pressed", String(userPaused));
	}

	// --- Tabs ----------------------------------------------------------------
	function select(key, focus = false) {
		tabs.forEach((t) => {
			const on = t.dataset.tab === key;
			t.setAttribute("aria-selected", String(on));
			t.tabIndex = on ? 0 : -1;
			if (on && focus) t.focus();
		});
		Object.entries(panels).forEach(([k, p]) => (p.hidden = k !== key));
		start(key);
		setPaused(userPaused || !visible);
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

	toggleBtn.addEventListener("click", () => {
		userPaused = !userPaused;
		syncPlayback();
	});
	replayBtn.addEventListener("click", () => {
		start(active);
		setPaused(userPaused || !visible);
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
})();

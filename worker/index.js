const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Each form posts to /api/<name>. `fields` maps form field names to the label used
// in the notification email and the longest value accepted.
const FORMS = {
	contact: {
		title: "Contact request",
		fields: {
			"full-name": { label: "Name", max: 200, required: true },
			email: { label: "Email", max: 320, required: true },
			website: { label: "Company", max: 200 },
			budget: { label: "Budget", max: 50 },
			message: { label: "Message", max: 10000, required: true, body: true },
		},
		nameField: "full-name",
		subject: (name) => `Contact request from adamwills.dev: ${name}`,
		redirectTo: "/success/",
		missingMessage: "Please fill in your name, a valid email address and a message.",
	},
	"launch-checklist": {
		title: "Launch checklist signup",
		fields: {
			name: { label: "Name", max: 200, required: true },
			email: { label: "Email", max: 320, required: true },
			company: { label: "Company", max: 200 },
			role: { label: "Role", max: 200 },
			"app-description": { label: "What the app does", max: 1000 },
			tool: { label: "Built with", max: 100 },
			users: { label: "Who uses it", max: 100 },
			"data[]": { label: "Data it holds", max: 500, multiple: true },
			"it-aware": { label: "IT knows about it", max: 100 },
			worry: { label: "Biggest worry", max: 5000, body: true },
		},
		nameField: "name",
		subject: (name) => `Launch checklist signup: ${name}`,
		redirectTo: "/launch-checklist/start/",
		missingMessage: "Please fill in your name and a valid email address.",
	},
	"launch-review": {
		title: "Launch Readiness Review request",
		fields: {
			name: { label: "Name", max: 200, required: true },
			email: { label: "Email", max: 320, required: true },
			company: { label: "Company", max: 200 },
			message: { label: "Message", max: 10000, body: true },
			"checklist-results": { label: "Checklist results", max: 50000, body: true },
		},
		nameField: "name",
		subject: (name) => `Launch Readiness Review request: ${name}`,
		redirectTo: "/success/",
		missingMessage: "Please fill in your name and a valid email address.",
	},
};

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const match = url.pathname.match(/^\/api\/([a-z-]+)$/);
		const form = match && FORMS[match[1]];

		if (form) {
			if (request.method !== "POST") {
				return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
			}
			return handleForm(form, request, env, ctx);
		}

		return env.ASSETS.fetch(request);
	},
};

async function handleForm(config, request, env, ctx) {
	let form;
	try {
		form = await request.formData();
	} catch {
		return errorPage(400, "That submission couldn't be read. Please try again.");
	}

	const field = (name) => String(form.get(name) ?? "").trim();

	// Honeypot: real people never fill this hidden field.
	if (field("bot-field")) {
		return redirect(request, config.redirectTo);
	}

	const values = {};
	for (const [name, spec] of Object.entries(config.fields)) {
		const value = spec.multiple
			? form.getAll(name).map((v) => String(v).trim()).filter(Boolean).join(", ")
			: field(name);
		if (value.length > spec.max) {
			return errorPage(400, "One of the fields is too long. Please shorten it and try again.");
		}
		values[name] = value;
	}

	const missing = Object.entries(config.fields).some(([name, spec]) => spec.required && !values[name]);
	if (missing || !EMAIL_PATTERN.test(values.email)) {
		return errorPage(400, config.missingMessage);
	}

	const human = await verifyTurnstile(field("cf-turnstile-response"), request, env);
	if (!human) {
		return errorPage(403, "We couldn't verify that you're human. Please go back and try again.");
	}

	const entries = Object.entries(config.fields);
	const text = [
		...entries.filter(([, spec]) => !spec.body).map(([name, spec]) => `${spec.label}: ${values[name] || "-"}`),
		...entries
			.filter(([name, spec]) => spec.body && values[name])
			.flatMap(([name, spec]) => ["", `${spec.label}:`, values[name]]),
	].join("\n");

	const name = values[config.nameField];
	ctx.waitUntil(postToDiscord(config, values, env));

	try {
		await env.CONTACT_EMAIL.send({
			from: { email: env.CONTACT_FROM, name: "adamwills.dev" },
			to: env.CONTACT_TO,
			replyTo: { email: values.email, name },
			subject: config.subject(name).slice(0, 200),
			text,
		});
	} catch (err) {
		console.error("Form email failed", err.code, err.message);
		return errorPage(
			502,
			"Something went wrong sending your details. Please try again, or email adam@adamwills.com directly.",
		);
	}

	return redirect(request, config.redirectTo);
}

// Posts the submission to a Discord channel through a webhook. Best effort: a Discord
// failure is logged and never stops the visitor's submission.
async function postToDiscord(config, values, env) {
	if (!env.DISCORD_WEBHOOK_URL) return;

	const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
	const entries = Object.entries(config.fields).filter(([name]) => values[name]);
	const fields = entries
		.filter(([, spec]) => !spec.body)
		.map(([name, spec]) => ({ name: spec.label, value: clip(values[name], 1024), inline: values[name].length < 40 }));
	const description = entries
		.filter(([, spec]) => spec.body)
		.map(([name, spec]) => `**${spec.label}**\n${values[name]}`)
		.join("\n\n");

	try {
		const res = await fetch(env.DISCORD_WEBHOOK_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: "adamwills.dev",
				// Visitor text must never ping anyone (@everyone, roles, users).
				allowed_mentions: { parse: [] },
				embeds: [
					{
						title: clip(`${config.title}: ${values[config.nameField]}`, 256),
						// Discord rejects embeds over 6,000 characters in total; this leaves room for the fields.
						description: clip(description, 2500) || undefined,
						fields: fields.slice(0, 25),
						timestamp: new Date().toISOString(),
					},
				],
			}),
		});
		if (!res.ok) console.error("Discord webhook failed", res.status, await res.text());
	} catch (err) {
		console.error("Discord webhook failed", err);
	}
}

async function verifyTurnstile(token, request, env) {
	if (!token || !env.TURNSTILE_SECRET_KEY) return false;

	const body = new FormData();
	body.append("secret", env.TURNSTILE_SECRET_KEY);
	body.append("response", token);
	const ip = request.headers.get("CF-Connecting-IP");
	if (ip) body.append("remoteip", ip);

	try {
		const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
		const outcome = await res.json();
		return outcome.success === true;
	} catch (err) {
		console.error("Turnstile verification failed", err);
		return false;
	}
}

function redirect(request, path) {
	return Response.redirect(new URL(path, request.url).toString(), 303);
}

function errorPage(status, message) {
	const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not sent</title></head><body style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;line-height:1.5"><h1>Not sent</h1><p>${message}</p><p><a href="javascript:history.back()">Go back</a> &middot; <a href="/">Home</a></p></body></html>`;
	return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

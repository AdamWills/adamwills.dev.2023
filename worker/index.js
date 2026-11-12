const MAX_LENGTH = { "full-name": 200, email: 320, website: 200, budget: 50, message: 10000 };

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		if (url.pathname === "/api/contact") {
			if (request.method !== "POST") {
				return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
			}
			return handleContact(request, env);
		}

		return env.ASSETS.fetch(request);
	},
};

async function handleContact(request, env) {
	let form;
	try {
		form = await request.formData();
	} catch {
		return errorPage(400, "That submission couldn't be read. Please try again.");
	}

	const field = (name) => String(form.get(name) ?? "").trim();

	// Honeypot: real people never fill this hidden field.
	if (field("bot-field")) {
		return redirect(request, "/success/");
	}

	const data = {
		name: field("full-name"),
		email: field("email"),
		company: field("website"),
		budget: field("budget"),
		message: field("message"),
	};

	if (!data.name || !data.email || !data.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
		return errorPage(400, "Please fill in your name, a valid email address and a message.");
	}
	for (const [name, max] of Object.entries(MAX_LENGTH)) {
		if (field(name).length > max) {
			return errorPage(400, "One of the fields is too long. Please shorten it and try again.");
		}
	}

	const human = await verifyTurnstile(field("cf-turnstile-response"), request, env);
	if (!human) {
		return errorPage(403, "We couldn't verify that you're human. Please go back and try again.");
	}

	const text = [
		`Name: ${data.name}`,
		`Email: ${data.email}`,
		`Company: ${data.company || "-"}`,
		`Budget: ${data.budget || "-"}`,
		"",
		data.message,
	].join("\n");

	try {
		await env.CONTACT_EMAIL.send({
			from: { email: env.CONTACT_FROM, name: "adamwills.dev" },
			to: env.CONTACT_TO,
			replyTo: { email: data.email, name: data.name },
			subject: `Contact request from adamwills.dev: ${data.name}`.slice(0, 200),
			text,
		});
	} catch (err) {
		console.error("Contact email failed", err.code, err.message);
		return errorPage(
			502,
			"Something went wrong sending your message. Please try again, or email adam@adamwills.com directly.",
		);
	}

	return redirect(request, "/success/");
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
	const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Message not sent</title></head><body style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;line-height:1.5"><h1>Message not sent</h1><p>${message}</p><p><a href="javascript:history.back()">Go back</a> &middot; <a href="/">Home</a></p></body></html>`;
	return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

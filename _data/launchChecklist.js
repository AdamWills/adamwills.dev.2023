// Content for the Launch Readiness Checklist (/launch-checklist/start/).
//
// Each item has:
//   id       stable key, used to save answers in the visitor's browser. Don't rename once live.
//   title    the question, in plain language
//   why      one or two sentences on why it matters
//   prompt   (optional) copy-paste prompt for the visitor's AI tool. These ask the AI to
//            check and explain, never to change anything.
//   ask      (optional) a question for the visitor themselves, for items an AI can't answer
//   green / yellow / red   what each result looks like
//   critical (optional) a red here is a "don't launch yet" on its own

export default function () {
	const checklist = {
		setupPrompt: `I'm not a professional developer. I built this app with your help and my company is thinking about rolling it out to more people. I'm going to ask you a series of questions to check whether it's ready.

For every question:
- Do NOT change any code or settings. Only look and explain.
- Answer in plain language that a non-developer can follow.
- Point to the specific files or settings you're basing your answer on.
- If you're not sure, or you can't see something, say so. "I don't know" is a useful answer. Don't guess.
- If something is a real risk, say so clearly. Don't soften it to be nice.`,

		sections: [
			{
				id: "access",
				title: "Who can get in",
				intro: "The most common gap in AI-built apps. A login screen can look finished without actually keeping anyone out.",
				items: [
					{
						id: "login",
						critical: true,
						title: "Does everyone have to sign in, and is the sign-in solid?",
						why: "If any page or piece of data can be reached without signing in, anyone who finds the address can see it. Home-made login systems are also easy to get subtly wrong.",
						prompt: `How does signing in work in this app? Please tell me:
1. Is there any page, screen, or piece of data that can be reached without being signed in? Check the server side, not just whether the button is hidden.
2. Does it use an established login service (for example Google or Microsoft sign-in, Supabase Auth, Clerk, Auth0, Firebase Auth), or did we build our own?
3. If we built our own, how are passwords stored?`,
						green: "Uses an established login service and every page and piece of data requires signing in.",
						yellow: "An established service, but the AI found a page or data that's reachable without signing in, or it isn't sure.",
						red: "No sign-in, one shared password, or a home-made login system storing passwords itself.",
					},
					{
						id: "permissions",
						critical: true,
						title: "Can people only see what they're supposed to?",
						why: "Signing in proves who someone is. It doesn't stop them from seeing someone else's records. A classic gap is being able to change a number in the web address and see another person's data.",
						prompt: `Once someone is signed in, what decides which records they can see and change?
1. If a user changed an ID in the web address or in a request (for example /orders/12 to /orders/13), would the app stop them from seeing something that isn't theirs? Show me where that check happens on the server.
2. Are there different kinds of users (for example admins vs. regular staff)? Where is that enforced?
3. If the app uses a hosted database like Supabase or Firebase, are its access rules (sometimes called "row level security" or "security rules") turned on and actually restricting anything?`,
						green: "Every request checks who's asking and what they're allowed to see, on the server. The AI can show you where.",
						yellow: "There are checks, but the AI found some screens or actions without them, or relies on hiding buttons.",
						red: "Anyone signed in can see or change everything, or database access rules are off.",
					},
					{
						id: "secrets",
						critical: true,
						title: "Are passwords and keys kept out of sight?",
						why: "Apps connect to other services with secret keys. If those keys end up in code that runs in the browser, or in a shared code repository, anyone can copy them and use your accounts, sometimes at your expense.",
						prompt: `List every secret key, password, or token this app uses to connect to other services (for example database, email, payments, AI services).
For each one, tell me:
1. Where is it stored? Is it written directly in the code, or kept in a separate settings/environment file?
2. Could it end up in the code that's sent to people's browsers?
3. Has it ever been committed to the code history (for example on GitHub), even if it was removed later?`,
						green: "All keys live in environment settings, none reach the browser, and none are in the code history.",
						yellow: "Keys are kept separately now, but some were in the code history at some point. (They should be replaced.)",
						red: "Keys are written in the code, or the AI found one that's visible in the browser.",
					},
					{
						id: "offboarding",
						title: "When someone leaves the company, can you lock them out?",
						why: "Companies already have a process for removing access when people leave. An app with its own separate accounts falls outside that process, so ex-employees can keep access without anyone noticing.",
						prompt: `How are user accounts managed in this app? If an employee leaves the company, what are the exact steps to remove their access? Is there any way to sign in with our company accounts (for example Google Workspace or Microsoft 365) instead of a separate username and password?`,
						green: "People sign in with their company account, so removing them from the company removes them from the app.",
						yellow: "Separate accounts, but there's a clear way to disable one and someone owns doing it.",
						red: "No way to remove someone, or everyone shares one login.",
					},
				],
			},
			{
				id: "data",
				title: "Whose data is it",
				intro: "Your company almost certainly has rules, and possibly legal obligations, about what information goes where.",
				items: [
					{
						id: "data-types",
						critical: true,
						title: "Do you know exactly what information the app stores?",
						why: "Customer names, email addresses, financial details, and health or HR information all come with obligations. Privacy laws (like PIPEDA in Canada, or GDPR in Europe) apply whether the app was built by a developer or by AI.",
						prompt: `Make me a plain-language list of every type of information this app stores or handles. Group it into: information about our customers, information about our employees, financial information, and anything else. Flag anything that would count as personal or sensitive information (names, contact details, ID numbers, financial, health, HR).`,
						green: "Internal, non-personal information only (for example inventory, schedules, project status).",
						yellow: "Some personal information like names and work emails, and you know where it all is.",
						red: "Customer personal information, financial details, health or HR records, or the AI's list surprised you.",
					},
					{
						id: "data-location",
						title: "Do you know where the data is stored, and who stores it?",
						why: "Your data lives on someone else's servers: a database service, a hosting company, a file storage service. Many companies have rules about which vendors are approved and which countries data can be stored in.",
						prompt: `List every outside service or company that stores or receives data from this app (for example the database host, file storage, email service, analytics, error tracking). For each one, which account is it under, and if you can tell, which country or region is the data stored in?`,
						green: "A short list of services your company already uses or has approved, under a company account.",
						yellow: "Reputable services, but nobody at the company has approved them, or you don't know the region.",
						red: "Under your personal account, on a free plan, or the AI couldn't tell you where the data is.",
					},
					{
						id: "ai-data",
						title: "Does the app send company data to an AI service?",
						why: "If the app uses AI features (summarizing, drafting, chat), the information goes to that AI company. Your company may have a policy on which AI services are allowed and what can be sent to them.",
						prompt: `Does this app send any information to an AI service (for example OpenAI, Anthropic, Google)? If so, which features do it, exactly what information gets sent each time, and which account and plan is being used?`,
						green: "No AI features, or AI features that only send non-sensitive information through a company-approved account.",
						yellow: "Sends some business information, and you're not sure whether that's allowed.",
						red: "Sends customer or employee personal information, or runs on your personal AI account.",
					},
				],
			},
			{
				id: "failure",
				title: "When things go wrong",
				intro: "A demo never has to answer these questions. An app people depend on answers them every week.",
				items: [
					{
						id: "backups",
						critical: true,
						title: "If the data disappeared tomorrow, could you get it back?",
						why: "Data gets lost through bad updates, accidental deletes, and service outages. The question isn't whether backups are turned on. It's whether anyone has ever actually restored one.",
						prompt: `Is the data in this app backed up? Tell me:
1. What's backed up (the database, uploaded files, both)?
2. How often, and how far back can we go?
3. What are the exact steps to restore a backup, and has that ever been done?
4. If someone accidentally deleted a bunch of records, how would we get just those back?`,
						green: "Automatic daily backups, and you (or someone) has successfully restored one as a test.",
						yellow: "Backups are on, but nobody has ever tried restoring one.",
						red: "No backups, or the AI isn't sure.",
					},
					{
						id: "errors",
						title: "Would anyone know if something broke?",
						why: "When something fails in a prototype, you see it on your screen. When it fails for a colleague at 4pm on a Friday, you may never hear about it, or they may just stop trusting the app.",
						prompt: `What happens when something goes wrong in this app, for example a save fails, an outside service is down, or there's a bug? Does the user see a clear message? Is the error recorded anywhere? Would I or anyone else get notified? Are there places where a failure would happen silently?`,
						green: "Errors show clear messages and are recorded in an error tracking service that notifies someone.",
						yellow: "Users see an error, but nobody is notified and you'd only find out if someone complained.",
						red: "Failures can happen silently, or the app just shows a blank or broken screen.",
					},
					{
						id: "messy-input",
						title: "Does it hold up to real, messy use?",
						why: "Your own test data is tidy. Real people type things wrong, double-click buttons, upload huge files, and edit the same record at the same time.",
						prompt: `Look for places where real-world use could cause problems:
1. What happens if two people edit the same record at the same time?
2. What happens if someone double-clicks a save or submit button?
3. Is what people type checked on the server (for example required fields, valid emails, sensible numbers), or only in the browser?
4. Are there any limits on file uploads (size and type)?
List anything that could lead to lost, duplicated, or corrupted data.`,
						green: "The AI found input checks on the server and no obvious ways to lose or duplicate data.",
						yellow: "A few rough edges that could cause occasional duplicate or confusing data.",
						red: "Ways to lose or overwrite other people's work, or no checks on what gets saved.",
					},
				],
			},
			{
				id: "running",
				title: "Where it runs and what it costs",
				intro: "Prototypes often run on free plans and personal accounts. That's fine for a prototype and risky for a tool the company depends on.",
				items: [
					{
						id: "hosting",
						title: "Is it running somewhere the company controls?",
						why: "If the app runs on your personal account or credit card, it's tied to you. If your card expires, you go on leave, or you move on, the app can go down with no one able to get it back.",
						prompt: `Where is this app running right now? List every service and account it depends on to stay online (hosting, database, domain name, email, and so on). For each one: is it a free or paid plan, and are there limits on that plan that we could hit (for example usage limits, the app going to sleep when idle, or data limits)?`,
						ask: "Whose account and credit card is each of those under?",
						green: "Paid plans, under company accounts, with more than one person at the company able to get in.",
						yellow: "Reputable services, but on your personal account or a free plan.",
						red: "Running from your laptop, or on a free plan with limits you're already close to.",
					},
					{
						id: "costs",
						title: "Do you know what it will cost with real usage?",
						why: "Services that are free or cheap with one user can behave very differently with fifty. AI features especially can get expensive fast, because you pay every time they're used.",
						prompt: `Which parts of this app cost money based on how much it's used (for example hosting, database size, file storage, emails sent, AI requests)? Roughly what would it cost per month with 50 people using it every day? Are there any places where one person could accidentally run up a big bill, for example by triggering lots of AI requests?`,
						green: "You have a rough monthly estimate, it's reasonable, and there are spending limits or alerts.",
						yellow: "Probably fine, but you don't have an estimate or any spending alerts.",
						red: "Costs grow with use and there's nothing stopping a surprise bill.",
					},
				],
			},
			{
				id: "maintenance",
				title: "Keeping it alive",
				intro: "AI-generated code tends to be written for right now. Someone has to be able to look after it six months from now.",
				items: [
					{
						id: "code-ownership",
						title: "Is the code somewhere the company owns?",
						why: "If the code only exists inside your AI tool account or on your laptop, the company doesn't really own the app. A copy in a company-owned code repository (like GitHub) means someone else can pick it up.",
						prompt: `Where does the code for this app live? Is it saved in a code repository like GitHub, and does it have a history of changes? Write a short summary of how the code is organized, so that a developer seeing it for the first time could understand it. Is there a README file explaining how to run it?`,
						green: "In a company-owned repository with change history and a README.",
						yellow: "In a repository, but under your personal account, or with no explanation of how it works.",
						red: "Only exists inside your AI tool or on your computer.",
					},
					{
						id: "updates",
						title: "Are its building blocks up to date?",
						why: "Every app is built on dozens of open-source packages. When security problems are found in them, they need updating, and AI tools sometimes pick old versions to begin with.",
						prompt: `What outside packages and libraries does this app depend on? Are any of them out of date, no longer maintained, or known to have security problems? If you're able to run a security check on the dependencies (for example "npm audit"), please do and explain the results in plain language. Don't fix anything yet.`,
						green: "Up to date, or only minor updates available, with no known security problems.",
						yellow: "Several out-of-date packages, but nothing marked serious.",
						red: "Known serious security problems, or packages that are no longer maintained.",
					},
					{
						id: "changes",
						title: "Can you make changes without breaking things for everyone?",
						why: "Once people depend on the app, every change is a risk. Professional apps have a test copy to try changes on first, and automated tests that catch things that break.",
						prompt: `When I ask you to change this app, where do those changes go? Do they go straight to the live version that people are using, or is there a separate test copy? Are there any automated tests? If a change broke something, how would we undo it?`,
						green: "There's a separate test copy, changes can be rolled back, and there are some automated tests.",
						yellow: "Changes can be undone, but they go straight to the live app.",
						red: "Changes go straight to the live app and there's no reliable way to undo them.",
					},
				],
			},
			{
				id: "company",
				title: "Getting your company on board",
				intro: "This is where internal tools most often get stuck, and none of it is about code.",
				items: [
					{
						id: "it-aware",
						title: "Does IT know the app exists?",
						why: "IT teams aren't there to shut things down, but they are responsible for company data and security. Finding out about an app after it's in use is what tends to get it shut down.",
						ask: "Has anyone in IT, security, or whoever looks after technology at your company seen this app? Do you know if there's an approval process for new software?",
						prompt: `Write a one-page summary of this app for our IT team, in plain language. Include: what it does, who uses it, what information it stores, which outside services and accounts it relies on, how people sign in, and any risks or gaps you're aware of. Be honest about the gaps. This is to start a conversation, not to get it approved.`,
						green: "IT knows about it and has had a look, or your company has no IT function and leadership knows.",
						yellow: "IT doesn't know yet, but you're planning to tell them.",
						red: "IT doesn't know, and the app holds customer or employee information.",
					},
					{
						id: "owner",
						title: "If you were away for a month, who would look after it?",
						why: "Right now, you're probably the only person who understands the app. That's fine until you're on vacation, on leave, busy with your actual job, or move on.",
						ask: "If the app broke while you were away, who would people call? Could that person get into every account the app depends on?",
						green: "At least one other person can get into everything and knows how to get help.",
						yellow: "Someone else could probably figure it out, but nothing is written down.",
						red: "It's just you.",
					},
					{
						id: "policy",
						title: "Is building tools this way allowed where you work?",
						why: "Many companies now have policies on AI tools: which ones are allowed, and what company information can be put into them. It's worth knowing before the app is in wider use.",
						ask: "Does your company have a policy on using AI tools, or on approved software and vendors? Did building the app involve putting company information into the AI tool?",
						green: "You've checked, and what you've done fits the policy, or there's no policy and leadership is supportive.",
						yellow: "You're not sure whether there's a policy.",
						red: "There's a policy, and the app (or how it was built) doesn't fit it.",
					},
				],
			},
		],
	};

	// Number the items across sections, and count them.
	let number = 0;
	for (const section of checklist.sections) {
		for (const item of section.items) item.number = ++number;
	}
	checklist.total = number;

	return checklist;
}

---
title: "You Built an App With AI. Now What?"
description: "AI tools like Lovable, Bolt, and Claude make it easy to build a working prototype. Here's an honest look at the gap between that prototype and an app you can trust with real users and real data, and what closing it actually involves."
date: 2026-08-18
tags:
  - ai
  - prototypes
  - custom software
---

Something genuinely new is happening. People who have never written a line of code are opening up tools like Lovable, Bolt, or Claude, describing the app they've always wanted, and getting a working version back the same afternoon. A few of those people have ended up in my inbox, usually with some version of the same question: it works, so... now what?

First, let me say the part that some developers won't. If you've built a prototype with AI, you've done something valuable. Maybe the most valuable thing in the whole process. You've proven your idea can work, you've figured out what you actually want, and you've skipped the most expensive kind of miscommunication there is: the one where you pay someone for months of development and only discover at the end that what you described wasn't what you meant. Your prototype says what no requirements document ever could. That's not a consolation prize. That's a head start.

So no, I'm not going to tell you the prototype was a mistake. I'm going to tell you what it quietly skipped, so you can decide what to do next with clear eyes.

## What the prototype didn't do

AI building tools are optimized to get something working in front of you fast, and they're impressively good at it. But "working when I click around it" and "safe to put real customers into" are different standards, and the distance between them is mostly invisible until something goes wrong.

Here's what a fast prototype typically hasn't dealt with:

* **Security.** Who can see what? Prototypes often have logins that look like logins but don't hold up to someone actively poking at them. If the app holds customer information, this isn't a nice-to-have. In many cases it's a legal obligation.
* **Other people's data.** Your own test data is forgiving. Real data arrives messy, gets typed in wrong, and needs to be backed up, recoverable, and handled properly.
* **Failure.** What happens when the payment doesn't go through, the file doesn't upload, or two people edit the same record at once? A demo never has to answer these questions. A real app answers them daily.
* **Maintenance.** AI-generated code tends to be written for right now. Six months from now, when you want to add a feature or a dependency needs a security update, someone has to be able to understand and safely change what's there.
* **Running costs.** Hosting, third-party services, and AI API calls that were free or cheap at prototype scale can behave very differently with real usage.

None of this means your prototype is bad. It means it was built to answer a different question. It answered "is this idea worth pursuing?" and the answer was yes. These are the next questions.

## Harden it or rebuild it?

When someone brings me a prototype, the decision usually comes down to one judgment call: is this codebase a foundation, or is it a blueprint?

Sometimes the generated code is in decent shape and the right move is to harden it: add proper authentication, tighten up how data is handled, put error handling and backups in place, and get it hosted somewhere dependable. The app you have grows up into the app you need.

Just as often, the honest answer is that the prototype's real value is as a specification, not as code. Every screen, every button, every workflow you refined is a precise description of what to build. In that case, we rebuild on a solid foundation, using your prototype as the blueprint. That might sound like starting over, but it isn't. Rebuilding from a working prototype is dramatically faster and cheaper than building from a blank page, because all the expensive discovery work, the figuring out what you actually want, is already done. You did it.

Which path makes sense depends on the state of the code, what the app needs to do, and what it will hold. It's not a decision you should have to make blind, and it's exactly the kind of thing I'm happy to look at and give you a straight answer on.

## Do you even need to?

Here's the part where I talk myself out of work, as usual. Not every prototype needs to be productionized.

If the app is just for you, holds nothing sensitive, and an outage would be an annoyance rather than a crisis, then congratulations: you built yourself a tool, it works, and you can stop there. Plenty of AI-built apps should live long, happy lives exactly as they are.

The calculus changes when real things start flowing through it. Customers trusting you with their information. Staff depending on it to do their jobs. Money moving. Decisions being made from its data. That's the line. Once an app matters to people other than you, it needs to be built like it matters.

If you've crossed that line, or you're about to, the good news is that you're in a better position than almost anyone who's ever hired a developer. You're not showing up with a vague idea. You're showing up with a working answer to the hardest question, and just need help with the rest.

---

*If you've built something with AI and you're wondering whether it's ready for real users, I'm happy to take a look and tell you honestly what it would take. Sometimes the answer is "less than you'd think." [Let's talk.](https://adamwills.dev/#contact)*

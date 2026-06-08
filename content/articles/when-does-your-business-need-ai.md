---
title: "When Does Your Business Actually Need AI?"
description: An honest answer to whether your business should be using AI, from a developer who builds with it. The two questions I use to decide, and two real projects where it did and didn't make sense.
date: 2026-06-04
tags:
  - ai
  - automation
  - custom software
---

Lately, more of my clients have started asking the same question: could AI help with this? It's a fair question, and a good sign that people are looking hard at their tools instead of just accepting them. But the honest answer is rarely the one the headlines suggest.

So here is where I actually land when someone asks whether they should be using AI. It depends. Not as a way of dodging the question, but because the right answer changes completely depending on what you are trying to fix. Sometimes AI is the best tool I have. More often than not, it has not been necessary at all.

This article is for the owner who keeps hearing they need AI in everything and wants a straight answer from someone who builds with it. I will walk you through the two questions I use to decide, and two real projects: one where AI earned its place, and one where it was the wrong idea wearing a good idea's clothes.

## Start with the problem, not the technology

The most useful thing I do when a client brings me a request is poke holes in it. Not to be difficult, but because the worst software gets built when you jump to a solution before you understand the problem. So I dig in first. What is actually going wrong? Where does the current process break down? Only once that is clear do we talk about how technology might help, and whether AI is part of that answer or not.

There is a simple test underneath all of it. If a task is deterministic, meaning the same input should always produce the same result, ordinary programming is almost always the better tool. It is cheaper, faster, and dependable. AI earns its place when a task needs judgment that you cannot write down as a fixed set of rules ahead of time. When every case is a little different and someone has to make small decisions on the fly, that is the signal you have crossed from a programming problem into an AI problem.

## Where AI earned its place

I am building a system for a client right now that processes invoices from a long list of different vendors. The information from each invoice gets tied back to specific pieces of equipment so they can track things over time. Today, a lot of that happens by hand, in spreadsheets.

You might think you could automate this with some straightforward pattern matching, and for a single vendor you probably could. The trouble is that they work with many vendors, and every vendor formats things a little differently. Each invoice carries a handful of small decisions about what belongs where. That variability, the part you cannot capture in tidy rules, is exactly what makes this a good fit for AI.

It is still in development, so I am not going to hand you a clean before-and-after number that does not exist yet. What I can tell you is that taking repetitive manual data entry off people's plates matters most precisely when a business is trying to grow. This client is looking at scaling up considerably, and processing invoices by hand is the kind of work you do not want to solve by simply hiring more people to keep doing it.

## Where it was just hype

Now the flip side. I once worked with a client to build a custom chatbot trained on a specific body of background information. The technology worked fine. The problem was that they assumed they could turn it into a product and sell it, and the market did not bite.

That is the trap worth remembering. Building an AI thing is not the same as having something people want. A chatbot is a feature, not a business. The hype usually is not in the technology itself, it is in the quiet assumption that because something has become possible, there must be demand for it. Real products start with a problem someone already has, not with a shiny capability hunting for a use.

## The part nobody mentions

If you do decide AI belongs, there is a side of it that never makes the brochure. The biggest one is that it is not reliable in the way normal software is. Feed a traditional program the same input five times and you get the same answer five times. That predictability is the entire point of programming. With AI, you can hand it the same data five times and get five slightly different results.

Accuracy, then, is always a question mark, and most of the real work is in managing it. A few things help. I lean on structured data rather than open-ended conversation, because a model that only has to fill in defined fields has far less room to be confidently wrong than one having a freeform chat. For anything that matters, the output runs through a manual review step before it counts, and in some cases a second model checks the first. AI is also another moving part that relies on third parties, which means an ongoing cost and an outside service you do not fully control. None of this is a reason to avoid it. It is simply the real cost of doing it properly, and it belongs in the decision from the start, not as a surprise later.

## So, do you need it?

Start with the problem, not the technology. Ask whether the task genuinely needs judgment, or whether it just needs to be done the same way every time. If a normal program can solve it, that is usually the better answer. And if it does call for AI, budget for the unglamorous parts: the review steps, the guardrails, the running cost.

AI is a genuinely useful tool when it is pointed at the right problem. It is an expensive distraction when it is pointed at the wrong one. The skill is not in using it. It is in knowing the difference.

---

*If you are weighing whether AI fits something you are working on, I build practical custom software for small and medium-sized businesses, and I am just as happy to tell you when you do not need it. [Let's talk.](https://adamwills.dev/#contact)*

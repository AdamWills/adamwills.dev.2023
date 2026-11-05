---
title: "Moving From WordPress to a Static Site: Why I Recommend It in 2026"
description: "A critical PHP flaw, an actively exploited WordPress core bug, and AI tools that find vulnerabilities for about $20 each. Here's what a static site actually is, and why I think it's the better choice for most business websites."
date: 2026-11-04
tags:
  - static sites
  - wordpress
  - security
---

If your business website runs on WordPress, the last few weeks have probably been uncomfortable. On October 21, PHP, the language WordPress is built on, shipped emergency fixes for two critical flaws that allow an attacker to run code on a server without logging in. Researchers at Wiz, who found them, say every PHP version released in the last decade is affected by at least one. Hosting companies were reporting attacks the morning the fix came out. Then, on November 3, CISA added a separate WordPress core vulnerability to its list of flaws that are being actively exploited in the wild.

That is two serious problems in two weeks, and neither of them had anything to do with a sketchy plugin. They were in the foundation.

This article is for business owners who have a WordPress site, or are about to get one, and want to know whether there's a better way. I think there is, for most sites. I'll explain why the risk is growing, what a static site actually is, and why I think it's the better choice for most business websites.

## AI has changed the economics of finding vulnerabilities

The PHP flaws were found with help from AI models. Wiz says AI cut down the work of chaining bugs together and adapting exploits to different versions, which let their team build working attacks across WordPress, Drupal, and Joomla in hours.

That was a responsible research team. The same tools are available to everyone else. In May, researchers from TrendAI and CHT Security presented an automated pipeline that found more than 300 critical vulnerabilities across WordPress plugins in about 72 hours, at roughly $20 per vulnerability. As one of the researchers put it, "any motivated attacker with a credit card can execute this."

For a long time, a small business site was protected partly by being uninteresting. Nobody was going to spend a week hand-auditing the contact form plugin on a landscaping company's website. That protection is gone. When finding a hole costs $20 and exploiting it is automated, every site running vulnerable code is worth scanning, and attackers scan all of them.

## The maintenance that doesn't happen

WordPress can be run safely. It requires keeping WordPress core, every plugin, every theme, and the PHP version underneath all of it up to date, promptly, forever. It also requires someone to check that each update didn't break anything.

In practice, that rarely happens. I see it constantly. The site was built a few years ago by someone who has since moved on. Nobody is quite sure who has the login. There are a dozen plugins, a few of which haven't been updated by their authors in years. The hosting plan is running a PHP version that stopped getting security fixes. Everything looks fine from the outside, so nobody touches it.

I don't blame anyone for this. A business owner's job is running the business, not watching security advisories. But the WordPress model quietly assumes someone is doing that work, and when nobody is, the site slowly becomes a liability. With exploitation now starting within hours of a disclosure, "we'll get to the updates next month" isn't really an option anymore.

## What a static site is

When someone visits a WordPress page, the server runs PHP code, asks a database for the content, assembles the page, and sends it back. That happens on every visit. All of that machinery is sitting on the internet, running, and waiting for requests, including malicious ones.

A static site does that assembly work once, ahead of time. When content changes, a build tool generates every page as a plain HTML file. Those finished files are put on a hosting service, and when someone visits, the server just hands them the file. There's no code running on the server to answer the request and no database to query.

To a visitor, a static site looks exactly the same. It can have the same design, the same blog, images, and contact forms. The difference is entirely in what's happening behind the scenes. This site is static, for what it's worth.

Here's what that difference looks like, side by side with a third option: a static site paired with a CMS, so you can still edit content yourself.

{% include "components/request-cycle.njk" %}

## Why I recommend static sites

**Much smaller attack surface.** Both of the recent vulnerabilities required a server running PHP to attack. A static site doesn't have one. There's no login page on your public site, no database to dump, no plugins to exploit. It's hard to break into a folder of HTML files. Static sites aren't immune to every risk, but whole categories of attack simply don't apply.

**Maintenance mostly goes away.** There's no weekly round of plugin updates, no PHP upgrades to schedule with your host, and no worrying that an update will take the site down. A static site built today will keep working, unchanged, for years. The tooling used to build it still needs occasional updates, but that happens on a developer's machine, not on a live server facing the internet.

**Speed.** Serving a ready-made file is about the fastest thing a web server can do. Static sites are typically delivered from a CDN, a network of servers around the world, so pages load from somewhere close to each visitor. Fast pages are better for visitors, and Google uses page experience as part of how it ranks sites.

**Lower hosting costs.** Without a server running code and a database, hosting is simple and cheap. Many hosts serve static sites free or close to it for small business traffic, and a sudden spike in visitors doesn't take the site down.

**Reliability.** There's much less that can fail. No database connection errors, no "white screen of death" after an update, no memory limits being hit. If a build ever goes wrong, the previous version is still sitting there and can be restored in seconds.

**Your content is yours.** Content in a static site usually lives as plain text files in version control, so there's a full history of every change, and it isn't locked inside a particular database or plugin's format.

## What about editing content?

This is the most common objection, and it's a fair one. Part of WordPress's appeal is that you can log in and change things yourself.

You can still do that with a static site. There are content management systems built for static sites that give you a familiar editing screen. When you hit publish, the site rebuilds itself with your changes, usually in under a minute. The difference is that the editing tool is separate from the public website, so the thing you log into isn't the thing attackers are hitting.

Contact forms, newsletter signups, and similar features work too. They're handled by small, focused services rather than a plugin running on your web server.

## When static isn't the right fit

If your site is really an application, with customer accounts, a large online store, or content that changes for every visitor, a purely static site isn't the right answer, and I'll tell you so. Even then, it often makes sense to keep the marketing pages static and put the dynamic parts in a properly built and maintained application.

But most business websites are brochures, blogs, and contact forms. They don't need a server assembling every page on every visit. They need to be fast, secure, and still working five years from now without anyone babysitting them.

That's why I recommend static sites for nearly every business website. If you have a WordPress site that's been quietly aging in the background, the past few weeks are a good reason to think about moving it.

---

*If you're not sure whether a static site is right for you, [get in touch](https://adamwills.dev/#contact) and I'll give you a straight answer.*

### Sources

1. Wiz Research. "PHP2Shell: AI uncovers critical RCE vulnerabilities affecting 70% of the Internet." [wiz.io](https://www.wiz.io/blog/php2shell-php-rce)
2. Patchstack. "Major security alert: PHP vulnerable to critical RCE, attacks ongoing." [patchstack.com](https://www.patchstack.com/articles/php-major-vulnerability-alert-10-2026/)
3. The Hacker News. "CISA Confirms Hackers Exploiting WordPress Core Flaw During Software Upgrades." [thehackernews.com](https://thehackernews.com/2026/11/cisa-confirms-hackers-exploiting.html)
4. Help Net Security. "$20 per zero-day is already the WordPress plugin reality." [helpnetsecurity.com](https://www.helpnetsecurity.com/2026/05/22/ai-wordpress-plugin-vulnerabilities/)

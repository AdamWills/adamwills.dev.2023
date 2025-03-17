---
title: "If it ain't broke, don't fix it"
description: "A small web app I made in 2013 is still being used today. It's not perfect, but it gets the job done. Should I update it?"
date: 2025-03-17
tags:
  - web apps
  - jquery
  - maintenance
  - refactoring
---

Back in the early 2010s, I was working on a WordPress site that would be used by a large number of users with varying technical skills. The website we were working on had a lot of tables in the content. As accessibility was at the forefront of the site, it was important that our users were able to create properly coded HTML tables with the features required for screen readers (proper table headings, row headings, etc.).

There were lots of WordPress plugins available for creating tables, but none of them address accessibility concerns. So, I did what any developer would do: I built a tool to automate the process.

I created a simple web app that allowed users to submit a CSV file and they would receive the HTML markup for the corresponding table, ensuring proper headings and structure were always in place.

Using what was available at the time — jQuery, a jQuery CSV plugin, Bootstrap, and Grunt — I built a tool that would do just that. It was small, straightforward, and effective.

Fast forward many years later.

Just recently, an email arrived in my inbox. A user reached out simply to say thanks, mentioning they still use my little app regularly to update their university website. I had forgotten all about this little app, so I went back to visit it. There it was, my modest creation, quietly doing exactly what it had been built to do all those years ago.

My first instinct, as a developer, was immediate and familiar: "I could rewrite this using more modern tooling and design. These tools are quite dated." I began mentally mapping out the rebuild. Then, I paused.

Why?

This app, untouched and unchanged for ten years, was doing precisely what it was meant to do. The user didn't ask for improvements or new features. They simply said, "It works."

In software — and perhaps in life — we often find ourselves tempted to rebuild, rewrite, and refactor. We're attracted to shiny new frameworks and modern libraries, convinced they will make something inherently better. Sometimes, that's true. But often, it's just our desire to refresh the familiar for the sake of novelty.

Time is precious. Refactoring the app would surely make it look nicer under the hood, but would it truly add value to the user who has found reliability in its simplicity? Probably not.

Just because we can make something new doesn't always mean we should. Real value often lies in stability, simplicity, and longevity—not novelty.

Sometimes, the most profound upgrade we can make is choosing to leave things exactly as they are.

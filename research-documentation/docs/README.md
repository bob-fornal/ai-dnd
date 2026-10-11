# Bob's Notes

## Phase 1

This all started with my Chat Application that was my first real application built with Agentic AI. I built out a massive `PRD.md` file (series of files) over about 6 weeks, before a single line of code was written. This led to experimentation in documentation, skills, and agent development.

## Phase 2

I read about Cloudflare's Agentic AI Browser (returns JSON or Markdown).

## Phase 3

I dove into what tools Cloudflare has available, starting with Worker AI and exploring the various models. A part of my mental model that this point was to explore implementation of AI within products, but to look into reduction of cost when working with Agentic AI.

## Phase 4

I started an [AI Tooling and Languages](https://github.com/bob-fornal/ai-tooling-and-languages) research project. The intent here is to see what I can build that's Agentic AI First in its implementation.

I noticed that it was improving token usage significantly by simply modifying the documentation. These numbers are on the order of 60-70% improvements.

## Phase 5

I've also realized that we need to start looking at the SDLC differently. I've been considering how I can look at an open PR's code.

* As a developer, it's great to see what changes and where it can be improved.
* **As someone that's been a Quality Assurance Developer and Quality Engineer**, I realized that I can use this information to generate a plan for what to watch for: manual testing, smoke testing, and automated testing that should be implemented or integrated based on the code changes. A lot of this information is often not in the work card.

## Phase 6

I recently had a Coffee Chat with **[Brandon Birk](https://www.linkedin.com/in/brandon-birk/)** about legacy repositories versus greenfield projects when it comes to Agentic AI implementation, he said something along the lines of:

> "The size of the project definitely comes into play at times. I've seen the tooling get lost and have to rebuild the context as it gets deeper into the component structure." - **[Brandon Birk](https://www.linkedin.com/in/brandon-birk/)**

This struck a chord.

In **[Phase 4](#phase-4)**, I started to think about not just AI First but also generating things that are **AI Centric**. The question in my head then became:

> "Up to this point, the documentation that we shove into a `docs` folder is created for us, not AI LLMs. Can we change the architecture of documentation to make reading and obtaining context more useful and more efficient." - Me
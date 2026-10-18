# Elite Rank Farm Navigator — website

**English** · [Русский](README.ru.md)

The website of **[Elite Dangerous Rank Farm Navigator](https://frtvt.com/elite)**
— it picks stations for farming Imperial and Federal Navy ranks: which
stations within your jump range give missions for the faction you need,
where to fly next with the missions you already have, and how far each
target is in jumps.

Your position, ship and ranks come from the companion
**[agent](https://github.com/furtivite/elite-rank-farm-agent)** — a small
Windows program that reads the game journal while you play.

## What is here and what is not

This repository is the **frontend**: the pages, the interface and everything
the browser computes — station ranking, search across the galaxy snapshot,
jump estimates, the mission basket.

Not here:

- **the server** — the API that accepts the agent's data, accounts and the
  galaxy database;
- **the galaxy snapshot** — the systems, stations and factions the site
  searches. It is built by the server and is not published.

So a local build shows the interface, but without the server there is no
sign-in, no commander data and nothing to search: the pages show their
empty and error states.

## Running it

You need [Node.js](https://nodejs.org) 24.

```text
npm ci
npm run dev
```

Checks, the same as in CI:

```text
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

`npm run build` makes a static site in `out/` — there is no Node.js server
at runtime. To publish it under a sub-path, set `NEXT_PUBLIC_BASE_PATH`,
for example `NEXT_PUBLIC_BASE_PATH=/elite npm run build`.

## How the code is organised

- **Next.js** (App Router, static export), **React**, **TypeScript** in strict
  mode, **Tailwind CSS**.
- **[Feature-Sliced Design](https://feature-sliced.design)**: layers
  `app → views (pages) → widgets → features → entities → shared`, a lower
  layer never imports a higher one. The pages layer is called `views` so
  that Next.js does not take it for the Pages Router.
- The interface is in **English and Russian**; texts live in the
  dictionaries in `src/shared/lib/i18n`.
- `contracts/` holds the JSON schemas of the data exchanged with the agent
  and the server; the tests check the code against them.
- Commits follow **[Conventional Commits](https://www.conventionalcommits.org)**.

## License

Copyright 2026 Egor Levchenko. Licensed under the
[Apache License 2.0](LICENSE); see also [NOTICE](NOTICE). Third-party data
used in the code is listed in [THIRD-PARTY.md](THIRD-PARTY.md) — it keeps its
own terms.

## Legal notice

Unofficial fan project. Not affiliated with or endorsed by Frontier
Developments plc. Elite Dangerous and related materials are the property of
their respective owners. The images were made for this project; no game
logos are used.

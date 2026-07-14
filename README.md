# WaniKani Reading Marathon Stats

A statistics explorer for the WaniKani community's 24-hour reading marathons, now organized by **soggyboy** on the WaniKani forums (originally started by **taiyousea**).

## What is the 24-hour Readathon?

The **24-hour Readathon** is a community event where participants attempt to read as much Japanese as they can within a 24-hour period. Participants track pages, characters, or time spent reading, then report their final numbers to the community. These stats are tallied together to celebrate what we can accomplish as a group!

Whether you're finishing a book club pick or just squeezing in a few pages, every contribution boosts the collective totals.

## Features

- Search for any participant to see their marathon history
- Shareable profile URLs (`?user=username`)
- Customizable achievement card — accent colors, seasonal GIF backgrounds, English/Japanese formatting
- Optional pages ↔ characters conversion for mixed tracking styles
- Download or copy the achievement card image; copy a shareable profile link
- Progress charts across marathons
- Preferences saved in your browser between visits

## Links

- [Winter 2025 Readathon Thread](https://community.wanikani.com/t/winter-solstice-24-hour-readathon-results-out/72793)
- [WaniKani Community Forums](https://community.wanikani.com/)

## Running Locally

Install dependencies and start the Vite dev server:

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (typically `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## Quality checks

```bash
npm run lint        # ESLint (TypeScript, React Hooks, JSX a11y)
npm run typecheck   # TypeScript without emit
npm run test        # Vitest unit tests
npm run ci          # lint + typecheck + test + build
```

GitHub Actions runs the same checks on pushes and pull requests to `main` / `master`.

## Data

Stats are manually recalculated by **GolyBidoof** from participant reports in each marathon thread.

When updating stats, also set the date in `data_meta.json`:

```json
{
  "lastUpdated": "2026-07-14"
}
```

## Credits

- **soggyboy** – Current organizer of the marathon
- **taiyousea** – Original host who started the tradition
- **GolyBidoof** – Frontend & data curation

The React/TypeScript rewrite was assisted by **Gemini 3.5 Flash**, **Gemini 3.5 Pro**, and **Auto** (an AI coding assistant). All changes were reviewed and curated by GolyBidoof.

## License

MIT

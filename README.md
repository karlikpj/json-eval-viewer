# JSON Eval Viewer

JSON Eval Viewer is a lightweight frontend for exploring exported DeepEval JSON results in a cleaner, more readable format.

Drop in an exported eval JSON file and the app generates an interactive view of the run. From there, you can filter cases by `All`, `Pass`, or `Fail`, then select an individual case to inspect its metrics, extracted fields, and actual-vs-expected output in more detail.

## Features

- Drag-and-drop or click-to-upload support for exported DeepEval JSON files
- Interactive pass/fail summary for the full eval run
- Case filtering by `All`, `Pass`, and `Fail`
- Detailed per-case inspection view
- Field-by-field actual vs. expected comparison
- Quick review of metrics and endpoint data without reading raw JSON directly

## Tech Stack

- React
- TypeScript
- Vite
- CSS Modules
- GitHub Actions + GitHub Pages for deployment

## Local Development

```bash
npm install
npm run dev
```

To create a production build:

```bash
npm run build
```

## Deployment

This repo is configured for GitHub Pages via GitHub Actions.

To publish successfully, the repository must have GitHub Pages enabled under:

`Settings -> Pages -> Build and deployment -> Source -> GitHub Actions`


<table><tr><td>
<img src=screenshot1.png width=240>
</td><td>
<img src=screenshot2.png width=240>
</td></tr></table>

*This is still an evolving internal tool and may change as the eval workflow grows.*

# Codex code-review and implementation handoff

**This file is a handoff for an independently launched Codex session. Codex was not invoked from the originating ChatGPT environment.**

You are reviewing a production-targeted Arabic RTL weather portal: **Climate Planet V6**. Do not claim production readiness until the validation gates pass.

## User acceptance criteria

- Keep existing V5 published content (CMS Markdown articles, Jerusalem winter archive, cosmos encyclopedia) without overwriting user changes.
- Remove public sticker gallery / general poster studio and geology game completely.
- Only keep city/day forecast cards with no confusion between current readings and future daily predictions.
- Support stylized city-specific scenes for every city; do not represent procedural illustrations as verified individual landmarks.
- Keep exactly two playable touch-friendly science games. Validate mobile controls, pause, and 38-question bank.
- Produce real map overlays only from attributed model field data. Fail closed if no trusted GCP calibration, bad units, wrong GRIB run/step or wrong rain accumulation window.
- Preserve user-provided Europe and Levant relief basemaps and correct ocean mask.
- Publish with the existing GitHub → Cloudflare Workers workflow; never expose CMS credentials in public assets.

## Review priority

1. `tools/publish_gfs.py` + `tools/render_map.py`: check CFGRIB metadata access, UTC date/cycle and precipitation interval, memory and GRIB source licensing; run on a real NOAA file **only after** valid calibration files are supplied.
2. `site/assets/daily-card-v6.js` and `city-scenes-v6.js`: prevent XSS, Canvas taint, incorrect date labels, cache bugs; export Chrome Android PNG.
3. `site/assets/games-v6.js` and `questions-v6.js`: two games, realistic enough graphics but performant on mobile; correctness of teaching cases.
4. `site/sw.js`: no obsolete assets, no cached false live forecasts.
5. Maintain SEO, CSP if deployed, `prefers-reduced-motion`, keyboard support, and accessible labels.

## Run commands

```bash
npm run build:offline
npm test
python tests/test_map_engine.py
python tests/browser-v6-offline.py
```

Before merge: inspect diff on a `v6-review` branch, retain user-authored content, and run live smoke tests on an actual Cloudflare preview deployment. Avoid inventing NOAA/ECMWF outputs. For map automation, capture authentic calibration anchors from the two source basemap images and verify coastline alignment independently.

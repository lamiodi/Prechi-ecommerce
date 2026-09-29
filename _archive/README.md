# Archive — 2026-09 pre-launch audit

Files moved out of the active codebase by the September 2026 pre-launch audit.
Nothing here is imported by the app anymore; the folders are kept for reference
only and can be deleted once the next release ships cleanly.

- `frontend-src/` — orphaned components/utilities/styles never imported by the
  app (`ChangeLocation`, `GuestCheckoutModal`, `AdminExchangeRate`,
  `circular-gallery-2` (imports a non-existent `.tsx`), `cartUtils.js` (stale
  cart key), `App.css`, `LocationPopup.css`, unrouted `Home.jsx`).
- `frontend-src/public-products/` — 14 MB of dev sample product images with
  `info.md` notes; the live catalog is served from Cloudinary.
- `backend/` — unmounted `routes/exchange-rate.js` (also imported a middleware
  file that does not exist), one-off dev/DB scripts that lived in
  `Backend/scripts/`, and ad-hoc `Backend/tests/*.js` scripts.
- `root-scripts/` — one-off data-seeding/migration scripts and SQL snippets from
  earlier development iterations.
- `scratch/` — scratch experiments.

If something here is ever needed again, restore it with
`git mv _archive/2026-09-audit/<path> <original-path>`.

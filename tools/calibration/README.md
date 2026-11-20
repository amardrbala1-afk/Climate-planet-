# V7 georeferencing — owner-supplied world files

The active images are `site/images/maps/europe-base.webp` (4500×5625) and `site/images/maps/levant-base.webp` (3240×4050). Their exact pixel alignment is set by `tools/georef/europe.pgw` and `tools/georef/levant.pgw`, extracted from user-provided ZIPs.

**Important:** `.pgw` does not encode CRS. This project explicitly assumes EPSG:3857 after checking image extents and visible geography, with independent city-position tests. Confirm the map's original CRS in QGIS for any surveying applications.

The former GCP (`--calibration`) is retained as a legacy fallback only when no world file is present. For V7 there is no need to manually pick new reference points.

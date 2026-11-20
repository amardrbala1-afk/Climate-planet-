# Required before map publication

`europe.json` and `levant.json` are deliberately **NOT** fabricated. Use the
existing `site/tools/map-calibration.html` tool with known coordinate control
points. A file must include its original image dimensions and at least 4 GCPs;
for scientific publication use 10–15 GCPs spread across land and coastlines.
An example *schema only* is:

```json
{"imageWidth":3704,"imageHeight":2706,"anchors":[
  {"x":123,"y":456,"lat":45.12,"lon":12.34}
]}
```

These example coordinate values are NOT real anchors; do not copy them.
The renderer calculates calibration residuals; error thresholds and an
independent visual coastline check remain required. Until then the website
correctly shows an empty numerical-map catalog, not a fake forecast.

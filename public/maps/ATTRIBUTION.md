# Geographic basemap provenance

## Street tiles

Map data © OpenStreetMap contributors: https://www.openstreetmap.org/copyright
Tiles are requested by the user's browser from https://tile.openstreetmap.org/{z}/{x}/{y}.png.
Usage policy: https://operations.osmfoundation.org/policies/tiles/
Only normal viewport tile requests are made. No bulk downloads, prefetch jobs, tile archives or cache bypasses are implemented. Street tile availability is best-effort. Attribution is always visible while this layer is enabled.

## Bundled outline

`land.geojson`: Natural Earth 1:110m land polygons, downloaded 05 October 2026.
Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson
Terms: https://www.naturalearthdata.com/about/terms-of-use/
Natural Earth data is public domain. Original geometry is bundled unchanged; runtime rendering applies a custom palette.
City names and coordinates are geographic reference labels, not operational locations.

## Operational layers

The geographic map contains no aircraft telemetry, actual mission assignments, government weather observations or real airspace clearances. Clean mode has no operational overlays. Optional demo locations use explicitly synthetic placements derived from the seed's schematic coordinates. They must not be interpreted as real facilities. Sample route geometry is illustrative, not flight navigation guidance.

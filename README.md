# geoconnex-client-ts

This repository contains a typescript client for fetching geojson features from Geoconnex. It does this by fetching data from a geoparquet version of the Geoconnex graph. This is since many SPARQL implementations don't support lazy geospatial queries. For linked data queries, it is recommended to use SPARQL directly as described in the [Geoconnex docs](https://docs.geoconnex.us/)

## Quickstart

```ts
const client = new GeoconnexClient();
const long_island_bbox = [-73.2, 40.5, -73, 41] as [number, number, number, number];
const fc = await client.get_features_inside_bbox(long_island_bbox);
```
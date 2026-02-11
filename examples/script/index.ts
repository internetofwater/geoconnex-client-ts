import { GeoconnexClient } from "../../src";

const client = new GeoconnexClient();
const long_island_bbox = [-73.2, 40.5, -73, 41] as [
  number,
  number,
  number,
  number,
];
const fc = await client.get_features_inside_bbox(long_island_bbox);
console.log(fc);
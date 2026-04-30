/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeoconnexClient } from "../../src";

const client = new GeoconnexClient();
const long_island_bbox = [-73.2, 40.5, -73, 41] as [
  number,
  number,
  number,
  number,
];
const fc = await client.get_features({bbox: long_island_bbox});
console.log("Loaded", fc.features.length, "features");
console.log("First feature:", fc.features[0]);
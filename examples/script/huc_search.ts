/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeoconnexClient } from "../../src";

const client = new GeoconnexClient();

const data = await client.get_features({
  geoconnex_sitemap_in: [
    "ref_hu02_hu02__0",
    "ref_hu04_hu04__0",
  ],
  feature_name_ilike: {
    key: "lakes",
    glob_before: true,
    glob_after: true,
  },
  limit: 10,
});

console.log(data)
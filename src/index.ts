/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FeatureCollection, Geometry, BBox } from "geojson";

export interface GeoconnexRetrievalOptions {
  bbox?: BBox; // standard OGC bbox param; this is an intersection, not a contains
  limit?: number;
  geoconnex_sitemap_filter?: string;
  feature_name_ilike?: {
    key: string;
    glob_before: boolean;
    glob_after: boolean;
  };
  inside_wkt?: string;
}

export class GeoconnexClient {
  base_url: string;
  items_url: string;

  constructor() {
    this.base_url =
      "https://features.geoconnex.us/collections/GeoconnexFeatures";
    this.items_url = `${this.base_url}/items`;
  }

  #validate_bbox(bbox: BBox): [number, number, number, number] {
    if (bbox.length !== 4) throw new Error("bbox must be length 4");
    if (bbox[0] > bbox[2]) throw new Error("xmin must be <= xmax");
    if (bbox[1] > bbox[3]) throw new Error("ymin must be <= ymax");
    return bbox;
  }

  #bbox_to_string([xmin, ymin, xmax, ymax]: BBox): string {
    return `${xmin},${ymin},${xmax},${ymax}`;
  }

  #build_cql(options: GeoconnexRetrievalOptions): string | undefined {
    const clauses: string[] = [];

    if (options.inside_wkt) {
      clauses.push(`CONTAINS(${options.inside_wkt}, geometry)`);
    }

    if (options.feature_name_ilike) {
      let cql_filter = "feature_name ILIKE ";
      if (options.feature_name_ilike.glob_before) {
        cql_filter += "'%";
      } else {
        cql_filter += '\'';
      }
      cql_filter += `${options.feature_name_ilike.key}`;
      if (options.feature_name_ilike.glob_after) {
        cql_filter += "%'";
      } else {
        cql_filter += "'";
      }
      clauses.push(cql_filter);
    }

    if (clauses.length === 0) return undefined;

    return clauses.join(" AND ");
  }

  #build_url(
    options: GeoconnexRetrievalOptions = {},
    item_id?: string,
  ): string {
    const params = new URLSearchParams();

    if (options.bbox) {
      const bbox = this.#validate_bbox(options.bbox);
      params.set("bbox", this.#bbox_to_string(bbox));
    }

    if (options.limit) {
      params.set("limit", String(options.limit));
    }

    if (options.geoconnex_sitemap_filter) {
      params.set("geoconnex_sitemap_filter", options.geoconnex_sitemap_filter);
    }

    const cql = this.#build_cql(options);
    if (cql) {
      params.set("filter", cql);
    }

    if (item_id) {
      return `${this.items_url}/${item_id}?${params.toString()}`;
    }

    return `${this.items_url}?${params.toString()}`;
  }

  async #fetch_json(url: string): Promise<FeatureCollection<Geometry>> {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }

  async get_features(
    options: GeoconnexRetrievalOptions = {},
  ): Promise<FeatureCollection<Geometry>> {
    const url = this.#build_url(options);
    return this.#fetch_json(url);
  }

  async get_feature(
    item_id: string,
    options: GeoconnexRetrievalOptions = {},
  ): Promise<FeatureCollection<Geometry>> {
    const url = this.#build_url(options, item_id);
    return this.#fetch_json(url);
  }
}


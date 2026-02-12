/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  asyncBufferFromUrl,
  cachedAsyncBuffer,
  parquetQuery,
  type AsyncBuffer,
} from "hyparquet";
import { compressors } from "hyparquet-compressors";
import type { FeatureCollection, Geometry, Feature, BBox } from "geojson";

export type GeoconnexColumnName =
  | "id"
  | "geometry"
  | "bbox"
  | "geoconnex_sitemap";

export type GeoconnexClientOptions = {
  cache?: boolean;
};

/**
 * A client for fetching geojson features from geoconnex
 */
export class GeoconnexClient {
  /** Base URL for fetching geoconnex features */
  base_url: string;
  /** Buffer containing geoconnex features */
  #buffer?: AsyncBuffer;
  /** Cached buffer containing geoconnex features */
  #cache?: AsyncBuffer;
  /** Options for the client */
  options: GeoconnexClientOptions;

  constructor(options: GeoconnexClientOptions = {}) {
    this.options = options;
    this.base_url =
      "https://storage.googleapis.com/metadata-geoconnex-us/exports/geoconnex_features.parquet";
  }

  /** Initialize the buffer for fetching */
  async #init_buffer() {
    if (!this.#buffer) {
      this.#buffer = await asyncBufferFromUrl({ url: this.base_url });
    }
    if (this.options.cache && !this.#cache) {
      this.#cache = cachedAsyncBuffer(this.#buffer);
      return this.#cache;
    } else {
      return this.#buffer;
    }
  }

  /** Validate the bbox */
  #validate_bbox(bbox: BBox): [number, number, number, number] {
    if (bbox.length != 4) {
      throw new Error("bbox must be length 4");
    }
    if (bbox[0] > bbox[2]) {
      throw new Error("bbox[0], xmin must be less than bbox[2], xmax");
    }
    if (bbox[1] > bbox[3]) {
      throw new Error("bbox[1], ymin must be less than bbox[3], ymax");
    }
    return bbox;
  }

  /**
   * Get all features in geoconnex that are completely within a bounding box
   * @param bbox [xmin, ymin, xmax, ymax]
   * @returns a feature collection of all features contained in the bbox
   */
  async get_features_inside_bbox(
    bbox: BBox,
    columns_to_fetch: GeoconnexColumnName[] = [
      "id",
      "geometry",
      "geoconnex_sitemap",
    ],
  ): Promise<FeatureCollection<Geometry>> {
    let buffer = await this.#init_buffer();

    const [xmin, ymin, xmax, ymax] = this.#validate_bbox(bbox);

    const rows = await parquetQuery({
      file: buffer,
      columns: columns_to_fetch,
      filter: {
        "bbox.xmin": { $gte: xmin },
        "bbox.xmax": { $lte: xmax },
        "bbox.ymin": { $gte: ymin },
        "bbox.ymax": { $lte: ymax },
      },
      compressors,
      geoparquet: true,
    });
    const features: Feature<Geometry>[] = rows.map((row: any) => {
      const properties: { geoconnex_sitemap?: string; id?: string } = {};

      // Only add geoconnex_sitemap if it was requested and exists in the row
      if (columns_to_fetch.includes("geoconnex_sitemap")) {
        properties.geoconnex_sitemap = row.geoconnex_sitemap;
      }

      if (columns_to_fetch.includes("id")) {
        properties.id = row.id;
      }

      return {
        type: "Feature",
        geometry: row.geometry,
        properties,
      };
    });

    return {
      type: "FeatureCollection",
      features,
      bbox,
    };
  }

  /**
   * Get all features in geoconnex that intersect a bounding box; NOTE: this may
   * return very large features representing administrative boundaries
   * @param bbox [xmin, ymin, xmax, ymax]
   * @returns a feature collection of all features contained in the bbox
   */
  async get_features_intersecting_bbox(
    bbox: BBox,
    columns_to_fetch: GeoconnexColumnName[] = ["id", "geometry", "geoconnex_sitemap"],
  ): Promise<FeatureCollection<Geometry>> {
    const buffer = await this.#init_buffer();

    const [xmin, ymin, xmax, ymax] = this.#validate_bbox(bbox);

    const rows = await parquetQuery({
      file: buffer,
      columns: columns_to_fetch,
      filter: {
        "bbox.xmin": { $lte: xmax },
        "bbox.xmax": { $gte: xmin },
        "bbox.ymin": { $lte: ymax },
        "bbox.ymax": { $gte: ymin },
      },
      compressors,
      geoparquet: true,
    });
    const features: Feature<Geometry>[] = rows.map((row: any) => {
      const properties: any = {};

      // Only add geoconnex_sitemap if it was requested and exists in the row
      if (columns_to_fetch.includes("geoconnex_sitemap")) {
        properties.geoconnex_sitemap = row.geoconnex_sitemap;
      }

      if (columns_to_fetch.includes("id")) {
        properties.id = row.id;
      }

      return {
        type: "Feature",
        geometry: row.geometry,
        properties,
      };
    });

    return {
      type: "FeatureCollection",
      features,
      bbox,
    };
  }
}

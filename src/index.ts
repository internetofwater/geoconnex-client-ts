import { asyncBufferFromUrl, parquetQuery, type AsyncBuffer } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import type { FeatureCollection, Geometry, Feature, BBox } from "geojson";

/**
 * A client for fetching geojson features from geoconnex
 */
export class GeoconnexClient {
  /** Base URL for fetching geoconnex features */
  base_url: string;
  /** Buffer containing geoconnex features */
  #buffer?: AsyncBuffer;

  constructor() {
    this.base_url =
      "https://storage.googleapis.com/metadata-geoconnex-us/exports/geoconnex_features.parquet";
  }

  /**
   * Get all features in geoconnex that are completely within a bounding box
   * @param bbox [xmin, ymin, xmax, ymax]
   * @returns a feature collection of all features contained in the bbox
   */
  async get_features_inside_bbox(bbox: BBox): Promise<FeatureCollection<Geometry>> {
    if (!this.#buffer) {
      this.#buffer = await asyncBufferFromUrl({ url: this.base_url });
    }
    if (bbox.length != 4) {
      throw new Error("bbox must be length 4");
    }
    if (bbox[0] > bbox[2]) {
      throw new Error("bbox[0], xmin must be less than bbox[2], xmax");
    }
    if (bbox[1] > bbox[3]) {
      throw new Error("bbox[1], ymin must be less than bbox[3], ymax");
    }

    const [xmin, ymin, xmax, ymax] = bbox;

    const rows = await parquetQuery({
      file: this.#buffer,
      columns: ["id", "geometry"],
      filter: {
        "bbox.xmin": { $gte: xmin, $lte: xmax },
        "bbox.ymin": { $gte: ymin, $lte: ymax },
      },
      compressors,
      geoparquet: true,
    });
    const features: Feature<Geometry>[] = rows.map((row: any) => ({
      type: "Feature",
      geometry: row.geometry,
      properties: {
        id: row.id,
      },
    }));

    return {
      type: "FeatureCollection",
      features,
      bbox
    };
  }

  /**
   * Get all features in geoconnex that intersect a bounding box; NOTE: this may
   * return very large features representing administrative boundaries
   * @param bbox [xmin, ymin, xmax, ymax]
   * @returns a feature collection of all features contained in the bbox
  */
  async get_features_intersecting_bbox(bbox: BBox): Promise<FeatureCollection<Geometry>> {
    if (!this.#buffer) {
      this.#buffer = await asyncBufferFromUrl({ url: this.base_url });
    }
    if (bbox.length != 4) {
      throw new Error("bbox must be length 4");
    }
    if (bbox[0] > bbox[2]) {
      throw new Error("bbox[0], xmin must be less than bbox[2], xmax");
    }
    if (bbox[1] > bbox[3]) {
      throw new Error("bbox[1], ymin must be less than bbox[3], ymax");
    }

    const [xmin, ymin, xmax, ymax] = bbox;

    const rows = await parquetQuery({
      file: this.#buffer,
      columns: ["id", "geometry"],
      filter: {
        "bbox.xmin": { $lte: xmax },
        "bbox.xmax": { $gte: xmin },
        "bbox.ymin": { $lte: ymax },
        "bbox.ymax": { $gte: ymin },
      },
      compressors,
      geoparquet: true,
    });
    const features: Feature<Geometry>[] = rows.map((row: any) => ({
      type: "Feature",
      geometry: row.geometry,
      properties: {
        id: row.id,
      },
    }));

    return {
      type: "FeatureCollection",
      features,
      bbox
    };
  }
}
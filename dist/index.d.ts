/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FeatureCollection, Geometry, BBox } from "geojson";
export type GeoconnexColumnName = "id" | "geometry" | "bbox" | "geoconnex_sitemap";
export type GeoconnexClientOptions = {
    cache?: boolean;
};
/**
 * A client for fetching geojson features from geoconnex
 */
export declare class GeoconnexClient {
    #private;
    /** Base URL for fetching geoconnex features */
    base_url: string;
    /** Options for the client */
    options: GeoconnexClientOptions;
    constructor(options?: GeoconnexClientOptions);
    /**
     * Get all features in geoconnex that are completely within a bounding box
     * @param bbox [xmin, ymin, xmax, ymax]
     * @returns a feature collection of all features contained in the bbox
     */
    get_features_inside_bbox(bbox: BBox, columns_to_fetch?: GeoconnexColumnName[]): Promise<FeatureCollection<Geometry>>;
    /**
     * Get all features in geoconnex that intersect a bounding box; NOTE: this may
     * return very large features representing administrative boundaries
     * @param bbox [xmin, ymin, xmax, ymax]
     * @returns a feature collection of all features contained in the bbox
     */
    get_features_intersecting_bbox(bbox: BBox, columns_to_fetch?: GeoconnexColumnName[]): Promise<FeatureCollection<Geometry>>;
}
//# sourceMappingURL=index.d.ts.map
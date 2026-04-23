/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FeatureCollection, Geometry, BBox } from "geojson";
export interface GeoconnexRetrievalOptions {
    bbox?: BBox;
    limit?: number;
    geoconnex_sitemap_filter?: string;
    feature_name_ilike?: {
        key: string;
        glob_before: boolean;
        glob_after: boolean;
    };
    inside_wkt?: string;
}
export declare class GeoconnexClient {
    #private;
    base_url: string;
    items_url: string;
    constructor();
    get_features(options?: GeoconnexRetrievalOptions): Promise<FeatureCollection<Geometry>>;
    get_feature(item_id: string, options?: GeoconnexRetrievalOptions): Promise<FeatureCollection<Geometry>>;
}
//# sourceMappingURL=index.d.ts.map
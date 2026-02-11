import type { FeatureCollection, Geometry, Feature, BBox, Point } from "geojson";
/**
 * A client for fetching geojson features from geoconnex
 */
export declare class GeoconnexClient {
    #private;
    /** Base URL for fetching geoconnex features */
    base_url: string;
    constructor();
    /**
     * Get all features in geoconnex that are completely within a bounding box
     * @param bbox [xmin, ymin, xmax, ymax]
     * @returns a feature collection of all features contained in the bbox
     */
    get_features_inside_bbox(bbox: BBox): Promise<FeatureCollection<Geometry>>;
    /**
     * Get all features in geoconnex that intersect a bounding box; NOTE: this may
     * return very large features representing administrative boundaries
     * @param bbox [xmin, ymin, xmax, ymax]
     * @returns a feature collection of all features contained in the bbox
     */
    get_features_intersecting_bbox(bbox: BBox): Promise<FeatureCollection<Geometry>>;
    get_catchment_with_mainstem_metadata_at_point(point: Point): Promise<Feature | null>;
}
//# sourceMappingURL=index.d.ts.map
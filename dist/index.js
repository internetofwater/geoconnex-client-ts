import { asyncBufferFromUrl, parquetQuery, } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import { deserialize } from "flatgeobuf/lib/mjs/geojson.js";
import * as turf from "@turf/turf";
/**
 * A client for fetching geojson features from geoconnex
 */
export class GeoconnexClient {
    /** Base URL for fetching geoconnex features */
    base_url;
    /** Buffer containing geoconnex features */
    #buffer;
    constructor() {
        this.base_url =
            "https://storage.googleapis.com/metadata-geoconnex-us/exports/geoconnex_features.parquet";
    }
    /**
     * Get all features in geoconnex that are completely within a bounding box
     * @param bbox [xmin, ymin, xmax, ymax]
     * @returns a feature collection of all features contained in the bbox
     */
    async get_features_inside_bbox(bbox) {
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
        const features = rows.map((row) => ({
            type: "Feature",
            geometry: row.geometry,
            properties: {
                id: row.id,
            },
        }));
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
    async get_features_intersecting_bbox(bbox) {
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
        const features = rows.map((row) => ({
            type: "Feature",
            geometry: row.geometry,
            properties: {
                id: row.id,
            },
        }));
        return {
            type: "FeatureCollection",
            features,
            bbox,
        };
    }
    async get_catchment_with_mainstem_metadata_at_point(point) {
        const BBOX_SIZE = 0.1;
        const lng = point.coordinates[0];
        const lat = point.coordinates[1];
        const minX = lng - BBOX_SIZE;
        const minY = lat - BBOX_SIZE;
        const maxX = lng + BBOX_SIZE;
        const maxY = lat + BBOX_SIZE;
        const url = "https://storage.googleapis.com/national-hydrologic-geospatial-fabric-reference-hydrofabric/reference_catchments_and_flowlines.fgb";
        const bboxRect = { minX, minY, maxX, maxY };
        console.log(url, bboxRect);
        const iter = deserialize(url, bboxRect);
        for await (const feature of iter) {
            console.log("test");
            if (turf.booleanContains(feature, turf.point([lng, lat]))) {
                return feature;
            }
        }
        return null;
    }
}

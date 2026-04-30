/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */
export class GeoconnexClient {
    base_url;
    items_url;
    constructor() {
        this.base_url =
            "https://features.geoconnex.us/collections/GeoconnexFeatures";
        this.items_url = `${this.base_url}/items`;
    }
    #validate_bbox(bbox) {
        if (bbox.length !== 4)
            throw new Error("bbox must be length 4");
        if (bbox[0] > bbox[2])
            throw new Error("xmin must be <= xmax");
        if (bbox[1] > bbox[3])
            throw new Error("ymin must be <= ymax");
        return bbox;
    }
    #bbox_to_string([xmin, ymin, xmax, ymax]) {
        return `${xmin},${ymin},${xmax},${ymax}`;
    }
    // Basic SQL/CQL string escaping
    #escape(value) {
        return value.replace(/'/g, "''");
    }
    #build_cql(options) {
        const clauses = [];
        if (options.inside_wkt) {
            clauses.push(`CONTAINS(${options.inside_wkt}, geometry)`);
        }
        // geoconnex_sitemap IN (...)
        if (options.geoconnex_sitemap_in?.length) {
            const values = options.geoconnex_sitemap_in
                .map((v) => `'${this.#escape(v)}'`)
                .join(",");
            clauses.push(`geoconnex_sitemap IN (${values})`);
        }
        if (options.feature_name_ilike) {
            const { key, glob_before, glob_after } = options.feature_name_ilike;
            let pattern = "'";
            if (glob_before)
                pattern += "%";
            pattern += this.#escape(key);
            if (glob_after)
                pattern += "%";
            pattern += "'";
            clauses.push(`feature_name ILIKE ${pattern}`);
        }
        if (clauses.length === 0)
            return undefined;
        return clauses.join(" AND ");
    }
    #build_url(options = {}, item_id) {
        const params = new URLSearchParams();
        if (options.bbox) {
            const bbox = this.#validate_bbox(options.bbox);
            params.set("bbox", this.#bbox_to_string(bbox));
        }
        if (options.limit) {
            params.set("limit", String(options.limit));
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
    async #fetch_json(url) {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Request failed: ${res.status} ${res.statusText}`);
        }
        return res.json();
    }
    async get_features(options = {}) {
        const url = this.#build_url(options);
        return this.#fetch_json(url);
    }
    async get_feature(item_id, options = {}) {
        const url = this.#build_url(options, item_id);
        return this.#fetch_json(url);
    }
}

/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import maplibregl from "maplibre-gl";
import { GeoconnexClient } from "../../src/index";
import * as turf from "@turf/turf";

const client = new GeoconnexClient();

const map = new maplibregl.Map({
  container: "map",
  style: "https://demotiles.maplibre.org/style.json",
  center: [-73.1, 40.95],
  zoom: 10,
});

/** ---------------------------
 * WKT helper (FIXED)
 * -------------------------- */
function boundsToWKT(bounds: maplibregl.LngLatBounds): string {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  // single-line, no whitespace issues
  return `POLYGON((${sw.lng} ${sw.lat},${ne.lng} ${sw.lat},${ne.lng} ${ne.lat},${sw.lng} ${ne.lat},${sw.lng} ${sw.lat}))`;
}

/** ---------------------------
 * Spinner
 * -------------------------- */
const loadingSpinner = document.createElement("div");
loadingSpinner.id = "loading-spinner";
loadingSpinner.innerHTML = `
  <div style="
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.9);
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 12px;
  ">
    <div style="
      border: 3px solid #f3f3f3;
      border-top: 3px solid #ff5500;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
    "></div>
    <span style="font-family: sans-serif; font-size: 14px;">Loading features...</span>
  </div>
  <style>
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
`;

/** ---------------------------
 * Load features
 * -------------------------- */
async function loadFeatures() {
  try {
    if (!loadingSpinner.parentNode) {
      map.getContainer().appendChild(loadingSpinner);
    }

    const bounds = map.getBounds();
    const wkt = boundsToWKT(bounds);

    console.log("WKT:", wkt); // debug

    const start = Date.now();

    const fc = await client.get_features({
      inside_wkt: wkt,
      feature_name_ilike: {
        "glob_after": true,
        "glob_before": true,
        "key": "college"
      },
      geoconnex_sitemap_filter: "bulk_gnis_gnis__0",
      limit: 100,
    });

    const end = Date.now();
    console.log(`Loaded ${fc.features.length} features in ${end - start}ms`);

    const source = map.getSource("geoconnex") as maplibregl.GeoJSONSource;

    if (source) {
      source.setData(fc);
    } else {
      map.addSource("geoconnex", { type: "geojson", data: fc });

      // Polygon fill
      map.addLayer({
        id: "geoconnex-fill",
        type: "fill",
        source: "geoconnex",
        paint: {
          "fill-color": "#ff5500",
          "fill-opacity": 0.3,
        },
        filter: ["==", "$type", "Polygon"],
      });

      // Polygon outline
      map.addLayer({
        id: "geoconnex-outline",
        type: "line",
        source: "geoconnex",
        paint: {
          "line-color": "#ff5500",
          "line-width": 2,
        },
        filter: ["==", "$type", "Polygon"],
      });

      // Lines
      map.addLayer({
        id: "geoconnex-lines",
        type: "line",
        source: "geoconnex",
        paint: {
          "line-color": "#ff5500",
          "line-width": 3,
        },
        filter: ["==", "$type", "LineString"],
      });

      // Points
      map.addLayer({
        id: "geoconnex-points",
        type: "circle",
        source: "geoconnex",
        paint: {
          "circle-radius": 6,
          "circle-color": "#ff5500",
        },
        filter: ["==", "$type", "Point"],
      });

      /** ---------------------------
       * Click handler
       * -------------------------- */
      const handleClick = (e: any) => {
        if (!e.features || e.features.length === 0) return;

        const feature = e.features[0];
        const featureId = feature.properties?.id || feature.id || "No ID";

        let coords = null;

        if (feature.geometry.type === "Point") {
          coords = feature.geometry.coordinates;
        } else if (feature.geometry.type === "LineString") {
          coords = turf.along(feature, turf.length(feature) / 2).geometry
            .coordinates;
        } else {
          coords = turf.centroid(feature).geometry.coordinates;
        }

        if (coords) {
          new maplibregl.Popup()
            .setLngLat(coords)
            .setHTML(
              `
              <strong>ID:</strong> ${featureId}<br/>
              <strong>Name:</strong> ${feature.properties?.feature_name || "N/A"}<br/>
              <strong>Sitemap:</strong> ${feature.properties?.geoconnex_sitemap || "N/A"}
            `,
            )
            .addTo(map);
        }
      };

      ["geoconnex-fill", "geoconnex-lines", "geoconnex-points"].forEach(
        (layer) => map.on("click", layer, handleClick),
      );

      // Cursor hover
      [
        "geoconnex-fill",
        "geoconnex-outline",
        "geoconnex-lines",
        "geoconnex-points",
      ].forEach((layer) => {
        map.on(
          "mouseenter",
          layer,
          () => (map.getCanvas().style.cursor = "pointer"),
        );
        map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
      });
    }
  } catch (error) {
    console.error("Error loading features:", error);
    alert("Failed to load features.");
  } finally {
    if (loadingSpinner.parentNode) {
      loadingSpinner.parentNode.removeChild(loadingSpinner);
    }
  }
}

/** ---------------------------
 * Init
 * -------------------------- */
map.on("load", () => {
  loadFeatures();
});

/** ---------------------------
 * Reload on move (debounced)
 * -------------------------- */
let timeout: number | undefined;

map.on("moveend", () => {
  if (timeout) clearTimeout(timeout);

  timeout = window.setTimeout(() => {
    loadFeatures();
  }, 300);
});

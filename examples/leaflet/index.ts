import L from "leaflet";
import { GeoconnexClient } from "../../src/index";
import * as turf from "@turf/turf";

/** ---------------------------
 * Client
 * -------------------------- */
const client = new GeoconnexClient();

/** ---------------------------
 * Map setup
 * -------------------------- */
const map = L.map("map").setView([40.95, -73.1], 10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://osm.org/copyright">OSM</a> contributors',
}).addTo(map);

let geoJsonLayer: L.GeoJSON | null = null;

/** ---------------------------
 * Spinner (safe)
 * -------------------------- */
function ensureSpinner(): HTMLElement {
  let el = document.getElementById("loading-spinner");

  if (!el) {
    el = document.createElement("div");
    el.id = "loading-spinner";
    el.style.display = "none";

    el.innerHTML = `
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
        <span style="font-family: sans-serif; font-size: 14px;">
          Loading features...
        </span>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    document.body.appendChild(el);
  }

  return el;
}

function showLoading() {
  ensureSpinner().style.display = "block";
}

function hideLoading() {
  ensureSpinner().style.display = "none";
}

/** ---------------------------
 * Helpers
 * -------------------------- */
function boundsToWKT(bounds: L.LatLngBounds): string {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  return `POLYGON((${sw.lng} ${sw.lat},${ne.lng} ${sw.lat},${ne.lng} ${ne.lat},${sw.lng} ${ne.lat},${sw.lng} ${sw.lat}))`;
}

/** ---------------------------
 * Load features
 * -------------------------- */
async function loadFeatures() {
  try {
    showLoading();

    const bounds = map.getBounds();
    const wkt = boundsToWKT(bounds);

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

    // Remove old layer
    if (geoJsonLayer) {
      geoJsonLayer.remove();
    }

    geoJsonLayer = L.geoJSON(fc, {
      style: (feature) => {
        const type = feature.geometry.type;

        if (type === "Polygon" || type === "MultiPolygon") {
          return {
            color: "#ff5500",
            weight: 2,
            fillColor: "#ff5500",
            fillOpacity: 0.3,
          };
        }

        if (type === "LineString" || type === "MultiLineString") {
          return {
            color: "#ff5500",
            weight: 3,
          };
        }

        return {};
      },

      pointToLayer: (_, latlng) =>
        L.circleMarker(latlng, {
          radius: 6,
          fillColor: "#ff5500",
          color: "#ff5500",
          weight: 1,
          fillOpacity: 1,
        }),

      onEachFeature: (feature, layer) => {
        layer.on("click", () => {
          let coords: [number, number] | null = null;
          const geom = feature.geometry;

          if (geom.type === "Point") {
            coords = [geom.coordinates[1], geom.coordinates[0]];
          } else if (geom.type === "LineString") {
            const mid = turf.along(feature, turf.length(feature) / 2).geometry
              .coordinates;
            coords = [mid[1], mid[0]];
          } else {
            const centroid = turf.centroid(feature).geometry.coordinates;
            coords = [centroid[1], centroid[0]];
          }

          if (coords) {
            L.popup()
              .setLatLng(coords)
              .setContent(`
                <strong>ID:</strong> ${feature.id || "N/A"}<br/>
                <strong>Name:</strong> ${feature.properties?.feature_name || "N/A"}<br/>
                <strong>Sitemap:</strong> ${feature.properties?.geoconnex_sitemap || "N/A"}
              `)
              .openOn(map);
          }
        });

        layer.on("mouseover", () => {
          const el = (layer as any).getElement?.();
          if (el) el.style.cursor = "pointer";
        });

        layer.on("mouseout", () => {
          const el = (layer as any).getElement?.();
          if (el) el.style.cursor = "";
        });
      },
    }).addTo(map);
  } catch (err) {
    console.error("Error loading features:", err);
    alert("Failed to load features.");
  } finally {
    hideLoading();
  }
}

/** ---------------------------
 * Init + map interaction
 * -------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  loadFeatures();
});

let timeout: number | undefined;

map.on("moveend", () => {
  if (timeout) clearTimeout(timeout);

  timeout = window.setTimeout(() => {
    loadFeatures();
  }, 300);
});
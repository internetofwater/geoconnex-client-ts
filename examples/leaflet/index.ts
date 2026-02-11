import L from "leaflet";
import { GeoconnexClient } from "../../src/index";
import * as turf from "@turf/turf";

const client = new GeoconnexClient();

// Create the Leaflet map
const map = L.map("map").setView([40.95, -73.1], 10);

// Add a tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://osm.org/copyright">OSM</a> contributors',
}).addTo(map);

// Create loading spinner element
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
document.body.appendChild(loadingSpinner);

(async () => {
  try {
    const long_island_bbox: [number, number, number, number] = [
      -73.2, 40.5, -73, 41,
    ];
    const start = Date.now();
    const fc = await client.get_features_inside_bbox(long_island_bbox);
    const end = Date.now();
    console.log(`Loaded ${fc.features.length} features in ${end - start}ms`);

    // Add GeoJSON features to the map
    const geoJsonLayer = L.geoJSON(fc, {
      style: (feature) => {
        if (
          feature.geometry.type === "Polygon" ||
          feature.geometry.type === "MultiPolygon"
        ) {
          return {
            color: "#ff5500",
            weight: 2,
            fillColor: "#ff5500",
            fillOpacity: 0.3,
          };
        } else if (
          feature.geometry.type === "LineString" ||
          feature.geometry.type === "MultiLineString"
        ) {
          return { color: "#ff5500", weight: 3 };
        }
        return {};
      },
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: 6,
          fillColor: "#ff5500",
          color: "#ff5500",
          weight: 1,
          fillOpacity: 1,
        });
      },
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
          } else if (geom.type === "Polygon" || geom.type === "MultiPolygon") {
            const centroid = turf.centroid(feature).geometry.coordinates;
            coords = [centroid[1], centroid[0]];
          } else if (geom.type === "MultiPoint") {
            coords = [geom.coordinates[0][1], geom.coordinates[0][0]];
          } else if (geom.type === "MultiLineString") {
            const centroid = turf.centroid(feature).geometry.coordinates;
            coords = [centroid[1], centroid[0]];
          }

          if (coords) {
            L.popup()
              .setLatLng(coords)
              .setContent(
                `<strong>ID:</strong> ${feature.properties?.id || feature.id || "No ID"}`,
              )
              .openOn(map);
          }
        });

        layer.on("mouseover", () =>
          layer.getElement()?.style.setProperty("cursor", "pointer"),
        );
        layer.on("mouseout", () =>
          layer.getElement()?.style.setProperty("cursor", ""),
        );
      },
    }).addTo(map);
  } catch (error) {
    console.error("Error loading features:", error);
    alert("Failed to load features. Please try again.");
  } finally {
    if (loadingSpinner.parentNode) {
      loadingSpinner.parentNode.removeChild(loadingSpinner);
    }
  }
})();

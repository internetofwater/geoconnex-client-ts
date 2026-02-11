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

map.on("load", async () => {
  // Show loading spinner
  map.getContainer().appendChild(loadingSpinner);

  try {
    const long_island_bbox = [-73.2, 40.9, -73, 41] as [number, number, number, number];
    const fc = await client.get_features_inside_bbox(long_island_bbox);

    // Add a source for all features
    map.addSource("geoconnex", { type: "geojson", data: fc });

    // Layer for polygons (fill)
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

    // Outline layer for polygons
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

    // Layer for LineStrings
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

    // Layer for points
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

    // Click handler for all geometry types
    const handleClick = (e: { features: string | any[]; }) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const featureId = feature.properties?.id || feature.id || "No ID";

      let coords = null;

      // Handle different geometry types
      if (feature.geometry.type === "Point") {
        coords = feature.geometry.coordinates;
      } else if (feature.geometry.type === "LineString") {
        // Use midpoint of line
        coords = turf.along(feature, turf.length(feature) / 2).geometry
          .coordinates;
      } else if (
        feature.geometry.type === "Polygon" ||
        feature.geometry.type === "MultiPolygon"
      ) {
        // Use centroid for polygons
        coords = turf.centroid(feature).geometry.coordinates;
      } else if (feature.geometry.type === "MultiPoint") {
        // Use first point of multipoint
        coords = feature.geometry.coordinates[0];
      } else if (feature.geometry.type === "MultiLineString") {
        // Use centroid of all lines
        coords = turf.centroid(feature).geometry.coordinates;
      }

      if (coords) {
        new maplibregl.Popup()
          .setLngLat(coords)
          .setHTML(`<strong>ID:</strong> ${featureId}`)
          .addTo(map);
      }
    };

    // Add click handlers to all layers
    ["geoconnex-fill", "geoconnex-lines", "geoconnex-points"].forEach(
      (layer) => {
        map.on("click", layer, handleClick);
      },
    );

    // Hover cursor for all layers
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
  } catch (error) {
    console.error("Error loading features:", error);
    alert("Failed to load features. Please try again.");
  } finally {
    // Remove loading spinner
    if (loadingSpinner.parentNode) {
      loadingSpinner.parentNode.removeChild(loadingSpinner);
    }
  }
});

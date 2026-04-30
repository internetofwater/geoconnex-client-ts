/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Minimal MapLibre + Geoconnex search example
 */
import maplibregl from "maplibre-gl";
import { GeoconnexClient } from "../../src/index";
const client = new GeoconnexClient();

const map = new maplibregl.Map({
  container: "map",
  style: "https://demotiles.maplibre.org/style.json",
  center: [-73.1, 40.95],
  zoom: 10,
});

function boundsToWKT(b: maplibregl.LngLatBounds): string {
  const sw = b.getSouthWest();
  const ne = b.getNorthEast();
  return `POLYGON((${sw.lng} ${sw.lat},${ne.lng} ${sw.lat},${ne.lng} ${ne.lat},${sw.lng} ${ne.lat},${sw.lng} ${sw.lat}))`;
}

let searchTerm = "";
const input = document.createElement("input");
input.placeholder = "Search name...";
input.style.cssText = `
  position:absolute;top:10px;left:10px;z-index:1;
  padding:6px;border-radius:4px;border:1px solid #ccc;
`;
map.getContainer().appendChild(input);

async function load() {
  const fc = await client.get_features({
    inside_wkt: boundsToWKT(map.getBounds()),
    feature_name_ilike: {
      glob_before: true,
      glob_after: true,
      key: searchTerm,
    },
    limit: 100,
  });
  const src = map.getSource("data") as maplibregl.GeoJSONSource;
  if (src) {
    src.setData(fc);
  } else {
    map.addSource("data", { type: "geojson", data: fc });
    map.addLayer({
      id: "points",
      type: "circle",
      source: "data",
      paint: { "circle-radius": 5, "circle-color": "#ff5500" },
      filter: ["==", "$type", "Point"],
    });
    map.addLayer({
      id: "lines",
      type: "line",
      source: "data",
      paint: { "line-width": 2, "line-color": "#ff5500" },
      filter: ["==", "$type", "LineString"],
    });
    map.addLayer({
      id: "polygons",
      type: "fill",
      source: "data",
      paint: { "fill-color": "#ff5500", "fill-opacity": 0.3 },
      filter: ["==", "$type", "Polygon"],
    });

    // Show feature id on click
    for (const layer of ["points", "lines", "polygons"]) {
      map.on("click", layer, (e) => {
        const feature = e.features?.[0];
        if (feature) {
          // Show feature id on click
          const popup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: false,
          });

          for (const layer of ["points", "lines", "polygons"]) {
            map.on("click", layer, (e) => {
              const feature = e.features?.[0];
              if (!feature) return;

              const id = feature.properties?.id ?? "(no id property)";
              popup
                .setLngLat(e.lngLat)
                .setHTML(`<strong>id:</strong> ${id}`)
                .addTo(map);
            });
            map.on("mouseenter", layer, () => {
              map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", layer, () => {
              map.getCanvas().style.cursor = "";
            });
          }
        }
      });
      map.on("mouseenter", layer, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layer, () => {
        map.getCanvas().style.cursor = "";
      });
    }
  }
}

/** ---------------------------
 * Events
 * -------------------------- */
// initial load
map.on("load", load);

// NOTE: auto-reload on map move intentionally removed

// reload on typing (debounced)
let t: number | undefined;
input.addEventListener("input", () => {
  clearTimeout(t);
  t = window.setTimeout(() => {
    searchTerm = input.value;
    load();
  }, 300);
});

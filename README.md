# geoconnex-client-ts

This package is a thin typescript wrapper around the [Geoconnex OGC API Features endpoint](https://features.geoconnex.us/collections/GeoconnexFeatures). It allows a user to filter any feature in the Geoconnex system by name, id, bbox, or geometry contained within. 

Since the OGC API Features endpoint supports CQL2, for maximum convenience you can also simply just query that endpoint directly. 

## Installing

```
npm i geoconnex-client-ts
```

## Intended Use Case

This service is intended to be used by applications that need access to Geoconnex Features in a lossless way or do text lookups for specific features. For example, for GIS analysis or hydrological modeling. If you simply want to power a map applcation, it is best to use the Geoconnex tiles export [here](https://storage.googleapis.com/metadata-geoconnex-us/exports/geoconnex_features.pmtiles) as that is more efficient and can simplify some of the otherwise complex geometries. 

## Examples

This package is used to power the playground for exploring Geoconnex Features here: https://docs.geoconnex.us/playground/features

A directory of other examples showing how to incorperate this client into a standalone script, leaflet, maplibre can be found in this repo [here](https://github.com/internetofwater/geoconnex-client-ts/tree/main/examples).
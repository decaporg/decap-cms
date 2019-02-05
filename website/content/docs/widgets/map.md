---
title: map
label: "Map"
---

The map widget allows you to edit spatial data using an interactive map. Spatial data is saved as a GeoJSON string in WGS84 projection and is limited to a single geometry.

- **Name:** `map`
- **UI:** interactive map
- **Data type:** GeoJSON string
- **Options:**
  - `decimals`: accepts a number to specify precision of saved coordinates; defaults to 7 decimals
  - `default`: accepts a GeoJSON string containing a single geometry; defaults to an empty string
  - `type`: accepts one string value of `Point`, `LineString` or `Polygon`; defaults to `Point`
- **Example:**
    ```yaml
    - {label: "Location", name: "location", widget: "map" }
    ```

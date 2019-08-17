---
title: date
label: "Date"
---

The date widget translates a date picker input to a date string. For saving date and time together, use the datetime widget.

- **Name:** `date`
- **UI:** date picker
- **Data type:** Moment.js-formatted date string
- **Options:**
  - `default`: accepts a date string, or an empty string to accept blank input; otherwise defaults to current date
  - `format`: optional; accepts Moment.js [tokens](https://momentjs.com/docs/#/parsing/string-format/); defaults to raw Date object (if supported by output format)
  - `dateFormat`: optional; boolean or Moment.js [tokens](https://momentjs.com/docs/#/parsing/string-format/). If `true` use default locale format.
  - `timeFormat`: optional; boolean or Moment.js [tokens](https://momentjs.com/docs/#/parsing/string-format/). If `true` use default locale format, `false` hides time-picker. Defaults to false.
- **Example:**
    ```yaml
    - label: "Birthdate"
      name: "birthdate"
      widget: "date"
      default: ""
      format: "MMM Do YY"
    ```

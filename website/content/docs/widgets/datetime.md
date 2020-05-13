---
title: datetime
label: "DateTime"
---

The datetime widget translates a datetime picker to a datetime string.

- **Name:** `datetime`
- **UI:** datetime picker
- **Data type:** Moment.js-formatted datetime string
- **Options:**
  - `default`: accepts a datetime string, or an empty string to accept blank input; otherwise defaults to current datetime
  - `format`: sets storage format; accepts Moment.js [tokens](https://momentjs.com/docs/#/parsing/string-format/); defaults to raw Date object (if supported by output format)
  - `dateFormat`: sets date display format in UI; boolean or Moment.js [tokens](https://momentjs.com/docs/#/parsing/string-format/). If `true` use default locale format.
  - `timeFormat`: sets time display format in UI; boolean or Moment.js [tokens](https://momentjs.com/docs/#/parsing/string-format/). If `true` use default locale format, `false` hides time-picker.
  - `pickerUtc`: _(default: `false`)_ when set to `true`, the datetime picker will display times in UTC. When `false`, the datetime picker will display times in the user's local timezone. When using date-only formats, it can be helpful to set this to `true` so users in all timezones will see the same date in the datetime picker.
- **Example:**
    ```yaml
    - label: "Start time"
      name: "start"
      widget: "datetime"
      default: ""
      dateFormat: "DD.MM.YYYY" # e.g. 24.12.2021
      timeFormat: "HH:mm" # e.g. 21:07
      format: "LLL"
      pickerUtc: false
    ```

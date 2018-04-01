---
label: "DateTime"
target: "datetime"
---

### DateTime

The datetime widget translates a datetime picker to a datetime string. For saving the date only, use the date widget.

- **Name:** `datetime`
- **UI:** datetime picker
- **Data type:** Moment.js-formatted datetime string
- **Options:**
  - `default`: accepts a datetime string, or an empty string to accept blank input; otherwise defaults to current datetime
  - `format`: accepts Moment.js [tokens](https://momentjs.com/docs/#/parsing/string-format/); defaults to ISO8601 format `YYYY-MM-DDTHH:mm:ssZ`
- **Example:**

  ```yaml
  - label: "Start time"
    name: "start"
    widget: "datetime"
    default: ""
    format: "LLL"
  ```

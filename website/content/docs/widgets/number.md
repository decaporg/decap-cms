---
label: "Number"
target: number
---

The number widget uses an HTML number input, saving the value as a string, integer, or floating point number.

- **Name:** `number`
- **UI:** HTML [number input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number)
- **Data type:** string by default; configured by `valueType` option
- **Options:**
  - `default`: accepts string or number value; defaults to empty string
  - `valueType`: accepts `int` or `float`; any other value results in saving as a string
  - `min`: accepts a number for minimum value accepted; unset by default
  - `max`: accepts a number for maximum value accepted; unset by default
- **Example:**
    ```yaml
    - label: "Puppy Count"
      name: "puppies"
      widget: "number"
      default: 2
      valueType: "int"
      min: 1
      max: 101
    ```

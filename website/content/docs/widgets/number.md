---
title: number
label: Number
description: >-
  The number widget uses an HTML number input, saving the value as a string,
  integer, or floating point number.
ui: >-
  HTML [number
  input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number)
data_type: string by default; configured by `valueType` option
options:
  - description: accepts string or number value; defaults to empty string
    name: default
  - description: accepts `int` or `float`; any other value results in saving as a string
    name: valueType
  - description: accepts a number for minimum value accepted; unset by default
    name: min
  - description: accepts a number for maximum value accepted; unset by default
    name: max
examples:
  - content: |-
      ```yaml
      - label: "Puppy Count"
        name: "puppies"
        widget: "number"
        default: 2
        valueType: "int"
        min: 1
        max: 101
      ```
---


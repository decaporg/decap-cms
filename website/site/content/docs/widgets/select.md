---
label: "Select"
target: "select"
type: "widget"
---

The select widget renders a select input with a dropdown containing all the options you specify for your field.

**Name:** select

**UI (renders as):** select input (dropdown)

**Data Type:** string

**Options:** 'options' containing a 'label' and a 'value' for each entry

### Example
```yaml
    - { label: "Category", name: category, widget: select, options: [{label: "News", value: "news"}, {label: "Articles", value: "articles"}, {label: "Case Studies", value: "case"}}
```
**Renders as:**
(image here)
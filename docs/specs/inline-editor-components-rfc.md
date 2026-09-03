# RFC: Inline Custom Components for Markdown Editor

- **Target Package**: `packages/decap-cms-widget-markdown`
- **Feature Type**: New Feature / Architecture Enhancement
- **Related Issues**: #5065 (Inline custom widgets), #2064 (MDX requirements)

---

## 1. Problem Statement

Currently, Decap CMS's `CMS.registerEditorComponent` assumes all registered components are **block-level**. When developers attempt to register inline syntaxes (such as Hugo Shortcodes `{{< ref >}}`, Obsidian `[[wikilink]]`, custom badges, or tags):

1. **Rich Text Formatting Breakdown**: The rich text editor (Slate) splits paragraphs and isolates inline elements into block nodes.
2. **Round-trip Serialization Errors**: Reverse serialization (`Slate -> MDAST -> Markdown`) causes `Sent invalid data to remark` errors or unintended line breaks and lost leading/trailing whitespace.
3. **Lack of Selection & Async Lifecycle**: No native mechanism to wrap selected text into an inline element asynchronously.

---

## 2. API Specification (`CMS.registerEditorComponent`)

Extend existing component registration with `type: 'inline'` and associated lifecycle functions:

```typescript
interface InlineEditorComponentOptions {
  id: string;                         // Unique identifier
  label: string;                      // Toolbar button label / tooltip
  type: 'inline';                     // Explicitly marks component as inline
  isVoid?: boolean;                   // Atomicity flag (default: true; non-editable content)
  trigger?: string;                   // Prefix character for Remark tokenizer optimization (e.g. '@', '[')
  
  // 1. Markdown Regex Parsing & Stringification
  pattern: RegExp;                    // Regular expression matching inline syntax (non-greedy recommended)
  fromInline: (match: RegExpExecArray) => Record<string, any>; // Parse matched regex into pure data object
  toInline: (data: Record<string, any>) => string;             // Serialize data object back to Markdown string
  
  // 2. Rich Text Visual Editor Rendering
  toPreview: (data: Record<string, any>) => React.ReactNode;
  
  // 3. Interactive & Async Lifecycles (Optional)
  onInsert?: (context: { 
    selectedText: string; 
    cmsContext: any;
  }) => Promise<Record<string, any> | null>; // Returns data object, or null to cancel insertion
  
  onEdit?: (context: { 
    data: Record<string, any>;
  }) => Promise<Record<string, any> | null>; // Triggered when existing node is clicked
}
```

---

## 3. Data Flow & Architecture

```
Markdown (Raw Source)
  │ ▲
  ▼ │  [Remark inlineTokenizer / MDAST Stringifier]
MDAST Inline Node (`type: 'inline-shortcode'`)
  │ ▲
  ▼ │  [remarkToSlate / slateToRemark]
Slate Inline Element (`inline: true`, `void: isVoid`)
  │ ▲
  ▼ │  [Slate Element Component]
Rich Text Visual DOM (Rendered via `toPreview`)
```

---

## 4. Implementation Phases

- [x] **Phase 1: Tokenizer & MDAST**
  - [x] Implement Remark `inlineTokenizer` supporting custom patterns.
  - [x] Validate bidirectional round-trip conversions (`Markdown <-> MDAST`) without character escaping or whitespace loss.
- [x] **Phase 2: Slate Integration**
  - [x] Register Slate Inline Node types (`isVoid: true/false`).
  - [x] Implement Slate element renderer with `contentEditable={false}` for void nodes.
- [x] **Phase 3: Interactive Events & Toolbar**
  - [x] Toolbar button click -> capture selection -> invoke `onInsert`.
  - [x] Support double-click/click on existing inline nodes to trigger `onEdit`.
- [x] **Phase 4: Tests & Documentation**
  - [x] Add unit tests for CJK characters and punctuation adjacent to inline elements.
  - [x] Add regex validation warning in development mode.

---

## 5. Scope & Future Work

- **Scope of this PR**: This implementation specifically targets `packages/decap-cms-widget-markdown`, the primary and default Markdown editor across Decap CMS.
- **Future Work**: Support for `packages/decap-cms-widget-richtext` (based on Plate.js) will be tracked and implemented in a separate follow-up PR to keep PR review focused and risk-contained.


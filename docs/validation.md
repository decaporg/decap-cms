# Collection Field Validation

## Available validations to use on config.yaml:

- Presence: By default all widgets are required, unless specified in the config. Example:
`- {label: "Subtitle", name: "subtitle", widget: "string", required: false}`

- Pattern: Field configuration can specify a regex pattern with the appropriate error message. Example:
`- {label: "Title", name: "title", widget: "string", pattern: [".{10,}", "Should have more than 10 characters"] }`


## Advanced Guide (For widget authors).

The widget control can optionally implement an `isValid` method to perform custom validations, in addition to presence and pattern. The `isValid` method will be automatically called, and it can return either a boolean value, an object with an error message or a promise. Examples:

**Boolean**
No errors:

```javascript
  isValid = () => {
    // Do internal validation
    return true;
  };
```

Existing error:

```javascript
  isValid = () => {
    // Do internal validation
    return false;
  };
```

**Object with `error` (Useful for returning custom error messages)**
Existing error:

```javascript
  isValid = () => {
    // Do internal validation
    return { error: 'Your error message.' };
  };
```

**Promise**
You can also return a promise from isValid. While the promise is pending, the widget will be marked as in error. When the promise resolves, the error is automatically cleared.

```javascript
  isValid = () => {
    return this.existingPromise;
  };
```

Note: Do not create a promise inside isValid - isValid is called right before trying to persist. This means that even if a previous promise was already resolved, when the user hits 'save', `isValid` will be called again - if it returns a new Promise it will be immediately marked as in error until the new promise resolves.

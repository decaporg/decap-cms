import React, { Component } from 'react';

import ValidationErrorTypes from '@/core/constants/validationErrorTypes';
import { getRemarkPlugins } from '@/core/lib/registry';

import type { StandardSchemaV1, StandardSchemaV1Result } from '@/lib/util/types/cms/standardSchema';
import type { TranslateFunction } from '@/ui/default/index';

// Local type definitions
interface ValidationError {
  type: string;
  parentIds?: string[] | undefined;
  message: string;
}

interface ValidationResult {
  error: ValidationError | false;
}

interface WidgetProps<T = unknown> {
  controlComponent: React.ComponentType<Record<string, unknown>>;
  field: Record<string, unknown>;
  hasActiveStyle?: boolean;
  setActiveStyle: () => void;
  setInactiveStyle: () => void;
  classNameWrapper: string;
  classNameWidget: string;
  classNameWidgetActive: string;
  classNameLabel: string;
  classNameLabelActive: string;
  value?: T;
  mediaPaths: Record<string, string>;
  metadata?: Record<string, Record<string, unknown>>;
  fieldsErrors?: Record<string, { type: string, message: string }[]>;
  onChange: ((value: T) => void) | ((value: T, metadata?: Record<string, unknown>) => void);
  onValidate?: (errors: (ValidationError | false)[]) => void;
  controlRef?: (wrappedControl: any) => void;
  onOpenMediaLibrary: (options: Record<string, unknown>) => void;
  onClearMediaControl: (controlID: string) => void;
  onRemoveMediaControl: (controlID: string) => void;
  onPersistMedia: (file: File) => void;
  onAddAsset: (asset: unknown) => void;
  onRemoveInsertedMedia: (controlID: string) => void;
  getAsset: (path: string, field: Record<string, unknown>) => unknown;
  resolveWidget: (name: string) => Record<string, unknown>;
  widget: Record<string, unknown>;
  isFetching?: boolean;
  query: (
    namespace: string,
    collectionName: string,
    searchFields: string[],
    searchTerm: string,
    file?: string,
    limit?: number,
  ) => void;
  clearSearch: () => void;
  clearFieldErrors: (uniqueFieldId: string) => void;
  queryHits?: unknown[] | Record<string, unknown>;
  editorControl: React.ComponentType<Record<string, unknown>>;
  uniqueFieldId: string;
  /** Whether this field currently has its own validation errors (not just
   * an errored descendant). Widgets use it to set `aria-invalid`. */
  hasErrors?: boolean;
  /** Id of the `<ul.ControlErrorsList>` rendered by `EditorControl`, when
   * `hasErrors` is true. Widgets point `aria-errormessage` at it. */
  errorListId?: string;
  /** Id of the `<ControlHint>` rendered by `EditorControl`, when the field
   * has a `hint`. Widgets point `aria-describedby` at it. */
  hintId?: string;
  loadEntry: (collectionName: string, slug: string) => void;
  onQuickCreateEntry?: (
    collectionName: string,
    data: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
  t: TranslateFunction;
  onValidateObject?: (errors: { type: string, message: string }[]) => void;
  isEditorComponent?: boolean;
  isNewEditorComponent?: boolean;
  entry: Record<string, unknown>;
  getEntry: () => Record<string, unknown>;
  isDisabled?: boolean;
  isFieldDuplicate?: (field: Record<string, unknown>) => boolean;
  isFieldHidden?: (field: Record<string, unknown>) => boolean;
  locale?: string;
  isParentListCollapsed?: boolean;
  isLoadingAsset?: boolean;
  parentIds?: string[];
  validateMetaField?: (
    field: Record<string, unknown>,
    value: unknown,
    t: TranslateFunction,
  ) => ValidationResult;
  collection?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

function truthy() {
  return { error: false };
}

export function isEmpty(value: unknown) {
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  return (
    value === null
    || value === undefined
    || (Object.prototype.hasOwnProperty.call(value, 'length')
      && (value as { length: number }).length === 0)
    || (typeof value === 'object'
      && value !== null
      && (value as object).constructor === Object
      && Object.keys(value as object).length === 0)
    || (Array.isArray(value) && value.length === 0)
  );
}

export default class Widget extends Component<WidgetProps> {
  innerWrappedControl: any;
  wrappedControlValid: () => unknown = truthy;
  wrappedControlShouldComponentUpdate: ((nextProps: WidgetProps) => boolean) | undefined;

  shouldComponentUpdate(nextProps: WidgetProps) {
    /**
     * Avoid unnecessary rerenders while loading assets.
     */
    if (this.props.isLoadingAsset && nextProps.isLoadingAsset) return false;
    /**
     * Allow widgets to provide their own `shouldComponentUpdate` method.
     */
    if (this.wrappedControlShouldComponentUpdate) {
      return this.wrappedControlShouldComponentUpdate(nextProps);
    }
    return (
      this.props.value !== nextProps.value
      || this.props.classNameWrapper !== nextProps.classNameWrapper
      || this.props.hasActiveStyle !== nextProps.hasActiveStyle
      // Re-render when validation errors change. Container widgets (object,
      // list) pass `fieldsErrors` to their children, so the reference
      // changing means a descendant's error state changed and we need to
      // propagate the new value.
      || this.props.fieldsErrors !== nextProps.fieldsErrors
      || this.props.hasErrors !== nextProps.hasErrors
      || this.props.errorListId !== nextProps.errorListId
      || this.props.hintId !== nextProps.hintId
      // A media library insert lands in `mediaPaths` (keyed by the file or
      // image control that opened the library), not in `value`. Upstream's
      // class-based file control re-rendered on it through its own
      // shouldComponentUpdate; the function component here has none, so the
      // chosen file never reached the field.
      || this.props.mediaPaths !== nextProps.mediaPaths
    );
  }

  processInnerControlRef = (ref: any) => {
    if (!ref) return;

    /**
     * If the widget is a container that receives state updates from the store,
     * we'll need to get the ref of the actual control via the `react-redux`
     * `getWrappedInstance` method. Note that connected widgets must pass
     * `withRef: true` to `connect` in the options object.
     */
    this.innerWrappedControl = ref.getWrappedInstance ? ref.getWrappedInstance() : ref;

    this.wrappedControlValid = this.innerWrappedControl.isValid || truthy;

    /**
     * Get the `shouldComponentUpdate` method from the wrapped control, and
     * provide the control instance is the `this` binding.
     */
    const { shouldComponentUpdate: scu } = this.innerWrappedControl;
    this.wrappedControlShouldComponentUpdate = scu && scu.bind(this.innerWrappedControl);
  };

  /**
   * Function-component widgets without `forwardRef` (e.g. StringControl,
   * TextControl) never trigger `processInnerControlRef`, so without this
   * mount-time registration the parent EditorControlPane / ObjectControl
   * never sees the Widget instance and silently skips its validation.
   */
  componentDidMount() {
    this.props.controlRef?.(this);
  }

  componentWillUnmount() {
    this.props.controlRef?.(null);
  }

  focus(path: string | string[]) {
    // Try widget's custom focus method first
    if (this.innerWrappedControl?.focus) {
      this.innerWrappedControl.focus(path);
    } else {
      // Fall back to focusing by ID for simple widgets
      const element = document.getElementById(this.props.uniqueFieldId);
      element?.focus();
    }
    // After focusing, ensure the element is visible
    const label = document.querySelector(`label[for="${this.props.uniqueFieldId}"]`);
    if (label) {
      label.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  getValidateValue = () => {
    let value = this.innerWrappedControl?.getValidateValue?.() || this.props.value;
    // Convert list/array input widget value to string for validation test
    if (Array.isArray(value)) value = value.join(',');
    return value;
  };

  // DCMS-458: a Standard Schema-compliant validator (zod/valibot/arktype/effect
  // Schema/...) set as `field.validate` takes over as the sole source of field
  // errors for this field, in place of the built-in required/pattern checks -
  // see `~standard.validate` at https://github.com/standard-schema/standard-schema.
  // Fields without `validate` are unaffected and keep running the checks below.
  getStandardSchema = (field: Record<string, unknown>): StandardSchemaV1<unknown, unknown> | undefined => {
    const schema = field.validate as StandardSchemaV1<unknown, unknown> | undefined;
    if (schema && schema['~standard'] && typeof schema['~standard'].validate === 'function') {
      return schema;
    }
    return undefined;
  };

  validateStandardSchema = (standardSchema: StandardSchemaV1<unknown, unknown>) => {
    const { t, field, parentIds } = this.props;
    const value = this.getValidateValue();
    const result = standardSchema['~standard'].validate(value);

    const applyResult = (resolved: StandardSchemaV1Result<unknown>) => {
      const issues = resolved && resolved.issues;
      if (!issues || issues.length === 0) {
        this.props.onValidate?.([]);
        return;
      }
      this.props.onValidate?.(
        issues.map(issue => ({
          type: ValidationErrorTypes.CUSTOM,
          parentIds,
          message: issue.message,
        })),
      );
    };

    if (result instanceof Promise) {
      // Surface a transient "processing" error while the async validator
      // resolves, mirroring `validateWrappedControl`'s async handling below.
      this.props.onValidate?.([
        {
          type: ValidationErrorTypes.CUSTOM,
          parentIds,
          message: t('editor.editorControlPane.widget.processing', {
            fieldLabel: (field.label || field.name) as string,
          }),
        },
      ]);
      result.then(applyResult, (err: unknown) => {
        this.props.onValidate?.([
          {
            type: ValidationErrorTypes.CUSTOM,
            parentIds,
            message: `${(field.label || field.name) as string} - ${err}.`,
          },
        ]);
      });
      return;
    }

    applyResult(result);
  };

  validate = (skipWrapped: ValidationResult | boolean = false) => {
    const field = this.props.field;

    const standardSchema = this.getStandardSchema(field);
    if (standardSchema) {
      this.validateStandardSchema(standardSchema);
      return;
    }

    const value = this.getValidateValue();
    const errors: (ValidationError | false)[] = [];
    const validations: ((
      field: Record<string, unknown>,
      value: unknown,
      t: TranslateFunction,
    ) => ValidationResult)[] = [this.validatePresence, this.validatePattern];
    if (field.meta) {
      if (this.props.validateMetaField) {
        validations.push(this.props.validateMetaField);
      }
    }
    validations.forEach(func => {
      const response = func(field, value, this.props.t);
      if (response.error) errors.push(response.error);
    });
    if (skipWrapped && typeof skipWrapped === 'object') {
      if (skipWrapped.error) errors.push(skipWrapped.error);
    } else if (!skipWrapped) {
      const wrappedError = this.validateWrappedControl(field);
      if (wrappedError.error) errors.push(wrappedError.error);
    }

    this.props.onValidate?.(errors);
  };

  validatePresence = (field: Record<string, unknown>, value: unknown): ValidationResult => {
    const { t, parentIds } = this.props;
    const isRequired = field.required ?? true;
    if (isRequired && isEmpty(value)) {
      const error: ValidationError = {
        type: ValidationErrorTypes.PRESENCE,
        parentIds,
        message: t('editor.editorControlPane.widget.required', {
          fieldLabel: (field.label || field.name) as string,
        }),
      };

      return { error };
    }
    return { error: false };
  };

  validatePattern = (field: Record<string, unknown>, value: unknown): ValidationResult => {
    const { t, parentIds } = this.props;
    const pattern = (field.pattern || false) as (string | RegExp)[] | false;

    if (isEmpty(value)) {
      return { error: false };
    }

    if (pattern && Array.isArray(pattern) && !RegExp(pattern[0]).test(value as string)) {
      const error: ValidationError = {
        type: ValidationErrorTypes.PATTERN,
        parentIds,
        message: t('editor.editorControlPane.widget.regexPattern', {
          fieldLabel: (field.label || field.name) as string,
          pattern: pattern[pattern.length - 1],
        }),
      };

      return { error };
    }

    return { error: false };
  };

  validateWrappedControl = (field: Record<string, unknown>): ValidationResult => {
    const { t, parentIds } = this.props;
    const response = this.wrappedControlValid();
    if (typeof response === 'boolean') {
      const isValid = response;
      return { error: !isValid as unknown as ValidationError | false };
    } else if (
      response
      && typeof response === 'object'
      && Object.prototype.hasOwnProperty.call(response, 'error')
    ) {
      return response as ValidationResult;
    } else if (response instanceof Promise) {
      response.then(
        () => {
          this.validate({ error: false });
        },
        (err: unknown) => {
          const error: ValidationError = {
            type: ValidationErrorTypes.CUSTOM,
            message: `${(field.label || field.name) as string} - ${err}.`,
          };

          this.validate({ error });
        },
      );

      const error: ValidationError = {
        type: ValidationErrorTypes.CUSTOM,
        parentIds,
        message: t('editor.editorControlPane.widget.processing', {
          fieldLabel: (field.label || field.name) as string,
        }),
      };

      return { error };
    }
    return { error: false };
  };

  /**
   * In case the `onChangeObject` function is frozen by a child widget implementation,
   * e.g. when debounced, always get the latest object value instead of using
   * `this.props.value` directly.
   */
  getObjectValue = () => (this.props.value || {}) as Record<string, unknown>;

  /**
   * Change handler for fields that are nested within another field.
   */
  onChangeObject = (
    field: Record<string, unknown>,
    newValue: unknown,
    newMetadata: Record<string, unknown> | undefined,
  ) => {
    const newObjectValue = {
      ...this.getObjectValue(),
      [field.name as string]: newValue,
    };
    return this.props.onChange(
      newObjectValue,
      newMetadata && { [this.props.field.name as string]: newMetadata },
    );
  };

  setInactiveStyle = () => {
    this.props.setInactiveStyle();
    if (this.props.field.pattern !== undefined && !isEmpty(this.getValidateValue())) {
      this.validate();
    }
  };

  render() {
    const {
      controlComponent,
      getEntry,
      collection,
      config,
      field,
      value,
      mediaPaths,
      metadata,
      onChange,
      onValidateObject,
      onOpenMediaLibrary,
      onRemoveMediaControl,
      onPersistMedia,
      onClearMediaControl,
      onAddAsset,
      onRemoveInsertedMedia,
      getAsset,
      classNameWrapper,
      classNameWidget,
      classNameWidgetActive,
      classNameLabel,
      classNameLabelActive,
      setActiveStyle,
      hasActiveStyle,
      editorControl,
      uniqueFieldId,
      hasErrors,
      errorListId,
      hintId,
      resolveWidget,
      widget,
      query,
      queryHits,
      clearSearch,
      clearFieldErrors,
      isFetching,
      loadEntry,
      onQuickCreateEntry,
      fieldsErrors,
      controlRef,
      isEditorComponent,
      isNewEditorComponent,
      parentIds,
      t,
      isDisabled,
      isFieldDuplicate,
      isFieldHidden,
      locale,
      isParentListCollapsed,
    } = this.props;

    return React.createElement(controlComponent as React.ComponentType<Record<string, unknown>>, {
      getEntry,
      collection,
      config,
      field,
      value,
      mediaPaths,
      metadata,
      onChange,
      onChangeObject: this.onChangeObject,
      onValidateObject,
      onOpenMediaLibrary,
      onClearMediaControl,
      onRemoveMediaControl,
      onPersistMedia,
      onAddAsset,
      onRemoveInsertedMedia,
      getAsset,
      forID: uniqueFieldId,
      hasErrors,
      errorListId,
      hintId,
      ref: this.processInnerControlRef,
      validate: this.validate,
      classNameWrapper,
      classNameWidget,
      classNameWidgetActive,
      classNameLabel,
      classNameLabelActive,
      setActiveStyle,
      setInactiveStyle: () => this.setInactiveStyle(),
      hasActiveStyle,
      editorControl,
      resolveWidget,
      widget,
      getRemarkPlugins,
      query,
      queryHits,
      clearSearch,
      clearFieldErrors,
      isFetching,
      loadEntry,
      onQuickCreateEntry,
      isEditorComponent,
      isNewEditorComponent,
      fieldsErrors,
      controlRef,
      parentIds,
      t,
      isDisabled,
      isFieldDuplicate,
      isFieldHidden,
      locale,
      isParentListCollapsed,
    });
  }
}

type Wi = typeof Widget;

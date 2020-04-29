import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Map, List } from 'immutable';
import { oneLine } from 'common-tags';
import ValidationErrorTypes from 'Constants/validationErrorTypes';

const truthy = () => ({ error: false });

const isEmpty = value =>
  value === null ||
  value === undefined ||
  (Object.prototype.hasOwnProperty.call(value, 'length') && value.length === 0) ||
  (value.constructor === Object && Object.keys(value).length === 0) ||
  (List.isList(value) && value.size === 0);

export default class Widget extends Component {
  static propTypes = {
    controlComponent: PropTypes.func.isRequired,
    field: ImmutablePropTypes.map.isRequired,
    hasActiveStyle: PropTypes.bool,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    classNameWidget: PropTypes.string.isRequired,
    classNameWidgetActive: PropTypes.string.isRequired,
    classNameLabel: PropTypes.string.isRequired,
    classNameLabelActive: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.object,
      PropTypes.string,
      PropTypes.bool,
    ]),
    mediaPaths: ImmutablePropTypes.map.isRequired,
    metadata: ImmutablePropTypes.map,
    fieldsErrors: ImmutablePropTypes.map,
    onChange: PropTypes.func.isRequired,
    onValidate: PropTypes.func,
    onOpenMediaLibrary: PropTypes.func.isRequired,
    onClearMediaControl: PropTypes.func.isRequired,
    onRemoveMediaControl: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveInsertedMedia: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
    resolveWidget: PropTypes.func.isRequired,
    widget: PropTypes.object.isRequired,
    getEditorComponents: PropTypes.func.isRequired,
    isFetching: PropTypes.bool,
    controlRef: PropTypes.func,
    query: PropTypes.func.isRequired,
    clearSearch: PropTypes.func.isRequired,
    clearFieldErrors: PropTypes.func.isRequired,
    queryHits: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    editorControl: PropTypes.func.isRequired,
    uniqueFieldId: PropTypes.string.isRequired,
    loadEntry: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    onValidateObject: PropTypes.func,
    isEditorComponent: PropTypes.bool,
    isNewEditorComponent: PropTypes.bool,
  };

  shouldComponentUpdate(nextProps) {
    /**
     * Allow widgets to provide their own `shouldComponentUpdate` method.
     */
    if (this.wrappedControlShouldComponentUpdate) {
      return this.wrappedControlShouldComponentUpdate(nextProps);
    }
    return (
      this.props.value !== nextProps.value ||
      this.props.classNameWrapper !== nextProps.classNameWrapper ||
      this.props.hasActiveStyle !== nextProps.hasActiveStyle
    );
  }

  processInnerControlRef = ref => {
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

  validate = (skipWrapped = false) => {
    let value = this.innerWrappedControl?.getValidateValue?.() || this.props.value;
    // Convert list input widget value to string for validation test
    List.isList(value) && (value = value.join(','));

    const field = this.props.field;
    const errors = [];
    const validations = [this.validatePresence, this.validatePattern];
    validations.forEach(func => {
      const response = func(field, value);
      if (response.error) errors.push(response.error);
    });
    if (skipWrapped) {
      if (skipWrapped.error) errors.push(skipWrapped.error);
    } else {
      const wrappedError = this.validateWrappedControl(field);
      if (wrappedError.error) errors.push(wrappedError.error);
    }
    this.props.onValidate(errors);
  };

  validatePresence = (field, value) => {
    const t = this.props.t;
    const isRequired = field.get('required', true);
    if (isRequired && isEmpty(value)) {
      const error = {
        type: ValidationErrorTypes.PRESENCE,
        message: t('editor.editorControlPane.widget.required', {
          fieldLabel: field.get('label', field.get('name')),
        }),
      };

      return { error };
    }
    return { error: false };
  };

  validatePattern = (field, value) => {
    const t = this.props.t;
    const pattern = field.get('pattern', false);

    if (isEmpty(value)) {
      return { error: false };
    }

    if (pattern && !RegExp(pattern.first()).test(value)) {
      const error = {
        type: ValidationErrorTypes.PATTERN,
        message: t('editor.editorControlPane.widget.regexPattern', {
          fieldLabel: field.get('label', field.get('name')),
          pattern: pattern.last(),
        }),
      };

      return { error };
    }

    return { error: false };
  };

  validateWrappedControl = field => {
    const t = this.props.t;
    if (typeof this.wrappedControlValid !== 'function') {
      throw new Error(oneLine`
        this.wrappedControlValid is not a function. Are you sure widget
        "${field.get('widget')}" is registered?
      `);
    }

    const response = this.wrappedControlValid();
    if (typeof response === 'boolean') {
      const isValid = response;
      return { error: !isValid };
    } else if (Object.prototype.hasOwnProperty.call(response, 'error')) {
      return response;
    } else if (response instanceof Promise) {
      response.then(
        () => {
          this.validate({ error: false });
        },
        err => {
          const error = {
            type: ValidationErrorTypes.CUSTOM,
            message: `${field.get('label', field.get('name'))} - ${err}.`,
          };

          this.validate({ error });
        },
      );

      const error = {
        type: ValidationErrorTypes.CUSTOM,
        message: t('editor.editorControlPane.widget.processing', {
          fieldLabel: field.get('label', field.get('name')),
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
  getObjectValue = () => this.props.value || Map();

  /**
   * Change handler for fields that are nested within another field.
   */
  onChangeObject = (fieldName, newValue, newMetadata) => {
    const newObjectValue = this.getObjectValue().set(fieldName, newValue);
    return this.props.onChange(
      newObjectValue,
      newMetadata && { [this.props.field.get('name')]: newMetadata },
    );
  };

  render() {
    const {
      controlComponent,
      entry,
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
      setInactiveStyle,
      hasActiveStyle,
      editorControl,
      uniqueFieldId,
      resolveWidget,
      widget,
      getEditorComponents,
      query,
      queryHits,
      clearSearch,
      clearFieldErrors,
      isFetching,
      loadEntry,
      fieldsErrors,
      controlRef,
      isEditorComponent,
      isNewEditorComponent,
      t,
    } = this.props;
    return React.createElement(controlComponent, {
      entry,
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
      onAddAsset,
      onRemoveInsertedMedia,
      getAsset,
      forID: uniqueFieldId,
      ref: this.processInnerControlRef,
      validate: this.validate,
      classNameWrapper,
      classNameWidget,
      classNameWidgetActive,
      classNameLabel,
      classNameLabelActive,
      setActiveStyle,
      setInactiveStyle,
      hasActiveStyle,
      editorControl,
      resolveWidget,
      widget,
      getEditorComponents,
      query,
      queryHits,
      clearSearch,
      clearFieldErrors,
      isFetching,
      loadEntry,
      isEditorComponent,
      isNewEditorComponent,
      fieldsErrors,
      controlRef,
      t,
    });
  }
}

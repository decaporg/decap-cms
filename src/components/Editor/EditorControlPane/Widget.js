import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ImmutablePropTypes from "react-immutable-proptypes";
import { Map } from 'immutable';
import ValidationErrorTypes from 'Constants/validationErrorTypes';

const truthy = () => ({ error: false });

const isEmpty = value => (
  value === null ||
  value === undefined ||
  (value.hasOwnProperty('length') && value.length === 0) ||
  (value.constructor === Object && Object.keys(value).length === 0)
);

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
    onChange: PropTypes.func.isRequired,
    onValidate: PropTypes.func,
    onOpenMediaLibrary: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveInsertedMedia: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
  };

  shouldComponentUpdate(nextProps) {
    /**
     * Allow widgets to provide their own `shouldComponentUpdate` method.
     */
    if (this.wrappedControlShouldComponentUpdate) {
      return this.wrappedControlShouldComponentUpdate(nextProps);
    }
    return this.props.value !== nextProps.value
      || this.props.classNameWrapper !== nextProps.classNameWrapper
      || this.props.hasActiveStyle !== nextProps.hasActiveStyle;
  }

  processInnerControlRef = ref => {
    if (!ref) return;

    /**
     * If the widget is a container that receives state updates from the store,
     * we'll need to get the ref of the actual control via the `react-redux`
     * `getWrappedInstance` method. Note that connected widgets must pass
     * `withRef: true` to `connect` in the options object.
     */
    const wrappedControl = ref.getWrappedInstance ? ref.getWrappedInstance() : ref;

    this.wrappedControlValid = wrappedControl.isValid || truthy;

    /**
     * Get the `shouldComponentUpdate` method from the wrapped control, and
     * provide the control instance is the `this` binding.
     */
    const { shouldComponentUpdate: scu } = wrappedControl;
    this.wrappedControlShouldComponentUpdate = scu && scu.bind(wrappedControl);
  };

  validate = (skipWrapped = false) => {
    const { field, value } = this.props;
    const errors = [];
    const validations = [this.validatePresence, this.validatePattern];
    validations.forEach((func) => {
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
    const isRequired = field.get('required', true);
    if (isRequired && isEmpty(value)) {
      const error = {
        type: ValidationErrorTypes.PRESENCE,
        message: `${ field.get('label', field.get('name')) } is required.`,
      };

      return { error };
    }
    return { error: false };
  };

  validatePattern = (field, value) => {
    const pattern = field.get('pattern', false);

    if (isEmpty(value)) {
      return { error: false };
    }

    if (pattern && !RegExp(pattern.first()).test(value)) {
      const error = {
        type: ValidationErrorTypes.PATTERN,
        message: `${ field.get('label', field.get('name')) } didn't match the pattern: ${ pattern.last() }`,
      };

      return { error };
    }

    return { error: false };
  };

  validateWrappedControl = (field) => {
    const response = this.wrappedControlValid();
    if (typeof response === "boolean") {
      const isValid = response;
      return { error: (!isValid) };
    } else if (response.hasOwnProperty('error')) {
      return response;
    } else if (response instanceof Promise) {
      response.then(
        () => { this.validate({ error: false }); },
        (err) => {
          const error = {
            type: ValidationErrorTypes.CUSTOM,
            message: `${ field.get('label', field.get('name')) } - ${ err }.`,
          };

          this.validate({ error });
        }
      );

      const error = {
        type: ValidationErrorTypes.CUSTOM,
        message: `${ field.get('label', field.get('name')) } is processing.`,
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
    return this.props.onChange(newObjectValue, newMetadata);
  };

  render() {
    const {
      controlComponent,
      field,
      value,
      mediaPaths,
      metadata,
      onChange,
      onOpenMediaLibrary,
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
      uniqueFieldId
    } = this.props;
    return React.createElement(controlComponent, {
      field,
      value,
      mediaPaths,
      metadata,
      onChange,
      onChangeObject: this.onChangeObject,
      onOpenMediaLibrary,
      onAddAsset,
      onRemoveInsertedMedia,
      getAsset,
      forID: field.get('name') + uniqueFieldId,
      ref: this.processInnerControlRef,
      classNameWrapper,
      classNameWidget,
      classNameWidgetActive,
      classNameLabel,
      classNameLabelActive,
      setActiveStyle,
      setInactiveStyle,
      hasActiveStyle,
      editorControl,
    });
  }
}

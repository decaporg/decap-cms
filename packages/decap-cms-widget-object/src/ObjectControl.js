import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { ClassNames } from '@emotion/react';
import { List, Map } from 'immutable';
import { colors, lengths, ObjectWidgetTopBar } from 'decap-cms-ui-default';
import { ObjectField } from 'decap-cms-ui-next';
import { stringTemplate } from 'decap-cms-lib-widgets';

const styleStrings = {
  nestedObjectControl: `
    padding: 6px 14px 14px;
    border-top: 0;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  `,
  objectWidgetTopBarContainer: `
    padding: ${lengths.objectWidgetTopBarContainerPadding};
  `,
  collapsedObjectControl: `
    display: none;
  `,
};

export default class ObjectControl extends React.Component {
  componentValidate = {};

  static propTypes = {
    onChangeObject: PropTypes.func.isRequired,
    onValidateObject: PropTypes.func,
    value: PropTypes.oneOfType([PropTypes.node, PropTypes.object, PropTypes.bool]),
    field: PropTypes.object,
    forID: PropTypes.string,
    classNameWrapper: PropTypes.string.isRequired,
    forList: PropTypes.bool,
    controlRef: PropTypes.func,
    editorControl: PropTypes.elementType.isRequired,
    resolveWidget: PropTypes.func.isRequired,
    clearFieldErrors: PropTypes.func.isRequired,
    fieldsErrors: ImmutablePropTypes.map,
    hasError: PropTypes.bool,
    t: PropTypes.func,
    locale: PropTypes.string,
    collapsed: PropTypes.bool,
  };

  static defaultProps = {
    value: Map(),
  };

  constructor(props) {
    super(props);
    this.state = {
      collapsed: props.field.get('collapsed', false),
    };
  }

  /*
   * Always update so that each nested widget has the option to update. This is
   * required because ControlHOC provides a default `shouldComponentUpdate`
   * which only updates if the value changes, but every widget must be allowed
   * to override this.
   */
  shouldComponentUpdate() {
    return true;
  }

  validate = () => {
    const { field } = this.props;
    let fields = field.get('field') || field.get('fields');
    fields = List.isList(fields) ? fields : List([fields]);
    fields.forEach(field => {
      if (field.get('widget') === 'hidden') return;
      this.componentValidate[field.get('name')]();
    });
  };

  controlFor(field, key) {
    const {
      value,
      onChangeObject,
      onValidateObject,
      clearFieldErrors,
      metadata,
      fieldsErrors,
      editorControl: EditorControl,
      controlRef,
      parentIds,
      isFieldDuplicate,
      isFieldHidden,
      locale,
      collapsed,
    } = this.props;

    if (field.get('widget') === 'hidden') {
      return null;
    }
    const fieldName = field.get('name');
    const fieldValue = value && Map.isMap(value) ? value.get(fieldName) : value;

    const isDuplicate = isFieldDuplicate && isFieldDuplicate(field);
    const isHidden = isFieldHidden && isFieldHidden(field);

    return (
      <EditorControl
        key={key}
        field={field}
        value={fieldValue}
        onChange={onChangeObject}
        clearFieldErrors={clearFieldErrors}
        fieldsMetaData={metadata}
        fieldsErrors={fieldsErrors}
        onValidate={onValidateObject}
        processControlRef={controlRef && controlRef.bind(this)}
        controlRef={controlRef}
        parentIds={parentIds}
        isDisabled={isDuplicate}
        isHidden={isHidden}
        isFieldDuplicate={isFieldDuplicate}
        isFieldHidden={isFieldHidden}
        locale={locale}
        isParentListCollapsed={collapsed}
      />
    );
  }

  handleCollapseToggle = () => {
    this.setState({ collapsed: !this.state.collapsed });
  };

  renderFields = (multiFields, singleField) => {
    if (multiFields) {
      return multiFields.map((f, idx) => this.controlFor(f, idx));
    }
    return this.controlFor(singleField);
  };

  objectLabel = () => {
    const { value, field } = this.props;
    const label = field.get('label', field.get('name'));
    const summary = field.get('summary');
    return summary ? stringTemplate.compileStringTemplate(summary, null, '', value) : label;
  };

  render() {
    const { field, forID, inline, description, status, error, errors, hasError, t } = this.props;
    const multiFields = field.get('fields');
    const singleField = field.get('field');

    if (multiFields || singleField) {
      return (
        <ObjectField
          label={this.objectLabel()}
          name={forID}
          fields={() => this.renderFields(multiFields, singleField)}
          description={description}
          status={status}
          inline={inline}
          error={error}
          errors={errors}
        />
      );
    }

    return <h3>No field(s) defined for this widget</h3>;
  }
}

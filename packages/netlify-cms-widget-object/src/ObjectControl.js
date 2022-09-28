import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { ClassNames } from '@emotion/core';
import { List, Map } from 'immutable';
import { colors, lengths, ObjectWidgetTopBar } from 'netlify-cms-ui-default';
import { stringTemplate } from 'netlify-cms-lib-widgets';

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
    onValidateObject: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([PropTypes.node, PropTypes.object, PropTypes.bool]),
    field: PropTypes.object,
    forID: PropTypes.string,
    classNameWrapper: PropTypes.string.isRequired,
    forList: PropTypes.bool,
    controlRef: PropTypes.func,
    editorControl: PropTypes.elementType.isRequired,
    resolveWidget: PropTypes.func.isRequired,
    clearFieldErrors: PropTypes.func.isRequired,
    fieldsErrors: ImmutablePropTypes.map.isRequired,
    hasError: PropTypes.bool,
    t: PropTypes.func.isRequired,
    locale: PropTypes.string,
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
    const { field, forID, classNameWrapper, forList, hasError, t } = this.props;
    const collapsed = forList ? this.props.collapsed : this.state.collapsed;
    const multiFields = field.get('fields');
    const singleField = field.get('field');

    if (multiFields || singleField) {
      return (
        <ClassNames>
          {({ css, cx }) => (
            <div
              id={forID}
              className={cx(
                classNameWrapper,
                css`
                  ${styleStrings.objectWidgetTopBarContainer}
                `,
                {
                  [css`
                    ${styleStrings.nestedObjectControl}
                  `]: forList,
                },
                {
                  [css`
                    border-color: ${colors.textFieldBorder};
                  `]: forList ? !hasError : false,
                },
              )}
            >
              {forList ? null : (
                <ObjectWidgetTopBar
                  collapsed={collapsed}
                  onCollapseToggle={this.handleCollapseToggle}
                  heading={collapsed && this.objectLabel()}
                  t={t}
                />
              )}
              {!collapsed && (
                <div
                  className={cx({
                    [css`
                      ${styleStrings.collapsedObjectControl}
                    `]: collapsed,
                  })}
                >
                  {this.renderFields(multiFields, singleField)}
                </div>
              )}
            </div>
          )}
        </ClassNames>
      );
    }

    return <h3>No field(s) defined for this widget</h3>;
  }
}

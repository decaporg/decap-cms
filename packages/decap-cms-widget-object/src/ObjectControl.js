import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { ClassNames } from '@emotion/react';
import { List, Map } from 'immutable';
import { colors, lengths, ObjectWidgetTopBar } from 'decap-cms-ui-default';
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
  childRefs = {};

  processControlRef = ref => {
    if (!ref) return;
    const name = ref.props.field.get('name');
    this.childRefs[name] = ref;
    this.props.controlRef?.(ref);
  };

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

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(ObjectControl.propTypes, this.props, 'prop', 'ObjectControl');
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
      const name = field.get('name');
      const control = this.childRefs[name];

      if (control?.innerWrappedControl?.validate) {
        control.innerWrappedControl.validate();
      } else {
        control?.validate?.();
      }
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
      parentIds,
      isFieldDuplicate,
      isFieldHidden,
      locale,
      collapsed,
      forID,
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
        controlRef={this.processControlRef}
        parentIds={[...parentIds, forID]}
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

  focus(path) {
    if (this.state.collapsed) {
      this.setState({ collapsed: false }, () => {
        if (path) {
          const [fieldName, ...remainingPath] = path.split('.');
          const field = this.childRefs[fieldName];
          if (field?.focus) {
            field.focus(remainingPath.join('.'));
          }
        }
      });
    } else if (path) {
      const [fieldName, ...remainingPath] = path.split('.');
      const field = this.childRefs[fieldName];
      if (field?.focus) {
        field.focus(remainingPath.join('.'));
      }
    }
  }

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
              <div
                className={cx({
                  [css`
                    ${styleStrings.collapsedObjectControl}
                  `]: collapsed,
                })}
              >
                {this.renderFields(multiFields, singleField)}
              </div>
            </div>
          )}
        </ClassNames>
      );
    }

    return <h3>No field(s) defined for this widget</h3>;
  }
}

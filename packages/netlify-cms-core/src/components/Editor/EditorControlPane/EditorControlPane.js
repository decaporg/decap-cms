import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from 'react-emotion';
import conscript from 'conscript';
import EditorControl, { ControlHint } from './EditorControl';

const ControlPaneContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 16px;

  p:not(${ControlHint}) {
    font-size: 16px;
  }
`;

export default class ControlPane extends React.Component {
  componentValidate = {};

  processControlRef = (fieldName, wrappedControl) => {
    if (!wrappedControl) return;
    this.componentValidate[fieldName] = wrappedControl.validate;
  };

  validate = () => {
    this.props.fields.forEach(field => {
      if (!this.isVisible(field)) return;
      this.componentValidate[field.get('name')]();
    });
  };

  isVisible = field => {
    if (field.get('widget') === 'hidden') {
      return false;
    }

    const when = field.get('when');
    if (when) {
      const { entry } = this.props;
      const vars = { field: field.toJS(), entry: entry.toJS() };
      if (typeof when === 'function') {
        return when(vars);
      } else if (typeof when === 'string') {
        return conscript(when)({ vars });
      } else {
        throw new Error('Invalid value for `when`. Should be a string or function.');
      }
    }

    return true;
  };

  render() {
    const {
      collection,
      fields,
      entry,
      fieldsMetaData,
      fieldsErrors,
      onChange,
      onValidate,
    } = this.props;

    if (!collection || !fields) {
      return null;
    }

    if (entry.size === 0 || entry.get('partial') === true) {
      return null;
    }

    return (
      <ControlPaneContainer>
        {fields.map(
          (field, i) =>
            !this.isVisible(field) ? null : (
              <EditorControl
                key={i}
                field={field}
                value={entry.getIn(['data', field.get('name')])}
                fieldsMetaData={fieldsMetaData}
                fieldsErrors={fieldsErrors}
                onChange={onChange}
                onValidate={onValidate}
                processControlRef={this.processControlRef}
              />
            ),
        )}
      </ControlPaneContainer>
    );
  }
}

ControlPane.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  fields: ImmutablePropTypes.list.isRequired,
  fieldsMetaData: ImmutablePropTypes.map.isRequired,
  fieldsErrors: ImmutablePropTypes.map.isRequired,
  onChange: PropTypes.func.isRequired,
  onValidate: PropTypes.func.isRequired,
};

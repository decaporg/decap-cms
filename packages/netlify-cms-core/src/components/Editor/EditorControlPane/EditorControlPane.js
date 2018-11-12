import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from 'react-emotion';
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

  processControlRef = (field, wrappedControl) => {
    if (!wrappedControl) return;
    const name = field.get('name');
    const list = field.get('widget') == 'list';
    const object = field.get('widget') == 'object';
    if (list) {
      this.componentValidate[name] = wrappedControl.innerWrappedControl.validateList;
    } else if (object) {
      this.componentValidate[name] = wrappedControl.innerWrappedControl.validateObject;
    } else {
      this.componentValidate[name] = wrappedControl.validate;
    }
  };

  validate = () => {
    this.props.fields.forEach(field => {
      if (field.get('widget') === 'hidden') return;
      this.componentValidate[field.get('name')]();
    });
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
      onDeleteErrors,
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
            field.get('widget') === 'hidden' ? null : (
              <EditorControl
                key={i}
                field={field}
                value={entry.getIn(['data', field.get('name')])}
                fieldsMetaData={fieldsMetaData}
                fieldsErrors={fieldsErrors}
                onChange={onChange}
                onValidate={onValidate}
                onDeleteErrors={onDeleteErrors}
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
  onDeleteErrors: PropTypes.func.isRequired,
};

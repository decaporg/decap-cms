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
  validate() {
    this.props.fieldValidators.forEach(validator => validator());
  }

  render() {
    const { collection, fields, entry, fieldsMetaData, onChange } = this.props;

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
                onChange={onChange}
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
  onChange: PropTypes.func.isRequired,
};

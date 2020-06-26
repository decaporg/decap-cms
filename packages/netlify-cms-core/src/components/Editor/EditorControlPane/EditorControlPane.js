import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { get } from 'lodash';
import styled from '@emotion/styled';
import EditorControl from './EditorControl';

const ControlPaneContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 16px;
  font-size: 16px;
`;

export default class ControlPane extends React.Component {
  componentValidate = {};

  controlRef(field, wrappedControl) {
    if (!wrappedControl) return;
    const name = field.get('name');

    this.componentValidate[name] =
      wrappedControl.innerWrappedControl?.validate || wrappedControl.validate;
  }

  validate = () => {
    this.props.fields.forEach(field => {
      if (field.get('widget') === 'hidden') return;
      this.componentValidate[field.get('name')]();
    });
  };

  fieldCondition = (field, indexes = [0]) => {
    const data = this.props.entry.get('data').toJS();
    const conditions = field.get('conditions');

    return conditions.some(c => {
      let fieldPath = c.get('fieldPath');
      if (fieldPath.includes('*')) {
        fieldPath = fieldPath.split('*').reduce((acc, item, i) => {
          return `${acc}${item}${indexes[i] >= 0 ? indexes[i] : ''}`;
        }, '');
      }

      return (
        (c.get('equal') && get(data, fieldPath) === c.get('equal')) ||
        (c.get('notEqual') && get(data, fieldPath) !== c.get('notEqual')) ||
        (c.get('oneOf') && c.get('oneOf').includes(get(data, fieldPath))) ||
        (c.get('pattern') && RegExp(c.get('pattern')).test(get(data, fieldPath)))
      );
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
    } = this.props;

    if (!collection || !fields) {
      return null;
    }

    if (entry.size === 0 || entry.get('partial') === true) {
      return null;
    }

    return (
      <ControlPaneContainer>
        {fields.map((field, i) => {
          return field.get('widget') === 'hidden' ? null : (
            <EditorControl
              key={i}
              field={field}
              value={
                field.get('meta')
                  ? entry.getIn(['meta', field.get('name')])
                  : entry.getIn(['data', field.get('name')])
              }
              fieldsMetaData={fieldsMetaData}
              fieldsErrors={fieldsErrors}
              onChange={onChange}
              onValidate={onValidate}
              processControlRef={this.controlRef.bind(this)}
              controlRef={this.controlRef}
              entry={entry}
              collection={collection}
              hideField={field.get('conditions') && !this.fieldCondition(field)}
              fieldCondition={this.fieldCondition}
            />
          );
        })}
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

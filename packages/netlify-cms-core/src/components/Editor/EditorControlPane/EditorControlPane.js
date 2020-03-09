import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import EditorControl from './EditorControl';

const ControlPaneContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 16px;
  font-size: 16px;
`;

export default class ControlPane extends React.Component {
  state = {
    selectedLocale: this.props.locale,
  };

  componentValidate = {};

  componentDidUpdate(prevProps) {
    if (
      this.props.collection.get('multi_content') &&
      !prevProps.fieldsErrors.equals(this.props.fieldsErrors) &&
      this.props.defaultEditor
    ) {
      // show default locale fields on field error
      const defaultLocale = this.props.collection.get('locales').first();
      this.handleLocaleChange(defaultLocale);
    }
  }

  controlRef(field, wrappedControl) {
    if (!wrappedControl) return;
    const name = field.get('name');

    this.componentValidate[name] =
      wrappedControl.innerWrappedControl?.validate || wrappedControl.validate;
  }

  getFields = (defaultLocale = '') => {
    let fields = this.props.fields;
    const selectedLocale = defaultLocale || this.state.selectedLocale;
    if (this.props.collection.get('multi_content')) {
      fields = fields.filter(f => f.get('name') === selectedLocale);
    }
    return fields;
  };

  handleLocaleChange = val => {
    this.setState({ selectedLocale: val });
  };

  validate = () => {
    const collection = this.props.collection;
    const defaultLocale = collection.get('multi_content') && collection.get('locales').first();
    this.getFields(defaultLocale).forEach(field => {
      if (field.get('widget') === 'hidden') return;
      this.componentValidate[field.get('name')]();
    });
  };

  render() {
    const { collection, entry, fieldsMetaData, fieldsErrors, onChange, onValidate } = this.props;
    const fields = this.getFields();

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
              selectedLocale={this.state.selectedLocale}
              onLocaleChange={this.handleLocaleChange}
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

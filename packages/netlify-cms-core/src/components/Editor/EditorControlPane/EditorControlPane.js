import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import EditorControl from './EditorControl';
import {
  getI18nInfo,
  isFieldTranslatable,
  isFieldDuplicate,
  isFieldHidden,
  I18N,
} from '../../../lib/i18n';

const ControlPaneContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 16px;
  font-size: 16px;
`;

const getFieldValue = ({ field, entry, locale, defaultLocale }) => {
  if (field.get('meta')) {
    return entry.getIn(['meta', field.get('name')]);
  }

  if (isFieldTranslatable(field, locale, defaultLocale)) {
    return entry.getIn([I18N, locale, 'data', field.get('name')]);
  }

  return entry.getIn(['data', field.get('name')]);
};

export default class ControlPane extends React.Component {
  state = {
    selectedLocale: this.props.locale,
  };

  componentValidate = {};

  controlRef(field, wrappedControl) {
    if (!wrappedControl) return;
    const name = field.get('name');

    this.componentValidate[name] =
      wrappedControl.innerWrappedControl?.validate || wrappedControl.validate;
  }

  getFields = () => {
    const fields = this.props.fields;
    return fields;
  };

  handleLocaleChange = val => {
    this.setState({ selectedLocale: val });
  };

  validate = async () => {
    this.getFields().forEach(field => {
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

    const { locales, defaultLocale } = getI18nInfo(collection);
    const locale = this.state.selectedLocale;

    return (
      <ControlPaneContainer>
        {fields.map((field, i) => {
          const renderLocaleDropdown = locales && i === 0;
          const isTranslatable = isFieldTranslatable(field, locale, defaultLocale);
          const isDisabled = locales && isFieldDuplicate(field, locale, defaultLocale);
          const isHidden = locales && isFieldHidden(field, locale, defaultLocale);
          return field.get('widget') === 'hidden' ? null : (
            <EditorControl
              key={i}
              field={field}
              value={getFieldValue({
                field,
                entry,
                locale,
                defaultLocale,
              })}
              fieldsMetaData={fieldsMetaData}
              fieldsErrors={fieldsErrors}
              onChange={(field, newValue, newMetadata) => {
                if (isTranslatable) {
                  onChange(field, newValue, newMetadata, locale);
                } else {
                  onChange(field, newValue, newMetadata);
                }
              }}
              onValidate={onValidate}
              processControlRef={this.controlRef.bind(this)}
              controlRef={this.controlRef}
              entry={entry}
              collection={collection}
              selectedLocale={this.state.selectedLocale}
              onLocaleChange={this.handleLocaleChange}
              locales={locales}
              renderLocaleDropdown={renderLocaleDropdown}
              isDisabled={isDisabled}
              isHidden={isHidden}
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

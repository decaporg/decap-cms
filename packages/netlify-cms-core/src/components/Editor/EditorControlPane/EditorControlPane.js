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
  getLocaleDataPath,
} from '../../../lib/i18n';

const ControlPaneContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 16px;
  font-size: 16px;
`;

const getFieldValue = ({ field, entry, isTranslatable, locale }) => {
  if (field.get('meta')) {
    return entry.getIn(['meta', field.get('name')]);
  }

  if (isTranslatable) {
    const dataPath = getLocaleDataPath(locale);
    return entry.getIn([...dataPath, field.get('name')]);
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

  handleLocaleChange = val => {
    this.setState({ selectedLocale: val });
  };

  validate = async () => {
    this.props.fields.forEach(field => {
      if (field.get('widget') === 'hidden') return;
      this.componentValidate[field.get('name')]();
    });
  };

  render() {
    const { collection, entry, fieldsMetaData, fieldsErrors, onChange, onValidate } = this.props;
    const fields = this.props.fields;

    if (!collection || !fields) {
      return null;
    }

    if (entry.size === 0 || entry.get('partial') === true) {
      return null;
    }

    const { locales, defaultLocale } = getI18nInfo(collection);
    const locale = this.state.selectedLocale;
    const i18n = locales && {
      currentLocale: locale,
      locales,
      defaultLocale,
    };

    return (
      <ControlPaneContainer>
        {fields
          .filter(f => f.get('widget') !== 'hidden')
          .map((field, i) => {
            const renderLocaleDropdown = locales && i === 0;
            const isTranslatable = isFieldTranslatable(field, locale, defaultLocale);
            const isDuplicate = locales && isFieldDuplicate(field, locale, defaultLocale);
            const isHidden = locales && isFieldHidden(field, locale, defaultLocale);

            return (
              <EditorControl
                key={i}
                field={field}
                value={getFieldValue({
                  field,
                  entry,
                  locale,
                  isTranslatable,
                })}
                fieldsMetaData={fieldsMetaData}
                fieldsErrors={fieldsErrors}
                onChange={(field, newValue, newMetadata) =>
                  onChange(field, newValue, newMetadata, i18n)
                }
                onValidate={onValidate}
                processControlRef={this.controlRef.bind(this)}
                controlRef={this.controlRef}
                entry={entry}
                collection={collection}
                selectedLocale={this.state.selectedLocale}
                onLocaleChange={this.handleLocaleChange}
                locales={locales}
                renderLocaleDropdown={renderLocaleDropdown}
                isDisabled={isDuplicate}
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

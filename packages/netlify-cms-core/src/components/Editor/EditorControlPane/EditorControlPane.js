import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css } from '@emotion/core';
import styled from '@emotion/styled';
import {
  colors,
  Dropdown,
  DropdownItem,
  StyledDropdownButton,
  buttons,
  text,
} from 'netlify-cms-ui-default';

import EditorControl from './EditorControl';
import {
  getI18nInfo,
  isFieldTranslatable,
  isFieldDuplicate,
  isFieldHidden,
  getLocaleDataPath,
  hasI18n,
} from '../../../lib/i18n';

const ControlPaneContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 16px;
  font-size: 16px;
`;

const LocaleButton = styled(StyledDropdownButton)`
  ${buttons.button};
  ${buttons.medium};
  color: ${colors.controlLabel};
  background: ${colors.textFieldBorder};
  height: 100%;

  &:after {
    top: 11px;
  }
`;

const LocaleButtonWrapper = styled.div`
  display: flex;
`;

const StyledDropdown = styled(Dropdown)`
  width: max-content;
  margin-top: 20px;
  margin-bottom: 20px;
`;

function LocaleDropdown({ locales, selectedLocale, onLocaleChange, t }) {
  return (
    <StyledDropdown
      renderButton={() => {
        return (
          <LocaleButtonWrapper>
            <LocaleButton>
              {t('editor.editorControlPane.i18n.writingInLocale', {
                locale: selectedLocale.toUpperCase(),
              })}
            </LocaleButton>
          </LocaleButtonWrapper>
        );
      }}
    >
      {locales.map(l => (
        <DropdownItem
          css={css`
            ${text.fieldLabel}
          `}
          key={l}
          label={l}
          onClick={() => onLocaleChange(l)}
        />
      ))}
    </StyledDropdown>
  );
}

function getFieldValue({ field, entry, isTranslatable, locale }) {
  if (field.get('meta')) {
    return entry.getIn(['meta', field.get('name')]);
  }

  if (isTranslatable) {
    const dataPath = getLocaleDataPath(locale);
    return entry.getIn([...dataPath, field.get('name')]);
  }

  return entry.getIn(['data', field.get('name')]);
}

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

  switchToDefaultLocale = () => {
    if (hasI18n(this.props.collection)) {
      const { defaultLocale } = getI18nInfo(this.props.collection);
      return new Promise(resolve => this.setState({ selectedLocale: defaultLocale }, resolve));
    } else {
      return Promise.resolve();
    }
  };

  render() {
    const { collection, entry, fieldsMetaData, fieldsErrors, onChange, onValidate, t } = this.props;
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
        {locales && (
          <LocaleDropdown
            locales={locales}
            selectedLocale={locale}
            onLocaleChange={this.handleLocaleChange}
            t={t}
          />
        )}
        {fields
          .filter(f => f.get('widget') !== 'hidden')
          .map((field, i) => {
            const isTranslatable = isFieldTranslatable(field, locale, defaultLocale);
            const isDuplicate = isFieldDuplicate(field, locale, defaultLocale);
            const isHidden = isFieldHidden(field, locale, defaultLocale);
            const key = i18n ? `${locale}_${i}` : i;

            return (
              <EditorControl
                key={key}
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
                isDisabled={isDuplicate}
                isHidden={isHidden}
                isFieldDuplicate={field => isFieldDuplicate(field, locale, defaultLocale)}
                isFieldHidden={field => isFieldHidden(field, locale, defaultLocale)}
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

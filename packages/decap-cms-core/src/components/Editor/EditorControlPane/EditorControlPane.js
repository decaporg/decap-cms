import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  buttons,
  colors,
  Dropdown,
  DropdownItem,
  StyledDropdownButton,
  text,
} from 'decap-cms-ui-default';

import EditorControl from './EditorControl';
import {
  getI18nInfo,
  getLocaleDataPath,
  hasI18n,
  isFieldDuplicate,
  isFieldHidden,
  isFieldTranslatable,
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

const LocaleRowWrapper = styled.div`
  display: flex;
`;

const StyledDropdown = styled(Dropdown)`
  width: max-content;
  margin-top: 20px;
  margin-bottom: 20px;
  margin-right: 20px;
`;

function LocaleDropdown({ locales, dropdownText, onLocaleChange }) {
  return (
    <StyledDropdown
      renderButton={() => {
        return (
          <LocaleButtonWrapper>
            <LocaleButton>{dropdownText}</LocaleButton>
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

  childRefs = {};

  controlRef = (field, wrappedControl) => {
    if (!wrappedControl) return;
    const name = field.get('name');
    this.childRefs[name] = wrappedControl;
  };

  getControlRef = field => wrappedControl => {
    this.controlRef(field, wrappedControl);
  };

  handleLocaleChange = val => {
    this.setState({ selectedLocale: val });
    this.props.onLocaleChange(val);
  };

  copyFromOtherLocale =
    ({ targetLocale, t }) =>
    sourceLocale => {
      if (
        !window.confirm(
          t('editor.editorControlPane.i18n.copyFromLocaleConfirm', {
            locale: sourceLocale.toUpperCase(),
          }),
        )
      ) {
        return;
      }
      const { entry, collection } = this.props;
      const { locales, defaultLocale } = getI18nInfo(collection);

      const locale = this.state.selectedLocale;
      const i18n = locales && {
        currentLocale: locale,
        locales,
        defaultLocale,
      };

      this.props.fields.forEach(field => {
        if (isFieldTranslatable(field, targetLocale, sourceLocale)) {
          const copyValue = getFieldValue({
            field,
            entry,
            locale: sourceLocale,
            isTranslatable: sourceLocale !== defaultLocale,
          });
          if (copyValue) this.props.onChange(field, copyValue, undefined, i18n);
        }
      });
    };

  validate = async () => {
    this.props.fields.forEach(field => {
      if (field.get('widget') === 'hidden') return;
      const control = this.childRefs[field.get('name')];
      const validateFn = control?.innerWrappedControl?.validate ?? control?.validate;
      if (validateFn) {
        validateFn();
      }
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

  focus(path) {
    const [fieldName, ...remainingPath] = path.split('.');
    const control = this.childRefs[fieldName];
    if (control?.focus) {
      control.focus(remainingPath.join('.'));
    }
  }

  render() {
    const { collection, entry, fields, fieldsMetaData, fieldsErrors, onChange, onValidate, t } =
      this.props;

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
          <LocaleRowWrapper>
            <LocaleDropdown
              locales={locales}
              dropdownText={t('editor.editorControlPane.i18n.writingInLocale', {
                locale: locale.toUpperCase(),
              })}
              onLocaleChange={this.handleLocaleChange}
            />
            <LocaleDropdown
              locales={locales.filter(l => l !== locale)}
              dropdownText={t('editor.editorControlPane.i18n.copyFromLocale')}
              onLocaleChange={this.copyFromOtherLocale({ targetLocale: locale, t })}
            />
          </LocaleRowWrapper>
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
                onChange={(field, newValue, newMetadata) => {
                  onChange(field, newValue, newMetadata, i18n);
                }}
                onValidate={onValidate}
                controlRef={this.getControlRef(field)}
                entry={entry}
                collection={collection}
                isDisabled={isDuplicate}
                isHidden={isHidden}
                isFieldDuplicate={field => isFieldDuplicate(field, locale, defaultLocale)}
                isFieldHidden={field => isFieldHidden(field, locale, defaultLocale)}
                locale={locale}
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
  locale: PropTypes.string,
};

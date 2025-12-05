import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import memoize from 'lodash/memoize';
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

function calculateCondition({ field, fields, entry, locale, isTranslatable, listIndexes = [] }) {
  const condition = field.get('condition');
  if (!condition) return true;

  // Get field name - supports simple names, dot-notated paths, and wildcards
  let condFieldName = condition.get('field');
  if (!condFieldName) return true;

  // Operators are descriptive (equal, notEqual, greaterThan, etc.)
  const operator = condition.get('operator') || 'equal';
  const condValue = condition.get('value');

  // Handle wildcard paths (e.g., 'structure.*.type')
  if (condFieldName.includes('*')) {
    condFieldName = condFieldName.split('*').reduce((acc, item, i) => {
      return `${acc}${item}${listIndexes[i] >= 0 ? listIndexes[i] : ''}`;
    }, '');
  }

  // Get the field value - all field references are treated as potentially nested paths
  let condFieldValue;
  if (condFieldName.includes('.')) {
    // For dot-notated paths, traverse the entry data directly
    const dataPath = condFieldName.split('.');
    const entryData = entry.get('data');
    condFieldValue = entryData ? entryData.getIn(dataPath) : undefined;
  } else {
    // For simple field names, use the existing getFieldValue logic
    const condField = fields.find(f => f.get('name') === condFieldName);
    if (condField) {
      condFieldValue = getFieldValue({ field: condField, entry, locale, isTranslatable });
    }
  }

  // Convert Immutable to JS if needed
  condFieldValue = condFieldValue?.toJS ? condFieldValue.toJS() : condFieldValue;

  // Handle different operators
  switch (operator) {
    case 'equal':
      return condFieldValue == condValue;
    case 'notEqual':
      return condFieldValue != condValue;
    case 'greaterThan':
      return condFieldValue > condValue;
    case 'lessThan':
      return condFieldValue < condValue;
    case 'greaterThanOrEqual':
      return condFieldValue >= condValue;
    case 'lessThanOrEqual':
      return condFieldValue <= condValue;
    case 'oneOf': {
      const valueArray = condValue?.toJS ? condValue.toJS() : condValue;
      return Array.isArray(valueArray) && valueArray.includes(condFieldValue);
    }
    case 'includes': {
      const rawValue = condValue?.toJS ? condValue.toJS() : condValue;
      // If field value is array, check inclusion; if string, check substring
      if (Array.isArray(condFieldValue)) return condFieldValue.includes(rawValue);
      const target = condFieldValue == null ? '' : String(condFieldValue);
      return String(rawValue) !== undefined && target.includes(String(rawValue));
    }
    case 'matches': {
      const rawCondValue = condValue?.toJS ? condValue.toJS() : condValue;

      // Determine regex pattern/flags from value
      let pattern;
      let flags;

      if (rawCondValue instanceof RegExp) {
        pattern = rawCondValue.source;
        flags = rawCondValue.flags;
      } else if (typeof rawCondValue === 'string') {
        const match = rawCondValue.match(/^\/(.*)\/([gimsuy]*)$/);
        if (match) {
          pattern = match[1];
          flags = match[2] || undefined;
        } else {
          // if plain string, fallback to substring match semantics
          const target = condFieldValue == null ? '' : String(condFieldValue);
          return target.includes(rawCondValue);
        }
      } else if (rawCondValue && typeof rawCondValue === 'object' && rawCondValue.regex) {
        pattern = rawCondValue.regex;
        flags = rawCondValue.flags;
      } else {
        return false;
      }

      try {
        const re = new RegExp(pattern, flags);
        const target = condFieldValue == null ? '' : String(condFieldValue);
        return re.test(target);
      } catch (e) {
        return false;
      }
    }
    default:
      return condFieldValue == condValue;
  }
}

/**
 * Memoized version of calculateCondition to improve performance.
 *
 * PERFORMANCE OPTIMIZATION:
 * Without memoization, calculateCondition is called on every render for every field,
 * creating an O(n²) performance problem. When a user types in a field, the entry
 * object changes, causing all fields to re-render and recalculate their conditions.
 *
 * This memoization caches results based on:
 * 1. The field name being checked
 * 2. The actual VALUE of the condition field (not the entire entry object)
 * 3. List indexes for wildcard paths
 *
 * This means:
 * - Typing in field A only recalculates conditions that depend on field A
 * - Typing in field B doesn't trigger recalculation for fields that depend on A
 * - Cache is automatically cleared when switching entries (see componentDidUpdate)
 *
 * This reduces O(n²) to O(n) complexity for conditional field evaluation.
 */
const memoizedCalculateCondition = memoize(
  ({ field, fields, entry, locale, isTranslatable, listIndexes = [] }) => {
    return calculateCondition({ field, fields, entry, locale, isTranslatable, listIndexes });
  },
  // Custom resolver: create cache key from field name, condition field value, and listIndexes
  ({ field, entry, listIndexes = [] }) => {
    const condition = field.get('condition');
    if (!condition) return `${field.get('name')}-no-condition`;

    let condFieldName = condition.get('field');
    if (!condFieldName) return `${field.get('name')}-no-field`;

    // Handle wildcard paths
    if (condFieldName.includes('*')) {
      condFieldName = condFieldName.split('*').reduce((acc, item, i) => {
        return `${acc}${item}${listIndexes[i] >= 0 ? listIndexes[i] : ''}`;
      }, '');
    }

    // Get the actual value of the condition field to use in cache key
    let condFieldValue;
    if (condFieldName.includes('.')) {
      const dataPath = condFieldName.split('.');
      const entryData = entry.get('data');
      condFieldValue = entryData ? entryData.getIn(dataPath) : undefined;
    } else {
      const entryData = entry.get('data');
      condFieldValue = entryData ? entryData.get(condFieldName) : undefined;
    }

    // Create cache key from field name, condition field name, condition field value, and list indexes
    // This ensures we only recalculate when the condition field's value actually changes
    const valueKey = condFieldValue?.toJS
      ? JSON.stringify(condFieldValue.toJS())
      : String(condFieldValue);
    return `${field.get('name')}-${condFieldName}-${valueKey}-${listIndexes.join(',')}`;
  },
);

export default class ControlPane extends React.Component {
  state = {
    selectedLocale: this.props.locale,
    // Track which fields are currently visible based on conditions
    // This allows us to update visibility asynchronously without blocking input
    fieldVisibility: {},
  };

  childRefs = {};
  visibilityUpdateTimer = null;

  componentDidMount() {
    // Calculate initial visibility
    this.scheduleVisibilityUpdate();
  }

  componentDidUpdate(prevProps, prevState) {
    // Clear memoization cache when switching to a different entry
    // This ensures we don't use stale cached condition calculations
    if (prevProps.entry !== this.props.entry) {
      memoizedCalculateCondition.cache.clear();
      // Force immediate recalculation for new entry
      this.setState({ fieldVisibility: {} });
      this.scheduleVisibilityUpdate(true);
    } else if (
      prevProps.entry !== this.props.entry ||
      prevState.selectedLocale !== this.state.selectedLocale
    ) {
      // Schedule async visibility update when data changes
      this.scheduleVisibilityUpdate();
    }
  }

  componentWillUnmount() {
    // Clean up any pending visibility updates
    if (this.visibilityUpdateTimer) {
      clearTimeout(this.visibilityUpdateTimer);
    }
  }

  /**
   * Schedule an asynchronous update of field visibility.
   * This allows user input to remain smooth while conditional field
   * visibility is recalculated in the background.
   *
   * @param {boolean} immediate - If true, update immediately without debouncing
   */
  scheduleVisibilityUpdate = (immediate = false) => {
    // Clear any pending update
    if (this.visibilityUpdateTimer) {
      clearTimeout(this.visibilityUpdateTimer);
    }

    const updateVisibility = () => {
      const { entry, collection, fields } = this.props;
      const locale = this.state.selectedLocale;
      const isTranslatable = hasI18n(collection);

      // Calculate visibility for all fields with conditions
      const newVisibility = {};
      fields.forEach(field => {
        const fieldName = field.get('name');
        const condition = field.get('condition');

        if (condition) {
          // Use memoized calculation
          newVisibility[fieldName] = memoizedCalculateCondition({
            field,
            fields,
            entry,
            locale,
            isTranslatable,
            listIndexes: [],
          });
        } else {
          // Fields without conditions are always visible
          newVisibility[fieldName] = true;
        }
      });

      this.setState({ fieldVisibility: newVisibility });
    };

    if (immediate) {
      // Update immediately (e.g., when switching entries)
      updateVisibility();
    } else {
      // Debounce updates to avoid excessive recalculation during rapid typing
      // Use requestIdleCallback if available, otherwise setTimeout
      if (typeof requestIdleCallback !== 'undefined') {
        this.visibilityUpdateTimer = requestIdleCallback(
          () => {
            updateVisibility();
            this.visibilityUpdateTimer = null;
          },
          { timeout: 150 }, // Max delay of 150ms
        );
      } else {
        this.visibilityUpdateTimer = setTimeout(() => {
          updateVisibility();
          this.visibilityUpdateTimer = null;
        }, 50); // Small delay to batch updates
      }
    }
  };

  controlRef = (field, wrappedControl) => {
    if (!wrappedControl) return;
    const name = field.get('name');
    this.childRefs[name] = wrappedControl;
  };

  getControlRef = field => wrappedControl => {
    this.controlRef(field, wrappedControl);
  };

  fieldCondition = (field, listIndexes = []) => {
    const { entry, collection, fields } = this.props;
    const locale = this.state.selectedLocale;
    const isTranslatable = hasI18n(collection);

    return memoizedCalculateCondition({
      field,
      fields,
      entry,
      locale,
      isTranslatable,
      listIndexes,
    });
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
    const { fields, entry, collection } = this.props;

    fields.forEach(field => {
      const isConditionMet = memoizedCalculateCondition({
        field,
        fields,
        entry,
        locale: this.state.selectedLocale,
        isTranslatable: hasI18n(collection),
      });

      if (field.get('widget') === 'hidden' || !isConditionMet) return;

      const control = this.childRefs[field.get('name')];
      const validateFn = control?.innerWrappedControl?.validate ?? control?.validate;
      if (validateFn) validateFn();
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
            const fieldName = field.get('name');
            const isTranslatable = isFieldTranslatable(field, locale, defaultLocale);
            const isDuplicate = isFieldDuplicate(field, locale, defaultLocale);
            const isHidden = isFieldHidden(field, locale, defaultLocale);
            const key = i18n ? `${locale}_${i}` : i;

            // Use cached visibility state for smooth performance
            // If visibility hasn't been calculated yet, default to visible to avoid hiding fields
            const hasCondition = !!field.get('condition');
            const isConditionMet = hasCondition
              ? this.state.fieldVisibility[fieldName] !== false // Default to true if not yet calculated
              : true;

            if (!isConditionMet) return null;

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
                  // Call parent onChange
                  onChange(field, newValue, newMetadata, i18n);
                  // Schedule async visibility update to reflect condition changes
                  this.scheduleVisibilityUpdate();
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
                listIndexes={[]}
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
  locale: PropTypes.string,
};

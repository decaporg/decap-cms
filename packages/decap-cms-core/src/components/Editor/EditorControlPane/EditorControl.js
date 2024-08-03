import React from 'react';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { translate } from 'react-polyglot';
import { ClassNames, Global, css as coreCss, withTheme } from '@emotion/react';
import { partial, uniqueId } from 'lodash';
import { connect } from 'react-redux';
import { Field } from 'decap-cms-ui-next';

import { resolveWidget, getEditorComponents } from '../../../lib/registry';
import { selectInferredField } from '../../../reducers/collections';
import { clearFieldErrors, tryLoadEntry, validateMetaField } from '../../../actions/entries';
import { addAsset, boundGetAsset } from '../../../actions/media';
import { selectIsLoadingAsset } from '../../../reducers/medias';
import { query, clearSearch } from '../../../actions/search';
import {
  openMediaLibrary,
  removeInsertedMedia,
  clearMediaControl,
  removeMediaControl,
  persistMedia,
} from '../../../actions/mediaLibrary';
import Widget from './Widget';

/**
 * This is a necessary bridge as we are still passing classnames to widgets
 * for styling. Once that changes we can stop storing raw style strings like
 * this.
 */
const styleStrings = {
  widget: theme => coreCss`
        color: ${theme.color.highEmphasis};
        background: none;
        border: none;
        outline: none;
        width: calc(100% + 32px);
        font-family: inherit;
        font-size: 1rem;
        font-weight: normal;
        letter-spacing: 0;
        line-height: 1rem;
        caret-color: ${theme.color.primary['800']};
        margin: -2rem -1rem -1rem -1rem;
        padding: 2rem 1rem 1rem 1rem;
      `,
  widgetActive: theme => coreCss`
        border-color: ${theme.color.primary['800']};
      `,
  widgetTitle: coreCss`
        font-size: 2rem;
        font-weight: bold;
        letter-spacing: -0.5px;
      `,
  widgetError: theme => coreCss`
        caret-color: ${theme.color.danger['900']};
        border-color: ${theme.color.danger['900']};
      `,
  disabled: theme => coreCss`
        pointer-events: none;

        ::placeholder {
          color: ${theme.color.disabled};
        }
      `,
  hidden: coreCss`
        visibility: hidden;
      `,
};

class EditorControl extends React.Component {
  static propTypes = {
    value: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.object,
      PropTypes.string,
      PropTypes.bool,
    ]),
    field: ImmutablePropTypes.map.isRequired,
    fieldsMetaData: ImmutablePropTypes.map,
    fieldsErrors: ImmutablePropTypes.map,
    mediaPaths: ImmutablePropTypes.map.isRequired,
    boundGetAsset: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    openMediaLibrary: PropTypes.func.isRequired,
    addAsset: PropTypes.func.isRequired,
    removeInsertedMedia: PropTypes.func.isRequired,
    persistMedia: PropTypes.func.isRequired,
    onValidate: PropTypes.func,
    processControlRef: PropTypes.func,
    controlRef: PropTypes.func,
    query: PropTypes.func.isRequired,
    queryHits: PropTypes.object,
    isFetching: PropTypes.bool,
    clearSearch: PropTypes.func.isRequired,
    clearFieldErrors: PropTypes.func.isRequired,
    loadEntry: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
    isEditorComponent: PropTypes.bool,
    isNewEditorComponent: PropTypes.bool,
    parentIds: PropTypes.arrayOf(PropTypes.string),
    entry: ImmutablePropTypes.map.isRequired,
    collection: ImmutablePropTypes.map.isRequired,
    isDisabled: PropTypes.bool,
    isHidden: PropTypes.bool,
    isFieldDuplicate: PropTypes.func,
    isFieldHidden: PropTypes.func,
    locale: PropTypes.string,
  };

  static defaultProps = {
    parentIds: [],
  };

  state = {
    activeLabel: false,
  };

  uniqueFieldId = uniqueId(`${this.props.field.get('name')}-field-`);

  isAncestorOfFieldError = () => {
    const { fieldsErrors } = this.props;

    if (fieldsErrors && fieldsErrors.size > 0) {
      return Object.values(fieldsErrors.toJS()).some(arr =>
        arr.some(err => err.parentIds && err.parentIds.includes(this.uniqueFieldId)),
      );
    }
    return false;
  };

  isFieldTitle = () => {
    const { field, collection } = this.props;

    return field.get('name') === selectInferredField(collection, 'title');
  };

  render() {
    const {
      value,
      entry,
      collection,
      config,
      field,
      fieldsMetaData,
      fieldsErrors,
      mediaPaths,
      boundGetAsset,
      onChange,
      openMediaLibrary,
      clearMediaControl,
      removeMediaControl,
      addAsset,
      removeInsertedMedia,
      persistMedia,
      onValidate,
      processControlRef,
      controlRef,
      query,
      queryHits,
      isFetching,
      clearSearch,
      clearFieldErrors,
      loadEntry,
      className,
      isSelected,
      isEditorComponent,
      isNewEditorComponent,
      parentIds,
      t,
      theme,
      validateMetaField,
      isLoadingAsset,
      isDisabled,
      isHidden,
      isFieldDuplicate,
      isFieldHidden,
      locale,
    } = this.props;

    const widgetName = field.get('widget');
    const widget = resolveWidget(widgetName);
    const fieldLabel = field.get('label', field.get('name'));
    const fieldName = field.get('name');
    const fieldHint = field.get('hint');
    const fieldPlaceholder =
      field.get('placeholder') ||
      t('editor.editorControl.field.placeholder', {
        fieldLabel: fieldLabel.toLowerCase(),
      });
    const isFieldOptional = field.get('required') === false;
    const fieldOptional = isFieldOptional ? t('editor.editorControl.field.optional') : '';
    const isFieldTitle = this.isFieldTitle();
    const onValidateObject = onValidate;
    const metadata = fieldsMetaData && fieldsMetaData.get(fieldName);
    const errors = fieldsErrors && fieldsErrors.get(this.uniqueFieldId);
    const childErrors = this.isAncestorOfFieldError();
    const hasErrors = !!errors || childErrors;

    return (
      <ClassNames>
        {({ css, cx }) => (
          <Field
            className={className}
            css={css`
              ${isHidden && styleStrings.hidden};
            `}
            filled
            status={fieldOptional}
            label={fieldLabel}
            labelTarget={this.uniqueFieldId}
            description={fieldHint}
            error={hasErrors}
            errors={errors}
            focus={isSelected || this.state.styleActive}
          >
            {widget.globalStyles && <Global styles={coreCss`${widget.globalStyles}`} />}

            <Widget
              classNameWrapper={cx(
                css`
                  ${styleStrings.widget(theme)};
                `,
                {
                  [css`
                    ${styleStrings.widgetActive(theme)};
                  `]: isSelected || this.state.styleActive,
                },
                {
                  [css`
                    ${styleStrings.widgetTitle};
                  `]: isFieldTitle,
                },
                {
                  [css`
                    ${styleStrings.widgetError(theme)};
                  `]: hasErrors,
                },
                {
                  [css`
                    ${styleStrings.disabled(theme)}
                  `]: isDisabled,
                },
              )}
              classNameWidget={css`
                ${styleStrings.widget(theme)};
              `}
              classNameWidgetActive={css`
                ${styleStrings.widgetActive(theme)};
              `}
              classNameLabel={css`
                ${styleStrings.label};
              `}
              classNameLabelActive={css`
                ${styleStrings.labelActive};
              `}
              controlComponent={widget.control}
              entry={entry}
              collection={collection}
              config={config}
              field={field}
              uniqueFieldId={this.uniqueFieldId}
              fieldPlaceholder={fieldPlaceholder}
              value={value}
              mediaPaths={mediaPaths}
              metadata={metadata}
              onChange={(newValue, newMetadata) => onChange(field, newValue, newMetadata)}
              onValidate={onValidate && partial(onValidate, this.uniqueFieldId)}
              onOpenMediaLibrary={openMediaLibrary}
              onClearMediaControl={clearMediaControl}
              onRemoveMediaControl={removeMediaControl}
              onRemoveInsertedMedia={removeInsertedMedia}
              onPersistMedia={persistMedia}
              onAddAsset={addAsset}
              getAsset={boundGetAsset}
              hasActiveStyle={isSelected || this.state.styleActive}
              setActiveStyle={() => this.setState({ styleActive: true })}
              setInactiveStyle={() => this.setState({ styleActive: false })}
              resolveWidget={resolveWidget}
              widget={widget}
              getEditorComponents={getEditorComponents}
              ref={processControlRef && partial(processControlRef, field)}
              controlRef={controlRef}
              editorControl={ConnectedEditorControl}
              query={query}
              loadEntry={loadEntry}
              queryHits={queryHits[this.uniqueFieldId] || []}
              clearSearch={clearSearch}
              clearFieldErrors={clearFieldErrors}
              isFetching={isFetching}
              fieldsErrors={fieldsErrors}
              onValidateObject={onValidateObject}
              isEditorComponent={isEditorComponent}
              isNewEditorComponent={isNewEditorComponent}
              parentIds={parentIds}
              t={t}
              validateMetaField={validateMetaField}
              isDisabled={isDisabled}
              isFieldDuplicate={isFieldDuplicate}
              isFieldHidden={isFieldHidden}
              isLoadingAsset={isLoadingAsset}
              locale={locale}
            />
          </Field>
        )}
      </ClassNames>
    );
  }
}

function mapStateToProps(state) {
  const { collections, entryDraft } = state;
  const entry = entryDraft.get('entry');
  const collection = collections.get(entryDraft.getIn(['entry', 'collection']));
  const isLoadingAsset = selectIsLoadingAsset(state.medias);

  async function loadEntry(collectionName, slug) {
    const targetCollection = collections.get(collectionName);
    if (targetCollection) {
      const loadedEntry = await tryLoadEntry(state, targetCollection, slug);
      return loadedEntry;
    } else {
      throw new Error(`Can't find collection '${collectionName}'`);
    }
  }

  return {
    mediaPaths: state.mediaLibrary.get('controlMedia'),
    isFetching: state.search.isFetching,
    queryHits: state.search.queryHits,
    config: state.config,
    entry,
    collection,
    isLoadingAsset,
    loadEntry,
    validateMetaField: (field, value, t) => validateMetaField(state, collection, field, value, t),
  };
}

function mapDispatchToProps(dispatch) {
  const creators = bindActionCreators(
    {
      openMediaLibrary,
      clearMediaControl,
      removeMediaControl,
      removeInsertedMedia,
      persistMedia,
      addAsset,
      query,
      clearSearch,
      clearFieldErrors,
    },
    dispatch,
  );
  return {
    ...creators,
    boundGetAsset: (collection, entry) => boundGetAsset(dispatch, collection, entry),
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    boundGetAsset: dispatchProps.boundGetAsset(stateProps.collection, stateProps.entry),
  };
}

const ConnectedEditorControl = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(translate()(EditorControl));

export default withTheme(ConnectedEditorControl);

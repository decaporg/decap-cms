import React from 'react';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { translate } from 'react-polyglot';
import { ClassNames, Global, css as coreCss } from '@emotion/core';
import styled from '@emotion/styled';
import { partial, uniqueId } from 'lodash';
import { connect } from 'react-redux';
import { FieldLabel, colors, transitions, lengths, borders } from 'netlify-cms-ui-default';
import { resolveWidget, getEditorComponents } from 'Lib/registry';
import { clearFieldErrors, tryLoadEntry } from 'Actions/entries';
import { addAsset, boundGetAsset } from 'Actions/media';
import { selectIsLoadingAsset } from 'Reducers/medias';
import { query, clearSearch } from 'Actions/search';
import {
  openMediaLibrary,
  removeInsertedMedia,
  clearMediaControl,
  removeMediaControl,
} from 'Actions/mediaLibrary';
import Widget from './Widget';
import { validateMetaField } from '../../../actions/entries';

/**
 * This is a necessary bridge as we are still passing classnames to widgets
 * for styling. Once that changes we can stop storing raw style strings like
 * this.
 */
const styleStrings = {
  widget: `
    display: block;
    width: 100%;
    padding: ${lengths.inputPadding};
    margin: 0;
    border: ${borders.textField};
    border-radius: ${lengths.borderRadius};
    border-top-left-radius: 0;
    outline: 0;
    box-shadow: none;
    background-color: ${colors.inputBackground};
    color: #444a57;
    transition: border-color ${transitions.main};
    position: relative;
    font-size: 15px;
    line-height: 1.5;

    select& {
      text-indent: 14px;
      height: 58px;
    }
  `,
  widgetActive: `
    border-color: ${colors.active};
  `,
  widgetError: `
    border-color: ${colors.errorText};
  `,
};

const ControlContainer = styled.div`
  margin-top: 16px;

  &:first-of-type {
    margin-top: 36px;
  }
`;

const ControlErrorsList = styled.ul`
  list-style-type: none;
  font-size: 12px;
  color: ${colors.errorText};
  margin-bottom: 5px;
  text-align: right;
  text-transform: uppercase;
  position: relative;
  font-weight: 600;
  top: 20px;
`;

export const ControlHint = styled.p`
  margin-bottom: 0;
  padding: 3px 0;
  font-size: 12px;
  color: ${props =>
    props.error ? colors.errorText : props.active ? colors.active : colors.controlLabel};
  transition: color ${transitions.main};
`;

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
    onValidate: PropTypes.func,
    processControlRef: PropTypes.func,
    controlRef: PropTypes.func,
    query: PropTypes.func.isRequired,
    queryHits: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    isFetching: PropTypes.bool,
    clearSearch: PropTypes.func.isRequired,
    clearFieldErrors: PropTypes.func.isRequired,
    loadEntry: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    isEditorComponent: PropTypes.bool,
    isNewEditorComponent: PropTypes.bool,
    parentIds: PropTypes.arrayOf(PropTypes.string),
    entry: ImmutablePropTypes.map.isRequired,
    collection: ImmutablePropTypes.map.isRequired,
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
      validateMetaField,
    } = this.props;

    const widgetName = field.get('widget');
    const widget = resolveWidget(widgetName);
    const fieldName = field.get('name');
    const fieldHint = field.get('hint');
    const isFieldOptional = field.get('required') === false;
    const onValidateObject = onValidate;
    const metadata = fieldsMetaData && fieldsMetaData.get(fieldName);
    const errors = fieldsErrors && fieldsErrors.get(this.uniqueFieldId);
    const childErrors = this.isAncestorOfFieldError();
    const hasErrors = !!errors || childErrors;

    return (
      <ClassNames>
        {({ css, cx }) => (
          <ControlContainer className={className}>
            {widget.globalStyles && <Global styles={coreCss`${widget.globalStyles}`} />}
            {errors && (
              <ControlErrorsList>
                {errors.map(
                  error =>
                    error.message &&
                    typeof error.message === 'string' && (
                      <li key={error.message.trim().replace(/[^a-z0-9]+/gi, '-')}>
                        {error.message}
                      </li>
                    ),
                )}
              </ControlErrorsList>
            )}
            <FieldLabel
              isActive={isSelected || this.state.styleActive}
              hasErrors={hasErrors}
              htmlFor={this.uniqueFieldId}
            >
              {`${field.get('label', field.get('name'))}${
                isFieldOptional ? ` (${t('editor.editorControl.field.optional')})` : ''
              }`}
            </FieldLabel>
            <Widget
              classNameWrapper={cx(
                css`
                  ${styleStrings.widget};
                `,
                {
                  [css`
                    ${styleStrings.widgetActive};
                  `]: isSelected || this.state.styleActive,
                },
                {
                  [css`
                    ${styleStrings.widgetError};
                  `]: hasErrors,
                },
              )}
              classNameWidget={css`
                ${styleStrings.widget};
              `}
              classNameWidgetActive={css`
                ${styleStrings.widgetActive};
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
              value={value}
              mediaPaths={mediaPaths}
              metadata={metadata}
              onChange={(newValue, newMetadata) => onChange(field, newValue, newMetadata)}
              onValidate={onValidate && partial(onValidate, this.uniqueFieldId)}
              onOpenMediaLibrary={openMediaLibrary}
              onClearMediaControl={clearMediaControl}
              onRemoveMediaControl={removeMediaControl}
              onRemoveInsertedMedia={removeInsertedMedia}
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
              queryHits={queryHits}
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
            />
            {fieldHint && (
              <ControlHint active={isSelected || this.state.styleActive} error={hasErrors}>
                {fieldHint}
              </ControlHint>
            )}
          </ControlContainer>
        )}
      </ClassNames>
    );
  }
}

const mapStateToProps = state => {
  const { collections, entryDraft } = state;
  const entry = entryDraft.get('entry');
  const collection = collections.get(entryDraft.getIn(['entry', 'collection']));
  const isLoadingAsset = selectIsLoadingAsset(state.medias);

  const loadEntry = async (collectionName, slug) => {
    const targetCollection = collections.get(collectionName);
    if (targetCollection) {
      const loadedEntry = await tryLoadEntry(state, targetCollection, slug);
      return loadedEntry;
    } else {
      throw new Error(`Can't find collection '${collectionName}'`);
    }
  };

  return {
    mediaPaths: state.mediaLibrary.get('controlMedia'),
    isFetching: state.search.get('isFetching'),
    queryHits: state.search.get('queryHits'),
    config: state.config,
    entry,
    collection,
    isLoadingAsset,
    loadEntry,
    validateMetaField: (field, value, t) => validateMetaField(state, collection, field, value, t),
  };
};

const mapDispatchToProps = dispatch => {
  const creators = bindActionCreators(
    {
      openMediaLibrary,
      clearMediaControl,
      removeMediaControl,
      removeInsertedMedia,
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
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    boundGetAsset: dispatchProps.boundGetAsset(stateProps.collection, stateProps.entry),
  };
};

const ConnectedEditorControl = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(translate()(EditorControl));

export default ConnectedEditorControl;

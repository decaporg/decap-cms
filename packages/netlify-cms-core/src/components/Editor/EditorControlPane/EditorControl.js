/** @jsx jsx */
import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { translate } from 'react-polyglot';
import { jsx, ClassNames, Global, css as coreCss } from '@emotion/core';
import styled from '@emotion/styled';
import { partial, uniqueId } from 'lodash';
import { connect } from 'react-redux';
import { colors, colorsRaw, transitions, lengths, borders } from 'netlify-cms-ui-default';
import { resolveWidget, getEditorComponents } from 'Lib/registry';
import { clearFieldErrors, loadEntry } from 'Actions/entries';
import { addAsset } from 'Actions/media';
import { query, clearSearch } from 'Actions/search';
import {
  openMediaLibrary,
  removeInsertedMedia,
  clearMediaControl,
  removeMediaControl,
} from 'Actions/mediaLibrary';
import { getAsset } from 'Reducers';
import Widget from './Widget';

/**
 * This is a necessary bridge as we are still passing classnames to widgets
 * for styling. Once that changes we can stop storing raw style strings like
 * this.
 */
const styleStrings = {
  label: `
    color: ${colors.controlLabel};
    background-color: ${colors.textFieldBorder};
    display: inline-block;
    font-size: 12px;
    text-transform: uppercase;
    font-weight: 600;
    border: 0;
    border-radius: 3px 3px 0 0;
    padding: 3px 6px 2px;
    margin: 0;
    transition: all ${transitions.main};
    position: relative;

    /**
     * Faux outside curve into top of input
     */
    &:before,
    &:after {
      content: '';
      display: block;
      position: absolute;
      top: 0;
      right: -4px;
      height: 100%;
      width: 4px;
      background-color: inherit;
    }

    &:after {
      border-bottom-left-radius: 3px;
      background-color: #fff;
    }
  `,
  labelActive: `
    background-color: ${colors.active};
    color: ${colors.textLight};
  `,
  labelError: `
    background-color: ${colors.errorText};
    color: ${colorsRaw.white};
  `,
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
  };

  state = {
    activeLabel: false,
  };

  uniqueFieldId = uniqueId(`${this.props.field.get('name')}-field-`);

  render() {
    const {
      value,
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
      t,
    } = this.props;
    const widgetName = field.get('widget');
    const widget = resolveWidget(widgetName);
    const fieldName = field.get('name');
    const fieldHint = field.get('hint');
    const isFieldOptional = field.get('required') === false;
    const onValidateObject = onValidate;
    const metadata = fieldsMetaData && fieldsMetaData.get(fieldName);
    const errors = fieldsErrors && fieldsErrors.get(this.uniqueFieldId);
    return (
      <ClassNames>
        {({ css, cx }) => (
          <ControlContainer>
            {widget.globalStyles && <Global styles={coreCss`${widget.globalStyles}`} />}
            <ControlErrorsList>
              {errors &&
                errors.map(
                  error =>
                    error.message &&
                    typeof error.message === 'string' && (
                      <li key={error.message.trim().replace(/[^a-z0-9]+/gi, '-')}>
                        {error.message}
                      </li>
                    ),
                )}
            </ControlErrorsList>
            <label
              className={cx(
                css`
                  ${styleStrings.label};
                `,
                this.state.styleActive &&
                  css`
                    ${styleStrings.labelActive};
                  `,
                !!errors &&
                  css`
                    ${styleStrings.labelError};
                  `,
              )}
              htmlFor={this.uniqueFieldId}
            >
              {`${field.get('label', field.get('name'))}${isFieldOptional ? ' (optional)' : ''}`}
            </label>
            <Widget
              classNameWrapper={cx(
                css`
                  ${styleStrings.widget};
                `,
                {
                  [css`
                    ${styleStrings.widgetActive};
                  `]: this.state.styleActive,
                },
                {
                  [css`
                    ${styleStrings.widgetError};
                  `]: !!errors,
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
              field={field}
              uniqueFieldId={this.uniqueFieldId}
              value={value}
              mediaPaths={mediaPaths}
              metadata={metadata}
              onChange={(newValue, newMetadata) => onChange(fieldName, newValue, newMetadata)}
              onValidate={onValidate && partial(onValidate, this.uniqueFieldId)}
              onOpenMediaLibrary={openMediaLibrary}
              onClearMediaControl={clearMediaControl}
              onRemoveMediaControl={removeMediaControl}
              onRemoveInsertedMedia={removeInsertedMedia}
              onAddAsset={addAsset}
              getAsset={boundGetAsset}
              hasActiveStyle={this.state.styleActive}
              setActiveStyle={() => this.setState({ styleActive: true })}
              setInactiveStyle={() => this.setState({ styleActive: false })}
              resolveWidget={resolveWidget}
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
              t={t}
            />
            {fieldHint && (
              <ControlHint active={this.state.styleActive} error={!!errors}>
                {fieldHint}
              </ControlHint>
            )}
          </ControlContainer>
        )}
      </ClassNames>
    );
  }
}

const mapStateToProps = state => ({
  mediaPaths: state.mediaLibrary.get('controlMedia'),
  boundGetAsset: getAsset.bind(null, state),
  isFetching: state.search.get('isFetching'),
  queryHits: state.search.get('queryHits'),
});

const mapDispatchToProps = {
  openMediaLibrary,
  clearMediaControl,
  removeMediaControl,
  removeInsertedMedia,
  addAsset,
  query,
  loadEntry: (collectionName, slug) => (dispatch, getState) => {
    const collection = getState().collections.get(collectionName);
    return loadEntry(collection, slug)(dispatch, getState);
  },
  clearSearch,
  clearFieldErrors,
};

const ConnectedEditorControl = connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  { withRef: true },
)(translate()(EditorControl));

export default ConnectedEditorControl;

import React from 'react';
import styled, { css, cx } from 'react-emotion';
import { partial, uniqueId } from 'lodash';
import { colors, colorsRaw, transitions, lengths, borders } from 'netlify-cms-ui-default';
import { resolveWidget } from 'Lib/registry';
import Widget from './Widget';

const styles = {
  label: css`
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
  labelActive: css`
    background-color: ${colors.active};
    color: ${colors.textLight};
  `,
  labelError: css`
    background-color: ${colors.errorText};
    color: ${colorsRaw.white};
  `,
  widget: css`
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
  widgetActive: css`
    border-color: ${colors.active};
  `,
  widgetError: css`
    border-color: ${colors.errorText};
  `,
};

const ControlContainer = styled.div`
  margin-top: 16px;

  &:first-child {
    margin-top: 36px;
  }
`

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
`



export default class EditorControl extends React.Component {
  state = {
    activeLabel: false,
  };

  render() {
    const {
      value,
      field,
      fieldsMetaData,
      fieldsErrors,
      mediaPaths,
      getAsset,
      onChange,
      onOpenMediaLibrary,
      onAddAsset,
      onRemoveInsertedMedia,
      onValidate,
      processControlRef,
    } = this.props;
    const widgetName = field.get('widget');
    const widget = resolveWidget(widgetName);
    const fieldName = field.get('name');
    const uniqueFieldId = uniqueId();
    const metadata = fieldsMetaData && fieldsMetaData.get(fieldName);
    const errors = fieldsErrors && fieldsErrors.get(fieldName);
    return (
      <ControlContainer>
        <ControlErrorsList>
          {
            errors && errors.map(error =>
              error.message &&
              typeof error.message === 'string' &&
              <li key={error.message.trim().replace(/[^a-z0-9]+/gi, '-')}>{error.message}</li>
            )
          }
        </ControlErrorsList>
        <label
          className={cx(
            styles.label,
            { [styles.labelActive]: this.state.styleActive },
            { [styles.labelError]: !!errors },
          )}
          htmlFor={fieldName + uniqueFieldId}
        >
          {field.get('label')}
        </label>
        <Widget
          classNameWrapper={cx(
            styles.widget,
            { [styles.widgetActive]: this.state.styleActive },
            { [styles.widgetError]: !!errors },
          )}
          classNameWidget={styles.widget}
          classNameWidgetActive={styles.widgetActive}
          classNameLabel={styles.label}
          classNameLabelActive={styles.labelActive}
          controlComponent={widget.control}
          field={field}
          uniqueFieldId={uniqueFieldId}
          value={value}
          mediaPaths={mediaPaths}
          metadata={metadata}
          onChange={(newValue, newMetadata) => onChange(fieldName, newValue, newMetadata)}
          onValidate={onValidate && partial(onValidate, fieldName)}
          onOpenMediaLibrary={onOpenMediaLibrary}
          onRemoveInsertedMedia={onRemoveInsertedMedia}
          onAddAsset={onAddAsset}
          getAsset={getAsset}
          hasActiveStyle={this.state.styleActive}
          setActiveStyle={() => this.setState({ styleActive: true })}
          setInactiveStyle={() => this.setState({ styleActive: false })}
          ref={processControlRef && partial(processControlRef, fieldName)}
          editorControl={EditorControl}
        />
      </ControlContainer>
    );
  }
}

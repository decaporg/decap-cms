import React from 'react';
import styled from '@emotion/styled';
import Select from 'react-select';
import isHotkey from 'is-hotkey';
import { text, shadows } from 'netlify-cms-ui-default';
import SettingsButton from './SettingsButton';
import languageSelectStyles from './languageSelectStyles';

const SettingsPaneContainer = styled.div`
  position: absolute;
  right: 0;
  width: 200px;
  z-index: 10;
  height: 100%;
  background-color: #fff;
  overflow-y: scroll;
  padding: 12px;
  ${shadows.drop};
`;

const SettingsFieldLabel = styled.label`
  ${text.fieldLabel};
  font-size: 11px;
  display: block;
  margin-top: 8px;
  margin-bottom: 2px;
`;

const SettingsSectionTitle = styled.h3`
  font-size: 14px;
  margin-top: 14px;
  margin-bottom: 0;

  &:first-of-type {
    margin-top: 4px;
  }
`;

const SettingsSelect = ({ value, options, onChange, forID, type, autoFocus }) => (
  <Select
    inputId={`${forID}-select-${type}`}
    styles={languageSelectStyles}
    value={value}
    options={options}
    onChange={opt => onChange(opt.value)}
    menuPlacement="auto"
    captureMenuScroll={false}
    autoFocus={autoFocus}
  />
);

const SettingsPane = ({
  hideSettings,
  forID,
  modes,
  mode,
  theme,
  themes,
  keyMap,
  keyMaps,
  allowLanguageSelection,
  onChangeLang,
  onChangeTheme,
  onChangeKeyMap,
}) => (
  <SettingsPaneContainer onKeyDown={e => isHotkey('esc', e) && hideSettings()}>
    <SettingsButton onClick={hideSettings} showClose={true} />
    {allowLanguageSelection && (
      <>
        <SettingsSectionTitle>Field Settings</SettingsSectionTitle>
        <SettingsFieldLabel htmlFor={`${forID}-select-mode`}>Mode</SettingsFieldLabel>
        <SettingsSelect
          type="mode"
          forID={forID}
          value={mode}
          options={modes}
          onChange={onChangeLang}
          autoFocus
        />
      </>
    )}
    <>
      <SettingsSectionTitle>Global Settings</SettingsSectionTitle>
      {themes && (
        <>
          <SettingsFieldLabel htmlFor={`${forID}-select-theme`}>Theme</SettingsFieldLabel>
          <SettingsSelect
            type="theme"
            forID={forID}
            value={{ value: theme, label: theme }}
            options={themes.map(t => ({ value: t, label: t }))}
            onChange={onChangeTheme}
            autoFocus={!allowLanguageSelection}
          />
        </>
      )}
      <SettingsFieldLabel htmlFor={`${forID}-select-keymap`}>KeyMap</SettingsFieldLabel>
      <SettingsSelect
        type="keymap"
        forID={forID}
        value={keyMap}
        options={keyMaps}
        onChange={onChangeKeyMap}
      />
    </>
  </SettingsPaneContainer>
);

export default SettingsPane;

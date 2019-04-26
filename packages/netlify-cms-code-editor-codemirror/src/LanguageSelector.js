/** @jsx jsx */
/* eslint-disable react/prop-types */
import React from 'react';
import { jsx, css } from '@emotion/core';
import Select from 'react-select';
import { reactSelectStyles } from 'netlify-cms-ui-default';

const selectStyles = {
  ...reactSelectStyles,
  container: provided => ({
    ...reactSelectStyles.container(provided),
    width: '120px',
    position: 'absolute',
    zIndex: 2,
    right: '8px',
    top: '8px',
    transition: 'opacity 1s',
    transitionTimingFunction: 'cubic-bezier(.75,.02,.7,1)',
    opacity: '0.2',
    ':hover,:focus-within': {
      opacity: '1',
      transition: 'opacity .2s ease',
    },
  }),
  control: provided => ({
    ...reactSelectStyles.control(provided),
    padding: 0,
    fontSize: '13px',
    minHeight: 'auto',
  }),
  dropdownIndicator: provided => ({
    ...reactSelectStyles.dropdownIndicator(provided),
    padding: '4px',
  }),
  option: (provided, state) => ({
    ...reactSelectStyles.option(provided, state),
    padding: 0,
    paddingLeft: '8px',
  }),
  menu: (provided, state) => ({
    ...reactSelectStyles.menu(provided),
    margin: '2px 0',
  }),
};

const LanguageSelector = props => (
  <Select styles={selectStyles} {...props}/>
);

export default LanguageSelector;

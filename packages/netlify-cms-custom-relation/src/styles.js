import { colors } from 'netlify-cms-ui-default/src';

const reactSelectStyles = {
  control: styles => ({
    ...styles,
    border: 0,
    boxShadow: 'none',
    padding: '9px 0 9px 12px',
  }),
  option: (styles, state) => ({
    ...styles,
    backgroundColor: state.isSelected
      ? colors.active
      : state.isFocused
      ? colors.activeBackground
      : 'transparent',
    paddingLeft: '22px',
  }),
  menu: styles => ({ ...styles, right: 0, zIndex: 2 }),
  container: styles => ({ ...styles, padding: '0 !important' }),
  indicatorSeparator: (styles, state) =>
    state.hasValue && state.selectProps.isClearable
      ? { ...styles, backgroundColor: colors.textFieldBorder }
      : { display: 'none' },
  dropdownIndicator: styles => ({ ...styles, color: colors.controlLabel }),
  clearIndicator: styles => ({ ...styles, color: colors.controlLabel }),
  multiValue: styles => ({
    ...styles,
    backgroundColor: colors.background,
  }),
  multiValueLabel: styles => ({
    ...styles,
    color: colors.textLead,
    fontWeight: 500,
  }),
  multiValueRemove: styles => ({
    ...styles,
    color: colors.controlLabel,
    ':hover': {
      color: colors.errorText,
      backgroundColor: colors.errorBackground,
    },
  }),
};

export default reactSelectStyles;

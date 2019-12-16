import { reactSelectStyles, borders } from 'netlify-cms-ui-default';

const languageSelectStyles = {
  ...reactSelectStyles,
  container: provided => ({
    ...reactSelectStyles.container(provided),
    'margin-top': '2px',
  }),
  control: provided => ({
    ...reactSelectStyles.control(provided),
    border: borders.textField,
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
  menu: provided => ({
    ...reactSelectStyles.menu(provided),
    margin: '2px 0',
  }),
  menuList: provided => ({
    ...provided,
    'max-height': '200px',
  }),
};

export default languageSelectStyles;

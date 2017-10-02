import PropTypes from 'prop-types';
import React from 'react';
import DateTime from 'react-datetime';

export default class DateTimeControl extends React.Component {
  componentDidMount() {
    const { value, onChange } = this.props;
    if (value == null) {
      onChange(new Date());
    }
    if (value === false) {
      onChange('');
    }
  }

  handleChange = (datetime) => {
    this.props.onChange(datetime);
  };

  render() {
    return <DateTime value={this.props.value} onChange={this.handleChange} />;
  }
}

DateTimeControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
  ]),
};

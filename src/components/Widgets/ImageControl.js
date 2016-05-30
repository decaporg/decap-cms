import React from 'react';

export default class ImageControl extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    this.props.onChange(e.target.value);
  }

  render() {
    return <input type="file" onChange={this.handleChange}/>;
  }
}

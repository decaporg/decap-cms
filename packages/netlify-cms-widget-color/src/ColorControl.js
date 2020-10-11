import React from 'react';
import PropTypes from 'prop-types';
import ChromePicker from 'react-color';
import validateColor from 'validate-color';

export default class ColorControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string,
    value: PropTypes.node,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  };

  static defaultProps = {
    value: '',
  };

  state = {
    showColorPicker: false,
  };
  // show/hide color picker
  handleClick = () => {
    this.setState({ showColorPicker: !this.state.showColorPicker });
  };
  handleClear = () => {
    this.props.onChange('');
  };
  handleClose = () => {
    this.setState({ showColorPicker: false });
  };
  handleChange = color => {
    const formatedColor =
      color.rgb.a < 1
        ? `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`
        : color.hex;
    this.props.onChange(formatedColor);
  };
  render() {
    const allowInput = this.props.field.get('allowInput') || false;
    const {
      forID,
      value,
      onChange,
      classNameWrapper,
      setActiveStyle,
      setInactiveStyle,
    } = this.props;
    return (
      <>
        {' '}
        {!allowInput && value ? (
          <div
            style={{
              position: 'relative',
              width: '100%',
            }}
          >
            <div
              // clear button, not displayed if allowInput: true
              style={{
                position: 'absolute',
                right: '6px',
                zIndex: '3',
                padding: '8px',
                marginTop: '11px',
              }}
              onClick={this.handleClear}
            >
              <svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path
                  fill="rgb(122, 130, 145)"
                  d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"
                ></path>
              </svg>
            </div>
          </div>
        ) : null}
        <div
          // color swatch background with checkerboard to display behind transparent colors
          style={{
            position: 'absolute',
            zIndex: '1',
            background:
              'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==")',
            height: '38px',
            width: '48px',
            marginTop: '10px',
            marginLeft: '10px',
            borderRadius: '5px',
          }}
        />
        <div
          // color swatch
          style={{
            position: 'absolute',
            zIndex: '2',
            background: validateColor(this.props.value) ? this.props.value : '#fff',
            cursor: 'pointer',
            height: '38px',
            width: '48px',
            marginTop: '10px',
            marginLeft: '10px',
            borderRadius: '5px',
            border: '2px solid rgb(223, 223, 227)',
            textAlign: 'center',
            fontSize: '27px',
            lineHeight: '1',
            paddingTop: '4px',
            userSelect: 'none',
            color: validateColor(this.props.value)
              ? 'rgba(255, 255, 255, 0)'
              : 'rgb(223, 223, 227)',
          }}
          onClick={this.handleClick}
        >
          ?
        </div>
        {this.state.showColorPicker ? (
          <div
            // color picker container
            style={{
              position: 'absolute',
              zIndex: '3',
              marginTop: '48px',
              marginLeft: '12px',
            }}
          >
            <div
              // fullscreen div to close color picker when clicking outside of picker
              style={{
                position: 'fixed',
                top: '0px',
                right: '0px',
                bottom: '0px',
                left: '0px',
              }}
              onClick={this.handleClose}
            />
            <ChromePicker
              color={value || ''}
              onChange={this.handleChange}
              disableAlpha={!this.props.field.get('enableAlpha') || false}
            />
          </div>
        ) : null}
        <input
          // text input with padding left for the color swatch
          type="text"
          id={forID}
          className={classNameWrapper}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          onFocus={setActiveStyle}
          onBlur={setInactiveStyle}
          style={{
            paddingLeft: '75px',
            paddingRight: '70px',
            color: !allowInput && '#bbb',
          }}
          // make readonly and open color picker on click if set to allowInput: false
          onClick={!allowInput && this.handleClick}
          readOnly={!allowInput}
        />
      </>
    );
  }
}

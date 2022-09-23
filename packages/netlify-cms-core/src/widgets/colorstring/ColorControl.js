import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import ChromePicker from 'react-color';
import validateColor from 'validate-color';
import { zIndex } from 'netlify-cms-ui-default';

function ClearIcon() {
  return (
    <svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        fill="rgb(122, 130, 145)"
        d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"
      ></path>
    </svg>
  );
}

const ClearButton = styled.div`
  position: absolute;
  right: 6px;
  z-index: ${zIndex.zIndex1000};
  padding: 8px;
  margin-top: 11px;
`;

const ClearButtonWrapper = styled.div`
  position: relative;
  width: 100%;
`;

// color swatch background with checkerboard to display behind transparent colors
const ColorSwatchBackground = styled.div`
  position: absolute;
  z-index: ${zIndex.zIndex1};
  background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==');
  height: 38px;
  width: 48px;
  margin-top: 10px;
  margin-left: 10px;
  border-radius: 5px;
`;

const ColorSwatch = styled.div`
  position: absolute;
  z-index: ${zIndex.zIndex2};
  background: ${props => props.background};
  cursor: pointer;
  height: 38px;
  width: 48px;
  margin-top: 10px;
  margin-left: 10px;
  border-radius: 5px;
  border: 2px solid rgb(223, 223, 227);
  text-align: center;
  font-size: 27px;
  line-height: 1;
  padding-top: 4px;
  user-select: none;
  color: ${props => props.color};
`;

const ColorPickerContainer = styled.div`
  position: absolute;
  z-index: ${zIndex.zIndex1000};
  margin-top: 48px;
  margin-left: 12px;
`;

// fullscreen div to close color picker when clicking outside of picker
const ClickOutsideDiv = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`;

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
    const formattedColor =
      color.rgb.a < 1
        ? `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`
        : color.hex;
    this.props.onChange(formattedColor);
  };
  render() {
    const { forID, value, field, onChange, classNameWrapper, setActiveStyle, setInactiveStyle } =
      this.props;

    const allowInput = field.get('allowInput', false);

    // clear button is not displayed if allowInput: true
    const showClearButton = !allowInput && value;

    return (
      <>
        {' '}
        {showClearButton && (
          <ClearButtonWrapper>
            <ClearButton onClick={this.handleClear}>
              <ClearIcon />
            </ClearButton>
          </ClearButtonWrapper>
        )}
        <ColorSwatchBackground />
        <ColorSwatch
          background={validateColor(this.props.value) ? this.props.value : '#fff'}
          color={validateColor(this.props.value) ? 'rgba(255, 255, 255, 0)' : 'rgb(223, 223, 227)'}
          onClick={this.handleClick}
        >
          ?
        </ColorSwatch>
        {this.state.showColorPicker && (
          <ColorPickerContainer>
            <ClickOutsideDiv onClick={this.handleClose} />
            <ChromePicker
              color={value || ''}
              onChange={this.handleChange}
              disableAlpha={!field.get('enableAlpha', false)}
            />
          </ColorPickerContainer>
        )}
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
          onClick={!allowInput ? this.handleClick : undefined}
          readOnly={!allowInput}
        />
      </>
    );
  }
}

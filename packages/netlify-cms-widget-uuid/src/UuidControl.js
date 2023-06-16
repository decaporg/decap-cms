import React from 'react';
import PropTypes from 'prop-types';
import base32Encode from 'base32-encode';
import hexToArrayBuffer from 'hex-to-array-buffer';

export default class UuidControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string,
    value: PropTypes.node,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  };

  // The selection to maintain for the input element
  _sel = 0;

  // The input element ref
  _el = null;

  // NOTE: This prevents the cursor from jumping to the end of the text for
  // nested inputs. In other words, this is not an issue on top-level text
  // fields such as the `title` of a collection post. However, it becomes an
  // issue on fields nested within other components, namely widgets nested
  // within a `markdown` widget. For example, the alt text on a block image
  // within markdown.
  // SEE: https://github.com/netlify/netlify-cms/issues/4539
  // SEE: https://github.com/netlify/netlify-cms/issues/3578
  componentDidUpdate() {
    if (this._el && this._el.selectionStart !== this._sel) {
      this._el.setSelectionRange(this._sel, this._sel);
    }
  }

  // componentDidMount is used for generate a UUID when the page loads for the first time
  componentDidMount() {
    const { value, field, onChange } = this.props;
    if (!value) {
      const prefix = field.get('prefix', '');
      const useB32Encode = field.get('use_b32_encode', false);
      const uuid = crypto.randomUUID();
      const uuidFormatted = useB32Encode ? this.uuidToB32(uuid) : uuid;
      onChange(prefix + uuidFormatted);
    }
  }

  uuidToB32 = uuid => {
    const bytes = hexToArrayBuffer(uuid.replace(/-/g, '') || '');
    const encodedUUID = base32Encode(bytes, 'RFC4648', { padding: false });
    return encodedUUID.toLowerCase();
  };

  handleChange = e => {
    this._sel = e.target.selectionStart;
    this.props.onChange(e.target.value);
  };

  render() {
    const { field, forID, value, classNameWrapper, setActiveStyle, setInactiveStyle } = this.props;
    const readOnly = field.get('read_only', true);

    return (
      <input
        ref={el => {
          this._el = el;
        }}
        type="text"
        id={forID}
        readOnly={readOnly}
        style={{ fontFamily: 'monospace', opacity: readOnly ? '0.5' : '1.0' }}
        className={classNameWrapper}
        value={value || ''}
        onChange={this.handleChange}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
      />
    );
  }
}

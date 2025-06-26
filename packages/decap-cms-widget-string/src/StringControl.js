import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css } from '@emotion/react';

const innerWrapper = css`
  display: flex;
  align-items: baseline;
`;

export default class StringControl extends React.Component {
  static propTypes = {
    field: ImmutablePropTypes.map.isRequired,
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

  // The selection to maintain for the input element
  _sel = 0;

  // The input element ref
  _el = null;

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(StringControl.propTypes, this.props, 'prop', 'StringControl');
  }

  // NOTE: This prevents the cursor from jumping to the end of the text for
  // nested inputs. In other words, this is not an issue on top-level text
  // fields such as the `title` of a collection post. However, it becomes an
  // issue on fields nested within other components, namely widgets nested
  // within a `markdown` widget. For example, the alt text on a block image
  // within markdown.
  // SEE: https://github.com/decaporg/decap-cms/issues/4539
  // SEE: https://github.com/decaporg/decap-cms/issues/3578
  componentDidUpdate() {
    if (this._el && this._el.selectionStart !== this._sel) {
      this._el.setSelectionRange(this._sel, this._sel);
    }
  }

  handleChange = e => {
    this._sel = e.target.selectionStart;
    this.props.onChange(e.target.value);
  };

  render() {
    const { field, forID, value, classNameWrapper, setActiveStyle, setInactiveStyle } = this.props;

    const prefix = field.get('prefix', false);
    const suffix = field.get('suffix', false);

    return (
      <div className={classNameWrapper}>
        <div css={innerWrapper}>
          {prefix && <span>{prefix}&nbsp;</span>}
          <input
            ref={el => {
              this._el = el;
            }}
            type="text"
            id={forID}
            value={value || ''}
            onChange={this.handleChange}
            onFocus={setActiveStyle}
            onBlur={setInactiveStyle}
            css={css`
              flex-grow: 1;
            `}
          />
          {suffix && <span>&nbsp;{suffix}</span>}
        </div>
      </div>
    );
  }
}

import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css } from '@emotion/react';
import { Toggle, ToggleBackground, colors } from 'decap-cms-ui-default';

const innerWrapper = css`
  display: flex;
  align-items: center;
`;

function BooleanBackground({ isActive, ...props }) {
  return (
    <ToggleBackground
      css={css`
        background-color: ${isActive ? colors.active : colors.textFieldBorder};
      `}
      {...props}
    />
  );
}

export default class BooleanControl extends React.Component {
  static propTypes = {
    field: ImmutablePropTypes.map.isRequired,
    onChange: PropTypes.func.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
    forID: PropTypes.string,
    value: PropTypes.bool,
  };

  static defaultProps = {
    value: false,
  };

  render() {
    const { value, forID, onChange, classNameWrapper, setActiveStyle, setInactiveStyle, field } =
      this.props;

    const prefix = field.get('prefix', false);
    const suffix = field.get('suffix', false);

    return (
      <div className={classNameWrapper}>
        <div css={innerWrapper}>
          {prefix && <span>{prefix}&nbsp;</span>}
          <Toggle
            id={forID}
            active={value}
            onChange={onChange}
            onFocus={setActiveStyle}
            onBlur={setInactiveStyle}
            Background={BooleanBackground}
          />
          {suffix && <span>&nbsp;{suffix}</span>}
        </div>
      </div>
    );
  }
}

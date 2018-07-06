import React from 'react'
import styled, { css, cx } from 'react-emotion';
import ReactToggled from 'react-toggled';
import { colors, colorsRaw, shadows, transitions } from './styles';

const styles = {
  switch: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 40px;
    height: 20px;
    cursor: pointer;
  `,
  switchHandle: css`
    ${shadows.dropDeep};
    position: absolute;
    left: 0;
    top: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: ${colorsRaw.white};
    transition: transform ${transitions.main};
  `,
  switchHandleActive: css`
    transform: translateX(20px);
  `,
  switchBackground: css`
    width: 34px;
    height: 14px;
    border-radius: 10px;
    background-color: ${colors.active};
  `,
};

const Toggle = ({
  active,
  onChange,
  className,
  classNameBackground,
  classNameSwitch,
  onFocus,
  onBlur
}) =>
  <ReactToggled on={active} onToggle={onChange}>
    {({on, getElementTogglerProps}) => (
      <span
        className={cx(styles.switch, className)}
        role="switch"
        aria-checked={on.toString()}
        onFocus={onFocus}
        onBlur={onBlur}
        {...getElementTogglerProps()}
      >
        <span className={cx(styles.switchBackground, classNameBackground)}/>
        <span className={cx(
          styles.switchHandle,
          classNameSwitch,
          { [styles.switchHandleActive]: on },
        )}/>
      </span>
    )}
  </ReactToggled>;

export default styled(Toggle)``

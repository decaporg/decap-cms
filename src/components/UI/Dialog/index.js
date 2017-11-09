import React from 'react';
import RTDialog from 'react-toolbox/lib/dialog';
import Overlay from 'react-toolbox/lib/overlay';
import ProgressBar from 'react-toolbox/lib/progress_bar';
import FocusTrap from './FocusTrap';

const dialogTheme = {
  wrapper: 'nc-dialog-wrapper',
  dialog: 'nc-dialog-root',
  body: 'nc-dialog-body',
};

const progressOverlayTheme = {
  overlay: 'nc-dialog-progressOverlay',
  active: 'nc-dialog-progressOverlay-active',
};

const progressBarTheme = {
  linear: 'nc-dialog-progressBar-linear',
};

const Dialog = ({
  type,
  isVisible,
  isLoading,
  loadingMessage,
  onClose,
  footer,
  className,
  children,
}) =>
  <RTDialog
    type={type || 'large'}
    active={isVisible}
    onEscKeyDown={onClose}
    onOverlayClick={onClose}
    theme={dialogTheme}
    className={className}
  >
    <FocusTrap
      active={isVisible && !isLoading}
      focusTrapOptions={{ clickOutsideDeactivates: true, fallbackFocus: '.fallbackFocus' }}
      className="nc-dialog-contentWrapper"
    >
      <Overlay active={isLoading} theme={progressOverlayTheme}>
        <FocusTrap
          active={isVisible && isLoading}
          focusTrapOptions={{ clickOutsideDeactivates: true, initialFocus: 'h1' }}
          className="nc-dialog-progressBarContainer"
        >
          <h1 style={{ marginTop: '-40px' }} tabIndex="-1">{ loadingMessage }</h1>
          <ProgressBar type="linear" mode="indeterminate" theme={progressBarTheme}/>
        </FocusTrap>
      </Overlay>

      <div className="fallbackFocus" className="nc-dialog-contentWrapper">
        {children}
      </div>

      { footer ? <div className="nc-dialog-footer">{footer}</div> : null }

    </FocusTrap>
  </RTDialog>;

export default Dialog;

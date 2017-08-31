import React from 'react';
import RTDialog from 'react-toolbox/lib/dialog';
import Overlay from 'react-toolbox/lib/overlay';
import ProgressBar from 'react-toolbox/lib/progress_bar';
import FocusTrap from './FocusTrap';
import styles from './Dialog.css';
import dialogTheme from './dialogTheme.css';
import progressBarTheme from './progressBarTheme.css';
import progressOverlayTheme from './progressOverlayTheme.css';

const Dialog = ({ type, isVisible, isLoading, loadingMessage, onClose, footer, children }) =>
  <RTDialog
    type={type || 'large'}
    active={isVisible}
    onEscKeyDown={onClose}
    onOverlayClick={onClose}
    theme={dialogTheme}
  >
    <FocusTrap
      active={isVisible && !isLoading}
      focusTrapOptions={{ clickOutsideDeactivates: true, fallbackFocus: '.fallbackFocus' }}
      className={styles.dialogContentWrapper}
    >
      <Overlay active={isLoading} theme={progressOverlayTheme}>
        <FocusTrap
          active={isVisible && isLoading}
          focusTrapOptions={{ clickOutsideDeactivates: true, initialFocus: 'h1' }}
          className={styles.progressBarContainer}
        >
          <h1 style={{ marginTop: '-40px' }} tabIndex="-1">{ loadingMessage }</h1>
          <ProgressBar type="linear" mode="indeterminate" theme={progressBarTheme}/>
        </FocusTrap>
      </Overlay>

      <div className="fallbackFocus" className={styles.dialogContentWrapper}>
        {children}
      </div>

      { footer ? <div className={styles.footer}>{footer}</div> : null }

    </FocusTrap>
  </RTDialog>;

export default Dialog;

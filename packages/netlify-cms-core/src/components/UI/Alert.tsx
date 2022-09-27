import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import React, { useCallback, useMemo, useState } from 'react';
import { translate, TranslateProps } from 'react-polyglot';

import AlertEvent from '../../lib/util/events/AlertEvent';
import { useWindowEvent } from '../../lib/util/window.util';

interface AlertProps {
  title: string | { key: string; options?: any };
  body: string | { key: string; options?: any };
  okay?: string | { key: string; options?: any };
  color?: 'success' | 'error' | 'primary';
}

export interface AlertDialogProps extends AlertProps {
  resolve: () => void;
}

const AlertDialog = ({ t }: TranslateProps) => {
  const [detail, setDetail] = useState<AlertDialogProps | null>(null);
  const {
    resolve,
    title: rawTitle,
    body: rawBody,
    okay: rawOkay = 'ui.common.okay',
    color = 'primary',
  } = detail ?? {};

  const onAlertMessage = useCallback((event: AlertEvent) => {
    setDetail(event.detail);
  }, []);

  useWindowEvent('alert', onAlertMessage);

  const handleClose = useCallback(() => {
    setDetail(null);
    resolve?.();
  }, [resolve]);

  const title = useMemo(() => {
    if (!rawTitle) {
      return '';
    }
    return typeof rawTitle === 'string' ? t(rawTitle) : t(rawTitle.key, rawTitle.options);
  }, [rawTitle]);

  const body = useMemo(() => {
    if (!rawBody) {
      return '';
    }
    return typeof rawBody === 'string' ? t(rawBody) : t(rawBody.key, rawBody.options);
  }, [rawBody]);

  const okay = useMemo(
    () => (typeof rawOkay === 'string' ? t(rawOkay) : t(rawOkay.key, rawOkay.options)),
    [rawOkay],
  );

  if (!detail) {
    return null;
  }

  return (
    <div>
      <Dialog
        open
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{t(title)}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">{body}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained" color={color}>
            {okay}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export const Alert = translate()(AlertDialog);

const alert = (props: AlertProps) => {
  return new Promise<void>(resolve => {
    window.dispatchEvent(
      new AlertEvent({
        ...props,
        resolve,
      }),
    );
  });
};

export default alert;

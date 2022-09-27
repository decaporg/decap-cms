import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import React, { useCallback, useMemo, useState } from 'react';
import { translate, TranslateProps } from 'react-polyglot';

import ConfirmEvent from '../../lib/util/events/ConfirmEvent';
import { useWindowEvent } from '../../lib/util/window.util';

interface ConfirmProps {
  title: string | { key: string; options?: any };
  body: string | { key: string; options?: any };
  cancel?: string | { key: string; options?: any };
  confirm?: string | { key: string; options?: any };
  color?: 'success' | 'error' | 'primary';
}

export interface ConfirmDialogProps extends ConfirmProps {
  resolve: (value: boolean | PromiseLike<boolean>) => void;
}

const ConfirmDialog = ({ t }: TranslateProps) => {
  const [detail, setDetail] = useState<ConfirmDialogProps | null>(null);
  const {
    resolve,
    title: rawTitle,
    body: rawBody,
    cancel: rawCancel = 'ui.common.no',
    confirm: rawConfirm = 'ui.common.yes',
    color = 'primary',
  } = detail ?? {};

  const onConfirmMessage = useCallback((event: ConfirmEvent) => {
    setDetail(event.detail);
  }, []);

  useWindowEvent('confirm', onConfirmMessage);

  const handleClose = useCallback(() => {
    setDetail(null);
  }, []);

  const handleCancel = useCallback(() => {
    resolve?.(false);
    handleClose();
  }, [handleClose, resolve]);

  const handleConfirm = useCallback(() => {
    resolve?.(true);
    handleClose();
  }, [handleClose, resolve]);

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

  const cancel = useMemo(
    () => (typeof rawCancel === 'string' ? t(rawCancel) : t(rawCancel.key, rawCancel.options)),
    [rawCancel],
  );

  const confirm = useMemo(
    () => (typeof rawConfirm === 'string' ? t(rawConfirm) : t(rawConfirm.key, rawConfirm.options)),
    [rawConfirm],
  );

  if (!detail) {
    return null;
  }

  return (
    <div>
      <Dialog
        open
        onClose={handleCancel}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">{body}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="inherit">
            {cancel}
          </Button>
          <Button onClick={handleConfirm} variant="contained" color={color}>
            {confirm}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export const Confirm = translate()(ConfirmDialog);

const confirm = (props: ConfirmProps) => {
  return new Promise<boolean>(resolve => {
    window.dispatchEvent(
      new ConfirmEvent({
        ...props,
        resolve,
      }),
    );
  });
};

export default confirm;

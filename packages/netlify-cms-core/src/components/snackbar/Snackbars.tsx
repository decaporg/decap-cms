import CloseIcon from '@mui/icons-material/Close';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import React, { useCallback, useEffect, useState } from 'react';
import { translate } from 'react-polyglot';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeSnackbarById, selectSnackbars } from '../../store/slices/snackbars';

import type { TranslatedProps } from '../../interface';
import type { SnackbarMessage } from '../../store/slices/snackbars';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface SnackbarsProps {}

const Snackbars = ({ t }: TranslatedProps<SnackbarsProps>) => {
  const [open, setOpen] = React.useState(false);
  const [messageInfo, setMessageInfo] = useState<SnackbarMessage | undefined>(undefined);

  const snackbars = useAppSelector(selectSnackbars);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (snackbars.length && !messageInfo) {
      // Set a new snack when we don't have an active one
      const snackbar = { ...snackbars[0] };
      setMessageInfo(snackbar);
      dispatch(removeSnackbarById(snackbar.id));
      setOpen(true);
    } else if (snackbars.length && messageInfo && open) {
      // Close an active snack when a new one is added
      setOpen(false);
    }
  }, [snackbars, messageInfo, open]);

  const handleClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  }, []);

  const handleExited = () => {
    setMessageInfo(undefined);
  };

  const renderAlert = useCallback(
    (data: SnackbarMessage) => {
      const {
        type,
        message: { key, ...options },
      } = data;

      return (
        <Alert key="message" onClose={handleClose} severity={type} sx={{ width: '100%' }}>
          {t(key, options)}
        </Alert>
      );
    },
    [handleClose, t],
  );

  return (
    <Snackbar
      key={messageInfo ? messageInfo.id : undefined}
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      TransitionProps={{ onExited: handleExited }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      action={
        <IconButton aria-label="close" color="inherit" sx={{ p: 0.5 }} onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      }
    >
      {messageInfo ? renderAlert(messageInfo) : undefined}
    </Snackbar>
  );
};

export default translate()(Snackbars);

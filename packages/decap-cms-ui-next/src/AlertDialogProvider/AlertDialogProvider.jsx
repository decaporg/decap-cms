import React, { useContext, createContext, useState } from 'react';
import styled from '@emotion/styled';

import Dialog from '../Dialog';
import { Button, ButtonGroup } from '../Buttons';
import { TextField } from '../Fields';
import { result } from 'lodash';

const DialogContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AlertDialogContext = createContext();

export function useAlertDialogContext() {
  const context = useContext(AlertDialogContext);

  if (!context) {
    throw new Error('useAlertDialogContext must be used within a AlertDialogProvider');
  }

  return context;
}

export function AlertDialogProvider({ children }) {
  const [dialogConfig, setDialogConfig] = useState({
    open: false,
    type: '',
    title: '',
    message: '',
    defaultValue: '',
    promptInputValue: '',
    actionButton: '',
    cancelButton: '',
    onConfirm: null,
    onCancel: null,
  });

  function openDialog({ type, title, message, defaultValue, actionButton, cancelButton }) {
    return new Promise((resolve, reject) => {
      setDialogConfig({
        open: true,
        type,
        title,
        message,
        defaultValue,
        promptInputValue: defaultValue || '',
        actionButton,
        cancelButton,
        onConfirm: result => resolve(result),
        onCancel: () => resolve(false),
      });
    });
  }

  function closeDialog() {
    setDialogConfig({ ...dialogConfig, open: false });
  }

  function handleConfirm() {
    if (dialogConfig.onConfirm) {
      if (dialogConfig.type === 'prompt') {
        dialogConfig.onConfirm(dialogConfig.promptInputValue);
      } else {
        dialogConfig.onConfirm(true);
      }
    }
    closeDialog();
  }

  function handleCancel() {
    if (dialogConfig.onCancel) dialogConfig.onCancel();
    closeDialog();
  }

  function handlePromptInputChange(event) {
    setDialogConfig({ ...dialogConfig, promptInputValue: event.target.value });
  }

  return (
    <AlertDialogContext.Provider
      value={{
        open: dialogConfig.open,
        type: dialogConfig.type,
        title: dialogConfig.title,
        message: dialogConfig.message,
        defaultValue: dialogConfig.defaultValue,
        actionButton: dialogConfig.actionButton,
        cancelButton: dialogConfig.cancelButton,
        onConfirm: dialogConfig.onConfirm,
        onCancel: dialogConfig.onCancel,
        openDialog,
      }}
    >
      {children}

      <Dialog
        open={dialogConfig.open}
        title={dialogConfig.title}
        onClose={closeDialog}
        disableBackdropClick={true}
        actions={
          dialogConfig.type === 'alert' ? (
            <Button onClick={handleConfirm}>{dialogConfig.actionButton}</Button>
          ) : dialogConfig.type === 'confirm' ? (
            <ButtonGroup>
              <Button onClick={handleCancel} type="danger">
                {dialogConfig.cancelButton}
              </Button>
              <Button type="success" onClick={handleConfirm}>
                {dialogConfig.actionButton}
              </Button>
            </ButtonGroup>
          ) : dialogConfig.type === 'prompt' ? (
            <ButtonGroup>
              <Button onClick={handleCancel} type="danger">
                {dialogConfig.cancelButton}
              </Button>
              <Button type="success" onClick={handleConfirm}>
                {dialogConfig.actionButton}
              </Button>
            </ButtonGroup>
          ) : null
        }
      >
        <DialogContent>
          {dialogConfig.message}

          {dialogConfig.type === 'prompt' && (
            <TextField
              type="text"
              value={dialogConfig.promptInputValue}
              onChange={handlePromptInputChange}
              focus
            />
          )}
        </DialogContent>
      </Dialog>
    </AlertDialogContext.Provider>
  );
}

import { useAlertDialogContext } from '../AlertDialogProvider';

export function useAlert() {
  const { openDialog } = useAlertDialogContext();

  return async ({ title, message, actionButton }) =>
    await openDialog({ type: 'alert', title, message, actionButton });
}

export function useConfirm() {
  const { openDialog } = useAlertDialogContext();

  return async ({ title, message, actionButton, cancelButton }) =>
    await openDialog({
      type: 'confirm',
      title,
      message,
      actionButton,
      cancelButton,
    });
}

export function usePrompt() {
  const { openDialog } = useAlertDialogContext();

  return async ({ title, message, defaultValue, actionButton, cancelButton }) =>
    await openDialog({
      type: 'prompt',
      defaultValue,
      title,
      message,
      actionButton,
      cancelButton,
    });
}

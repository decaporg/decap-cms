import { ConfirmDialogProps } from '../../../components/UI/Confirm';

export default class ConfirmEvent extends CustomEvent<ConfirmDialogProps> {
  constructor(detail: ConfirmDialogProps) {
    super('confirm', { detail });
  }
}

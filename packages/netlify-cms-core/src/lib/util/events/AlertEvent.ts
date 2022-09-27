import { AlertDialogProps } from '../../../components/UI/Alert';

export default class AlertEvent extends CustomEvent<AlertDialogProps> {
  constructor(detail: AlertDialogProps) {
    super('alert', { detail });
  }
}

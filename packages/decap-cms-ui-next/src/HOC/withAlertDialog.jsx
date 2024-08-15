import React from 'react';

import { useAlert, useConfirm, usePrompt } from '../hooks/useAlertDialog';

export function withAlert(Component) {
  return function WithAlert(props) {
    const alert = useAlert();

    return <Component {...props} alert={alert} />;
  };
}

export function withConfirm(Component) {
  return function WithConfirm(props) {
    const confirm = useConfirm();

    return <Component {...props} confirm={confirm} />;
  };
}

export function withPrompt(Component) {
  return function WithPrompt(props) {
    const prompt = usePrompt();

    return <Component {...props} prompt={prompt} />;
  };
}

import React from 'react';
import { ToastContainer as ReactToastifyContainer } from 'react-toastify';

import CloseButton from './CloseButton';

function ToastContainer() {
  return <ReactToastifyContainer closeButton={CloseButton} />;
}

export default ToastContainer;

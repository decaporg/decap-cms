import React from 'react';
import { toast as toastify } from 'react-toastify';

import Toast from '../Toast';

function toast(props) {
  toastify(<Toast {...props} />);
}

export default toast;

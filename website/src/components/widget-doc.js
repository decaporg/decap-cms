import React from 'react';

import Markdown from './markdown';

const WidgetDoc = ({ visible, label, body, html }) => {
  if (!visible) {
    return null;
  }

  return (
    <div>
      <h3>{label}</h3>
      <Markdown source={body || html} escapeHtml={false} />
    </div>
  );
};

export default WidgetDoc;

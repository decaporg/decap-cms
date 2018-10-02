import React from 'react';
import classnames from 'classnames';

const WidgetDoc = ({ visible, label, body, html }) => (
  <div className={classnames('widget', { widget_open: visible })}>
    <h3>{label}</h3>
    {body ? body : <div dangerouslySetInnerHTML={{ __html: html }} />}
  </div>
);

export default WidgetDoc;

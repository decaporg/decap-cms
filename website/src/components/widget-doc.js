import React from 'react';
import classnames from 'classnames';

const WidgetDoc = ({ isVisible, label, body, html }) => (
  <div className={classnames('widget', { widget_open: isVisible })}>
    <h3>{label}</h3>
    {body ? body : <div dangerouslySetInnerHTML={{ __html: html }} />}
  </div>
);

export default WidgetDoc;

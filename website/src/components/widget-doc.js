import React from 'react';

const WidgetDoc = ({ className, label, body, html }) => (
  <div className={className}>
    <h3>{label}</h3>
    {body ? body : <div dangerouslySetInnerHTML={{ __html: html }} />}
  </div>
);


export default WidgetDoc;

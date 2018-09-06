import React from 'react';

const WhatsNew = ({ children }) => (
  <section className="whatsnew">
    <div className="contained">
      <ol>{children}</ol>
    </div>
  </section>
);

export default WhatsNew;

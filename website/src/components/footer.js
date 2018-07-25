import React from 'react';

import '../css/imports/footer.css';

const Footer = ({ buttons }) => (
  <footer>
    <div className="contained">
      <div className="social-buttons">
        {buttons.map(btn => (
          <a href={btn.url} key={btn.url}>
            {btn.name}
          </a>
        ))}
      </div>
      <div className="footer-info">
        <p>
          <a
            href="https://github.com/netlify/netlify-cms/blob/master/LICENSE"
            className="text-link"
          >
            Distributed under MIT License
          </a>{' '}
          ·{' '}
          <a
            href="https://github.com/netlify/netlify-cms/blob/master/CODE_OF_CONDUCT.md"
            className="text-link"
          >
            Code of Conduct
          </a>
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;

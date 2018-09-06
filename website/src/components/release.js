import React from 'react';
import Markdownify from '../components/markdownify';

const Release = ({ version, date, description }) => (
  <a href={`https://github.com/netlify/netlify-cms/releases/tag/${version}`} key={version}>
    <li>
      <div className="update-metadata">
        <span className="update-version">{version}</span>
        <span className="update-date">{date}</span>
      </div>
      <span className="update-description">
        <Markdownify source={description} />
      </span>
    </li>
  </a>
);

export default Release;

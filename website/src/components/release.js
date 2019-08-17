import React from 'react';
import moment from 'moment';
import Markdownify from '../components/markdownify';

const Release = ({ version, versionPrevious, date, description, url }) => {
  const displayDate = moment(date).format('MMMM D, YYYY');
  const defaultUrl = `https://github.com/netlify/netlify-cms/compare/netlify-cms@${versionPrevious}...netlify-cms@${version}`;

  return (
    <a href={url || defaultUrl} key={version}>
      <li>
        <div className="update-metadata">
          <span className="update-version">{version}</span>
          <span className="update-date">{displayDate}</span>
        </div>
        <span className="update-description">
          <Markdownify source={description} />
        </span>
      </li>
    </a>
  );
};

export default Release;

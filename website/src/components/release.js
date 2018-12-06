import React from 'react';
import moment from 'moment';
import Markdownify from '../components/markdownify';

const Release = ({ version, versionPrevious, date, description }) => {
  console.log(version, versionPrevious);
  const displayDate = moment(date).format('MMMM D, YYYY');
  const url = `https://github.com/netlify/netlify-cms/compare/${versionPrevious}...${version}`;

  return (
    <a href={url} key={version}>
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

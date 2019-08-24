import React from 'react';
import Markdownify from '../components/markdownify';

const Community = ({ headline, subhead, sections }) => (
  <div className="community page">
    <section className="hero">
      <div className="contained">
        <div className="hero-copy">
          <h1 className="headline">
            <Markdownify source={headline} />
          </h1>
          <h2 className="subhead">
            <Markdownify source={subhead} />
          </h2>
        </div>
      </div>
    </section>

    <section className="community-channels clearfix">
      <div className="contained">
        <div className="half">
          {sections.map(({ title: sectionTitle, channels }, channelIdx) => (
            <React.Fragment key={channelIdx}>
              <h4 className="section-label">{sectionTitle}</h4>
              <ul className="community-channels-list">
                {channels.map(({ title: channelTitle, description, url }, idx) => (
                  <li key={idx}>
                    <a href={url}>
                      <strong>{channelTitle}</strong>
                      <p>{description}</p>
                    </a>
                  </li>
                ))}
              </ul>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default Community;

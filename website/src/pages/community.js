import React, { Component } from 'react';
import Helmet from 'react-helmet';
import moment from 'moment';
import Markdown from 'react-markdown';

import Markdownify from '../components/markdownify';

class EventWidget extends Component {
  state = {
    loading: false,
    eventDate: ''
  };
  componentDidMount() {
    const eventbriteToken = 'C5PX65CJBVIXWWLNFKLO';
    const eventbriteOrganiser = '14281996019';

    const url = `https://www.eventbriteapi.com/v3/events/search/?token=${eventbriteToken}&organizer.id=${eventbriteOrganiser}&expand=venue%27`;

    this.setState({
      loading: true
    });

    fetch(url)
      .then(res => res.json())
      .then(data => {
        console.log(data);

        const eventDate = data.events[0].start.utc;

        this.setState({
          loading: false,
          eventDate
        });
      })
      .catch(err => {
        console.log(err);
        // TODO: set state to show error message
        this.setState({
          loading: false
        });
      });
  }
  render() {
    const { loading, eventDate } = this.state;

    if (loading) {
      return <span>Loading...</span>;
    }

    const eventDateMoment = moment(eventDate);

    const offset = eventDateMoment.isDST() ? -7 : -8;

    const month = eventDateMoment.format('MMMM');
    const day = eventDateMoment.format('DD');

    const datePrefix = eventDateMoment.format('dddd, MMMM Do');
    const dateSuffix = eventDateMoment.utcOffset(offset).format('h a');

    return (
      <div>
        <div className="calendar">
          <div className="month">{month}</div>
          <div className="day">{day}</div>
        </div>
        <h3>
          <strong>
            {datePrefix} at {dateSuffix} PT
          </strong>
        </h3>
      </div>
    );
  }
}

const CommunityPage = ({ data }) => {
  const {
    title,
    headline,
    subhead,
    primarycta,
    upcomingevent,
    howitworks,
    howtojoin
  } = data.markdownRemark.frontmatter;

  return (
    <div className="community page">
      <Helmet title={title} />
      <section className="community hero">
        <div className="contained">
          <div className="hero-copy">
            <h1 className="headline">
              <Markdownify source={headline} />
            </h1>
            <h2 className="subhead">
              <Markdownify source={subhead} />
            </h2>
            <h3 className="ctas">
              <ul>
                <li>
                  <Markdownify source={primarycta} />
                </li>
              </ul>
            </h3>
          </div>

          <div className="calendar-cta">
            <h2>{upcomingevent.hook}</h2>
            <EventWidget />
            <div className="cal-cta">
              <Markdownify source={primarycta} />
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works clearfix">
        <div className="contained">
          <div className="half">
            <h4 className="section-label">How it works</h4>
            <p>
              <Markdown source={howitworks} />
            </p>
            <h4 className="section-label">How to join</h4>
            <p>
              <Markdown source={howtojoin} />
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export const pageQuery = graphql`
  query communityPage {
    markdownRemark(id: { regex: "/community/" }) {
      frontmatter {
        headline
        subhead
        primarycta
        upcomingevent {
          hook
        }
        howitworks
        howtojoin
      }
    }
  }
`;

export default CommunityPage;

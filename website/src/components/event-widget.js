import React, { Component } from 'react';
import moment from 'moment';

class EventWidget extends Component {
  state = {
    loading: false,
    eventDate: '',
  };

  componentDidMount() {
    const eventbriteToken = 'C5PX65CJBVIXWWLNFKLO';
    const eventbriteOrganiser = '14281996019';

    const url = `https://www.eventbriteapi.com/v3/events/search/?token=${eventbriteToken}&organizer.id=${eventbriteOrganiser}&expand=venue%27`;

    this.setState({
      loading: true,
    });

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const eventDate = data.events[0].start.utc;

        this.setState({
          loading: false,
          eventDate,
        });
      })
      .catch(err => {
        console.log(err); // eslint-disable-line no-console
        // TODO: set state to show error message
        this.setState({
          loading: false,
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

export default EventWidget;

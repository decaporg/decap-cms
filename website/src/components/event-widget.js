import React, { Component } from 'react';
import moment from 'moment';

class EventWidget extends Component {
  state = {
    errorMessage: '',
    loading: false,
    eventDate: ''
  };

  componentDidMount() {
    const eventRequest = new XMLHttpRequest();
    const eventbriteToken = 'C5PX65CJBVIXWWLNFKLO';
    const eventbriteOrganiser = '14281996019';

    const url = `https://www.eventbriteapi.com/v3/events/search/?token=${eventbriteToken}&organizer.id=${eventbriteOrganiser}&expand=venue%27`;

    this.setState({
      loading: true
    });

    eventRequest.open('GET', url, true);

    eventRequest.onload = () => {
      if (eventRequest.status >= 200 && eventRequest.status < 400) {
        // Success!
        const data = JSON.parse(eventRequest.responseText);

        const eventDate = data.events[0].start.utc;

        this.setState({
          loading: false,
          eventDate
        });
      }
    };

    eventRequest.onerror = () => {
      this.setState({
        errorMessage:
          'The event info could not be loaded at this time, please try again later.',
        loading: false
      });
    };

    eventRequest.send();
  }
  render() {
    const { errorMessage, loading, eventDate } = this.state;

    if (loading) {
      return <span>Loading...</span>;
    }

    if (errorMessage) {
      return <span>{errorMessage}</span>;
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

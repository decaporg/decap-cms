import React, { Component } from 'react';

import screenshotEditor from '../img/screenshot-editor.jpg';

class VideoEmbed extends Component {
  state = {
    toggled: false
  };
  toggleVideo = event => {
    this.setState({
      toggled: true
    });
  };
  render() {
    const { toggled } = this.state;

    const embedcode = (
      <iframe
        width={560}
        height={315}
        src="https://www.youtube-nocookie.com/embed/p6h-rYSVX90?rel=0&showinfo=0&autoplay=1"
        frameBorder={0}
        allow="autoplay; encrypted-media"
        allowFullScreen
      />
    );

    const imgPlaceholder = (
      <img src={screenshotEditor} className="responsive" />
    );

    return (
      <a className="hero-graphic" onClick={this.toggleVideo}>
        {toggled ? embedcode : imgPlaceholder}
        {!toggled && <div className="hero-videolink">&#x25b6;</div>}
      </a>
    );
  }
}

export default VideoEmbed;

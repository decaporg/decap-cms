import React, { Component } from 'react';

import screenshotEditor from '../img/screenshot-editor.jpg';

/**
 * We should be able to import complete inline svg's rather than base64, this
 * component is a stopgap for now. Source in '../img/play.svg'.
 */
const PlayIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 43 44">
    <path
      d="M41.5156904,23.7808694 L2.91022212,43.5125531 C1.92667513,44.0152549 0.721832431,43.6254529 0.219130636,42.6419059 C0.07510106,42.3601089 -3.51395713e-15,42.048155 -3.55271368e-15,41.7316838 L-1.77635684e-15,2.26831623 C-2.40215499e-15,1.16374673 0.8954305,0.268316226 2,0.268316226 C2.31647127,0.268316226 2.62842512,0.343417285 2.91022212,0.487446861 L41.5156904,20.2191306 C42.4992374,20.7218324 42.8890394,21.9266751 42.3863376,22.9102221 C42.1949001,23.2847739 41.8902421,23.5894318 41.5156904,23.7808694 Z"
      id="Triangle"
      fillRule="nonzero"
    />
  </svg>
);

class VideoEmbed extends Component {
  state = {
    toggled: false,
  };
  toggleVideo = () => {
    this.setState({
      toggled: true,
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

    const imgPlaceholder = <img src={screenshotEditor} className="responsive" />;

    return (
      <a className="hero-graphic" onClick={this.toggleVideo}>
        {toggled ? embedcode : imgPlaceholder}
        {!toggled && (
          <div className="hero-videolink">
            <PlayIcon className="hero-videolink-arrow" />
          </div>
        )}
      </a>
    );
  }
}

export default VideoEmbed;

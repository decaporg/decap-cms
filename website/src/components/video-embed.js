import React, { useState } from 'react';
import styled from '@emotion/styled';

import theme from '../theme';

import screenshotEditor from '../img/screenshot-editor.jpg';

const VideoLink = styled.a`
  position: relative;
  cursor: pointer;
  display: block;

  &:hover {
    div {
      background-color: ${theme.colors.blue};
      box-shadow: 0 6px 18px 0 rgba(0, 0, 0, 0.15), 0 2px 6px 0 rgba(0, 0, 0, 0.3);
      transform: scale(1.1);
    }
    svg {
      fill: #fff;
    }
  }

  &:active {
    div {
      transform: scale(0.9);
    }
  }

  img,
  iframe {
    width: 100%;
    border-radius: ${theme.radii[2]};
    box-shadow: 0 10px 30px 0 rgba(0, 0, 0, 0.15), 0 3px 9px 0 rgba(0, 0, 0, 0.3);
  }
`;

const VideoButton = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 90px;
  height: 90px;
  margin: auto;
  color: ${theme.colors.blue};
  background-color: rgba(255, 255, 255, 0.85);
  box-shadow: 0 3px 9px 0 rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.15);
  border-radius: 100px;
  transition: 0.1s;

  svg {
    position: absolute;
    left: 30px;
    top: 24px;
    width: 44px;
    height: 44px;
    fill: #3a69c7;
  }
`;

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

const VideoEmbed = () => {
  const [toggled, setToggled] = useState(false);

  const toggleVideo = () => setToggled(true);

  const embedcode = (
    <iframe
      title="Netlify CMS video"
      width={560}
      height={315}
      src="https://www.youtube-nocookie.com/embed/p6h-rYSVX90?rel=0&showinfo=0&autoplay=1"
      frameBorder={0}
      allow="autoplay; encrypted-media"
      allowFullScreen
    />
  );

  const imgPlaceholder = <img src={screenshotEditor} alt="Netlify CMS editor" />;

  return (
    <VideoLink onClick={toggleVideo}>
      {toggled ? embedcode : imgPlaceholder}
      {!toggled && (
        <VideoButton>
          <PlayIcon />
        </VideoButton>
      )}
    </VideoLink>
  );
};

export default VideoEmbed;

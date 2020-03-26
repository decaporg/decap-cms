import React, { useState } from 'react';
import { withKnobs, boolean, color, text } from '@storybook/addon-knobs';
import styled from '@emotion/styled';
import { withTheme } from 'emotion-theming';

import Thumbnail, { ThumbnailGrid } from '.';
import mockData from './mockData';

export default {
  title: 'Components/Thumbnail',
  decorators: [withKnobs],
};

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.color.background};
  display: flex;
  align-items: ${({ center }) => (center ? `center` : `flex-start`)};
  justify-content: center;
  overflow-y: auto;
  padding: 1rem;
  box-shadow: inset -1px 0 0 ${({ theme }) => theme.color.surface},
    inset 1px 0 0 ${({ theme }) => theme.color.surface};
`;
const StyledThumbnail = styled(Thumbnail)`
  ${({ width }) => (width ? `width: ${width}` : ``)};
  ${({ height }) => (height ? `height: ${height}` : ``)};
`;

const StoryThumbnail = ({
  previewImgSrc,
  previewImgOpacity,
  previewBgColor,
  previewText,
  supertitle,
  title,
  description,
  subtitle,
  featured,
  selectable,
  previewAspectRatio,
  width,
  height,
}) => {
  const [selected, setSelected] = useState(false);

  return (
    <StyledThumbnail
      previewImgSrc={previewImgSrc}
      previewImgOpacity={previewImgOpacity}
      previewBgColor={previewBgColor}
      previewText={previewText}
      supertitle={supertitle}
      title={title}
      description={description}
      subtitle={subtitle}
      featured={featured}
      selectable={selectable}
      selected={selected}
      onSelect={() => setSelected(!selected)}
      previewAspectRatio={previewAspectRatio}
      width={width}
      height={height}
    />
  );
};

const ThumbnailStory = ({ theme }) => {
  const previewImgSrc = text(
    'previewImgSrc',
    'https://images.unsplash.com/photo-1518887668165-8fa91a9178be?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60',
  );
  const previewImgOpacity = text('previewImgOpacity', null);
  const previewBgColor = color('previewBgColor', theme.color.disabled);
  const previewText = text('previewText', null);
  const supertitle = text('supertitle', 'Published');
  const title = text('title', 'How the cow jumped over the moon');
  const description = text(
    'description',
    'Find out how the cow jumped over the moon in this thrilling post…',
  );
  const subtitle = text('subtitle', 'John Smith • 08/15/2019 @ 12:27 PM');
  const featured = boolean('featured', true);
  const selectable = boolean('selectable', false);
  const previewAspectRatio = text('previewAspectRatio', '16:9');
  const width = text('width', '16rem');
  const height = text('height', '18rem');

  return (
    <StoryThumbnail
      previewImgSrc={previewImgSrc}
      previewImgOpacity={previewImgOpacity}
      previewBgColor={previewBgColor}
      previewText={previewText}
      supertitle={supertitle}
      title={title}
      description={description}
      subtitle={subtitle}
      featured={featured}
      selectable={selectable}
      previewAspectRatio={previewAspectRatio}
      width={width}
      height={height}
    />
  );
};
const ThemedThumbnailStory = withTheme(ThumbnailStory);

export const _Thumbnail = () => (
  <Wrap center>
    <ThemedThumbnailStory />
  </Wrap>
);

export const _ThumbnailGrid = () => (
  <Wrap>
    <ThumbnailGrid>
      {mockData.map((thumb, i) => (
        <StoryThumbnail
          key={i}
          previewImgSrc={thumb.img}
          supertitle={thumb.supertitle}
          title={thumb.title}
          description={thumb.description}
          subtitle={thumb.subtitle}
          featured={thumb.featured}
          selectable={true}
          previewAspectRatio={'16:9'}
          width={'auto'}
        />
      ))}
    </ThumbnailGrid>
  </Wrap>
);

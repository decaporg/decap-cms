import React, { useState } from 'react';
import { withKnobs, boolean, number, color, text } from '@storybook/addon-knobs';
import styled from '@emotion/styled';
import { withTheme } from 'emotion-theming';

import Thumbnail, { ThumbnailGrid } from '.';
import getMockData from '../utils/getMockData';

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
  horizontal,
  supertitleMaxLines,
  titleMaxLines,
  descriptionMaxLines,
  subtitleMaxLines,
  width,
  height,
  onClick,
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
      horizontal={horizontal}
      supertitleMaxLines={supertitleMaxLines}
      titleMaxLines={titleMaxLines}
      descriptionMaxLines={descriptionMaxLines}
      subtitleMaxLines={subtitleMaxLines}
      onSelect={() => setSelected(!selected)}
      previewAspectRatio={previewAspectRatio}
      width={width}
      height={height}
      onClick={onClick}
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
  const horizontal = boolean('horizontal', false);
  const supertitleMaxLines = number('supertitleMaxLines', 1);
  const titleMaxLines = number('titleMaxLines', 3);
  const descriptionMaxLines = number('descriptionMaxLines', 3);
  const subtitleMaxLines = number('subtitleMaxLines', 1);
  const width = text('width', '16rem');
  const height = text('height', '18rem');
  const onClick = boolean('onClick', false);

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
      horizontal={horizontal}
      supertitleMaxLines={supertitleMaxLines}
      titleMaxLines={titleMaxLines}
      descriptionMaxLines={descriptionMaxLines}
      subtitleMaxLines={subtitleMaxLines}
      width={width}
      height={height}
      onClick={onClick && !selectable ? () => alert('You just clicked a thumbnail.') : null}
    />
  );
};
const ThemedThumbnailStory = withTheme(ThumbnailStory);

export const _Thumbnail = () => (
  <Wrap center>
    <ThemedThumbnailStory />
  </Wrap>
);

const mockData = getMockData('post', 128);

export const _ThumbnailGrid = () => {
  const horizontal = boolean('horizontal', false);
  const selectable = boolean('selectable', false);
  const onClick = boolean('onClick', false);
  const previewAspectRatio = text('previewAspectRatio', '16:9');
  const previewImgSrc = boolean('previewImgSrc', true);
  const supertitle = boolean('supertitle', true);
  const title = boolean('title', true);
  const description = boolean('description', true);
  const subtitle = boolean('subtitle', true);
  const featured = boolean('featured', true);
  const supertitleMaxLines = number('supertitleMaxLines', 1);
  const titleMaxLines = number('titleMaxLines', 3);
  const descriptionMaxLines = number('descriptionMaxLines', 3);
  const subtitleMaxLines = number('subtitleMaxLines', 1);

  return (
    <Wrap>
      <ThumbnailGrid horizontal={horizontal}>
        {mockData.map((thumb, i) => (
          <StoryThumbnail
            key={i}
            previewImgSrc={previewImgSrc && thumb.featuredImage.regular}
            supertitle={supertitle && thumb.status}
            title={title && thumb.title}
            description={description && thumb.description}
            subtitle={subtitle && `${thumb.author} • ${thumb.dateCreated}`}
            featured={featured && thumb.featured}
            selectable={selectable}
            previewAspectRatio={previewAspectRatio}
            width={'auto'}
            horizontal={horizontal}
            supertitleMaxLines={supertitleMaxLines}
            titleMaxLines={titleMaxLines}
            descriptionMaxLines={descriptionMaxLines}
            subtitleMaxLines={subtitleMaxLines}
            onClick={onClick && !selectable ? () => alert('You just clicked a thumbnail.') : null}
          />
        ))}
      </ThumbnailGrid>
    </Wrap>
  );
};

_ThumbnailGrid.story = {
  name: 'ThumbnailGrid',
};

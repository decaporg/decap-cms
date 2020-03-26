import React, { useState } from 'react';
import { withKnobs, boolean, select, text } from '@storybook/addon-knobs';
import styled from '@emotion/styled';

import Thumbnail from '.';

export default {
  title: 'Components/Thumbnail',
  decorators: [withKnobs],
};

const StyledThumbnail = styled(Thumbnail)`
  ${({ width }) => (width ? `width: ${width}` : ``)};
  ${({ height }) => (height ? `height: ${height}` : ``)};
`;

const StoryThumbnail = () => {
  const [selected, setSelected] = useState(false);

  return (
    <StyledThumbnail
      imageSrc="https://images.unsplash.com/photo-1518887668165-8fa91a9178be?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60"
      supertitle={text('supertitle', 'Published')}
      title={text('title', 'How the cow jumped over the moon')}
      description={text(
        'description',
        'Find out how the cow jumped over the moon in this thrilling post…',
      )}
      subtitle={text('subtitle', 'John Smith • 08/15/2019 @ 12:27 PM')}
      featured={boolean('featured', true)}
      selectable={boolean('selectable', true)}
      selected={selected}
      onSelect={() => setSelected(!selected)}
      imageAspectRatio={text('imageAspectRatio', '16:9')}
      width={text('width', '16rem')}
      height={text('height', '18rem')}
    />
  );
};

export const _Thumbnail = () => <StoryThumbnail />;

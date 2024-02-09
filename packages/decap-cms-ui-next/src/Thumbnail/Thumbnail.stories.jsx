import React from 'react';
import styled from '@emotion/styled';
import { withTheme } from '@emotion/react';
import { useArgs } from '@storybook/preview-api';

import Thumbnail, { ThumbnailGrid } from '.';

export default {
  title: 'Components/Thumbnail',
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

function StoryThumbnail({ theme, ...args }) {
  return <StyledThumbnail theme={theme} {...args} />;
}

function ThumbnailStory({ theme, ...args }) {
  const { previewImgBgColor } = args;

  if (!previewImgBgColor) args.previewImgBgColor = theme.color.disabled;

  return <StoryThumbnail theme={theme} {...args} />;
}

const ThemedThumbnailStory = withTheme(ThumbnailStory);

export function _Thumbnail(args) {
  const [{ selected }, updateArgs] = useArgs();

  function toggleSelected() {
    updateArgs({ selected: !selected });
  }

  return <ThemedThumbnailStory {...args} onSelect={toggleSelected} />;
}

_Thumbnail.argTypes = {
  previewImgSrc: {
    control: 'text',
    table: {
      category: 'Preview',
    },
  },
  previewImgOpacity: {
    control: {
      type: 'range',
      min: 0,
      max: 1,
      step: 0.05,
    },
    table: {
      category: 'Preview',
    },
  },
  previewBgColor: {
    control: 'color',
    table: {
      category: 'Preview',
    },
  },
  previewText: {
    control: 'text',
    table: {
      category: 'Preview',
    },
  },
  previewAspectRatio: {
    control: 'text',
    table: {
      category: 'Preview',
    },
  },

  supertitle: {
    control: 'text',
    table: {
      category: 'Content',
    },
  },
  title: {
    control: 'text',
    table: {
      category: 'Content',
    },
  },
  description: {
    control: 'text',
    table: {
      category: 'Content',
    },
  },
  subtitle: {
    control: 'text',
    table: {
      category: 'Content',
    },
  },
  featured: {
    control: 'boolean',
    table: {
      category: 'Content',
    },
  },

  selectable: {
    control: 'boolean',
  },
  selected: {
    control: 'boolean',
    if: {
      arg: 'selectable',
      truthy: true,
    },
  },

  supertitleMaxLines: {
    control: 'number',
    table: {
      category: 'Max Lines',
      defaultValue: {
        summary: 1,
      },
    },
  },
  titleMaxLines: {
    control: 'number',
    table: {
      category: 'Max Lines',
      defaultValue: {
        summary: 3,
      },
    },
  },
  descriptionMaxLines: {
    control: 'number',
    table: {
      category: 'Max Lines',
      defaultValue: {
        summary: 3,
      },
    },
  },
  subtitleMaxLines: {
    control: 'number',
    table: {
      category: 'Max Lines',
      defaultValue: {
        summary: 1,
      },
    },
  },
};

_Thumbnail.args = {
  previewImgSrc:
    'https://images.unsplash.com/photo-1518887668165-8fa91a9178be?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60',
  previewImgOpacity: 1,
  previewBgColor: null,
  previewText: '',
  previewAspectRatio: '16:9',

  supertitle: 'Published',
  title: 'How the cow jumped over the moon',
  description: 'Find out how the cow jumped over the moon in this thrilling post…',
  subtitle: 'John Smith • 08/15/2019 @ 12:27 PM',
  featured: true,

  supertitleMaxLines: 1,
  titleMaxLines: 3,
  descriptionMaxLines: 3,
  subtitleMaxLines: 1,

  selectable: false,
  selected: false,
  horizontal: false,
  width: '16rem',
  height: '18rem',
};

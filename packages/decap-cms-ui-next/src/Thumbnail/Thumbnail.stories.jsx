import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { withTheme } from '@emotion/react';
import { useArgs } from '@storybook/preview-api';
import { action } from '@storybook/addon-actions';

import { Thumbnail, ThumbnailGrid } from '.';
import { IconButton } from '../Buttons';
import getMockData from '../utils/getMockData';

export default {
  title: 'Components/Thumbnail',
};

const Wrap = styled.div`
  display: flex;
  align-items: ${({ center }) => (center ? `center` : `flex-start`)};
  justify-content: center;
  overflow-y: auto;
  padding: 1rem;
`;

const StyledThumbnail = styled(Thumbnail)`
  ${({ width }) => (width ? `width: ${width}` : ``)};
  ${({ height }) => (height ? `height: ${height}` : ``)};
`;

function StoryThumbnail({ theme, ...args }) {
  const [stateSelected, setStateSelected] = useState(false);

  function toggleSelected() {
    setStateSelected(!stateSelected);
  }

  return (
    <StyledThumbnail {...args} theme={theme} onSelect={toggleSelected} selected={stateSelected} />
  );
}

function ThumbnailStory({ theme, ...args }) {
  const { previewImgBgColor, renderAction } = args;

  if (!previewImgBgColor) args.previewImgBgColor = theme.color.disabled;

  return (
    <StoryThumbnail
      theme={theme}
      {...args}
      renderAction={renderAction ? () => <IconButton icon="more-vertical" /> : null}
    />
  );
}

const ThemedThumbnailStory = withTheme(ThumbnailStory);

export function _Thumbnail(args) {
  return <ThemedThumbnailStory {...args} />;
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

  renderAction: true,
  selectable: false,
  selected: false,
  horizontal: false,
  width: '16rem',
  height: '18rem',
  onClick: action('onClick'),
};

const mockData = getMockData('post', 128);

export function _ThumbnailGrid(args) {
  const {
    supertitle,
    title,
    description,
    subtitle,
    featured,
    previewImgSrc,
    selectable,
    previewAspectRatio,
    horizontal,
    supertitleMaxLines,
    titleMaxLines,
    descriptionMaxLines,
    subtitleMaxLines,
  } = args;

  return (
    <Wrap>
      <ThumbnailGrid horizontal={horizontal}>
        {mockData.map((thumbnail, index) => (
          <StoryThumbnail
            key={index}
            previewImgSrc={previewImgSrc && thumbnail.featuredImage.regular}
            supertitle={supertitle && thumbnail.status}
            title={title && thumbnail.title}
            description={description && thumbnail.description}
            subtitle={subtitle && `${thumbnail.author} • ${thumbnail.dateCreated}`}
            featured={featured && thumbnail.featured}
            selectable={selectable}
            previewAspectRatio={previewAspectRatio}
            width={'auto'}
            horizontal={horizontal}
            supertitleMaxLines={supertitleMaxLines}
            titleMaxLines={titleMaxLines}
            descriptionMaxLines={descriptionMaxLines}
            subtitleMaxLines={subtitleMaxLines}
            onClick={!selectable ? action('onClick') : null}
          />
        ))}
      </ThumbnailGrid>
    </Wrap>
  );
}

_ThumbnailGrid.parameters = {
  layout: 'fullscreen',
};

_ThumbnailGrid.argTypes = {
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

_ThumbnailGrid.args = {
  horizontal: false,
  selectable: false,
  width: '16rem',
  height: '18rem',

  previewImgSrc: true,
  previewAspectRatio: '16:9',

  supertitle: true,
  title: true,
  description: true,
  subtitle: true,
  featured: true,

  supertitleMaxLines: 1,
  titleMaxLines: 3,
  descriptionMaxLines: 3,
  subtitleMaxLines: 1,
};

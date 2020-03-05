import React, { useState } from 'react';
import styled from '@emotion/styled';
import { withKnobs } from '@storybook/addon-knobs';

import ListWidget from '.';
import TextWidget from '../TextWidget';
import BooleanWidget from '../BooleanWidget';

const StyledListWidget = styled(ListWidget)`
  width: 100%;
`;

export default {
  title: 'Widgets/ListWidget',
  decorators: [withKnobs],
};

export const _ListWidget = () => {
  const [links, setLinks] = useState([]);

  return (
    <StyledListWidget
      name="featureLinks"
      label="Links"
      labelSingular="Link"
      onChange={links => setLinks(links)}
      fields={(setListItemValue, linkIndex) => (
        <React.Fragment>
          <TextWidget
            name="featureLinkText"
            label="Text"
            value={links[linkIndex] && links[linkIndex].text}
            onChange={text => setListItemValue({ text }, linkIndex)}
          />
          <TextWidget
            name="featureLinkPath"
            label="Path"
            value={links[linkIndex] && links[linkIndex].path}
            onChange={path => setListItemValue({ path }, linkIndex)}
          />
          <BooleanWidget
            name="newWindow"
            label="Open In New Window"
            value={links[linkIndex] && links[linkIndex].newWindow}
            onChange={newWindow => setListItemValue({ newWindow }, linkIndex)}
          />
        </React.Fragment>
      )}
    />
  );
};

_ListWidget.story = {
  name: 'ListItemWidget',
};

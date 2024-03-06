import React, { useState } from 'react';
import styled from '@emotion/styled';
import { withKnobs, boolean } from '@storybook/addon-knobs';

import ListInput from '.';
import TextInput from '../TextInput';
import BooleanInput from '../BooleanInput';

const StyledListInput = styled(ListInput)`
  width: 100%;
`;

export default {
  title: 'Inputs/ListInput',
  decorators: [withKnobs],
};

export const _ListInput = () => {
  const [links, setLinks] = useState([]);

  return (
    <StyledListInput
      name="featureLinks"
      label="Links"
      labelSingular="Link"
      onChange={links => setLinks(links)}
      inline={boolean('inline', false)}
      fields={(setListItemValue, linkIndex) => (
        <React.Fragment>
          <TextInput
            name="featureLinkText"
            label="Text"
            value={links[linkIndex] && links[linkIndex].text}
            onChange={text => setListItemValue({ text }, linkIndex)}
          />
          <TextInput
            name="featureLinkPath"
            label="Path"
            value={links[linkIndex] && links[linkIndex].path}
            onChange={path => setListItemValue({ path }, linkIndex)}
          />
          <BooleanInput
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

_ListInput.story = {
  name: 'ListItemInput',
};

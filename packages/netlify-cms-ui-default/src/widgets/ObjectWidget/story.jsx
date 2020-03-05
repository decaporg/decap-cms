import React, { useState } from 'react';
import styled from '@emotion/styled';
import { withKnobs } from '@storybook/addon-knobs';

import ObjectWidget from '.';
import TextWidget from '../TextWidget';
import BooleanWidget from '../BooleanWidget';

const StyledObjectWidget = styled(ObjectWidget)`
  width: 100%;
`;

export default {
  title: 'Widgets/ObjectWidget',
  decorators: [withKnobs],
};

export const _ObjectWidget = () => {
  const [link, setLink] = useState({});

  return (
    <StyledObjectWidget
      name="links"
      label="Link"
      onChange={link => setLink(link)}
      fields={setObjectItemValue => (
        <React.Fragment>
          <TextWidget
            name="featureLinkText"
            label="Text"
            value={link && link.text}
            onChange={text => setObjectItemValue({ text })}
          />
          <TextWidget
            name="featureLinkPath"
            label="Path"
            value={link && link.path}
            onChange={path => setObjectItemValue({ path })}
          />
          <BooleanWidget
            name="newWindow"
            label="Open In New Window"
            value={link && link.newWindow}
            onChange={newWindow => setObjectItemValue({ newWindow })}
          />
        </React.Fragment>
      )}
    />
  );
};

_ObjectWidget.story = {
  name: 'ObjectItemWidget',
};

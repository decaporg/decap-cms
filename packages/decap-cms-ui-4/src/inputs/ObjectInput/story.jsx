import React, { useState } from 'react';
import styled from '@emotion/styled';
import { withKnobs, boolean } from '@storybook/addon-knobs';

import ObjectInput from '.';
import TextInput from '../TextInput';
import BooleanInput from '../BooleanInput';

const StyledObjectInput = styled(ObjectInput)`
  width: 100%;
`;

export default {
  title: 'Inputs/ObjectInput',
  decorators: [withKnobs],
};

export const _ObjectInput = () => {
  const [link, setLink] = useState({});

  return (
    <StyledObjectInput
      inline={boolean('inline', false)}
      name="links"
      label="Link"
      onChange={link => setLink(link)}
      fields={setObjectItemValue => (
        <React.Fragment>
          <TextInput
            name="featureLinkText"
            label="Text"
            value={link && link.text}
            onChange={text => setObjectItemValue({ text })}
          />
          <TextInput
            name="featureLinkPath"
            label="Path"
            value={link && link.path}
            onChange={path => setObjectItemValue({ path })}
          />
          <BooleanInput
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

_ObjectInput.story = {
  name: 'ObjectItemInput',
};

import React from 'react';
import styled from '@emotion/styled';
import { useArgs } from '@storybook/preview-api';

import ObjectInput from '.';
import TextInput from '../TextInput';
import BooleanInput from '../BooleanInput';

const StyledObjectInput = styled(ObjectInput)`
  width: 33vw;
`;

export default {
  title: 'Inputs/ObjectInput',
  component: ObjectInput,
  argTypes: {
    fields: {
      control: 'object',
    },
  },
  args: {
    name: 'links',
    label: 'Link',
    fields: {
      text: '',
      path: '',
      newWindow: false,
    },
    inline: false,
  },
};

export function _ObjectInput(args) {
  const [{ fields }, updateArgs] = useArgs();

  function handleChange(fields) {
    updateArgs({ fields });
  }

  return (
    <StyledObjectInput
      {...args}
      onChange={handleChange}
      fields={setObjectItemValue => (
        <React.Fragment>
          <TextInput
            name="featureLinkText"
            label="Text"
            value={fields && fields.text}
            onChange={text => setObjectItemValue({ text })}
          />
          <TextInput
            name="featureLinkPath"
            label="Path"
            value={fields && fields.path}
            onChange={path => setObjectItemValue({ path })}
          />
          <BooleanInput
            name="newWindow"
            label="Open In New Window"
            value={fields && fields.newWindow}
            onChange={newWindow => setObjectItemValue({ newWindow })}
          />
        </React.Fragment>
      )}
    />
  );
}

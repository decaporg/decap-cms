import React from 'react';
import styled from '@emotion/styled';
import { useArgs } from '@storybook/preview-api';

import ObjectField from '.';
import TextField from '../TextField';
import BooleanField from '../BooleanField';

const StyledObjectField = styled(ObjectField)`
  width: 33vw;
`;

export default {
  title: 'Fields/ObjectField',
  component: ObjectField,
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

export function _ObjectField(args) {
  const [{ fields }, updateArgs] = useArgs();

  function handleChange(fields) {
    updateArgs({ fields });
  }

  return (
    <StyledObjectField
      {...args}
      onChange={handleChange}
      fields={setObjectItemValue => (
        <React.Fragment>
          <TextField
            name="featureLinkText"
            label="Text"
            value={fields && fields.text}
            onChange={text => setObjectItemValue({ text })}
          />
          <TextField
            name="featureLinkPath"
            label="Path"
            value={fields && fields.path}
            onChange={path => setObjectItemValue({ path })}
          />
          <BooleanField
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

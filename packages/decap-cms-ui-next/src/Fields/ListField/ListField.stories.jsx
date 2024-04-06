import React from 'react';
import styled from '@emotion/styled';
import { useArgs } from '@storybook/preview-api';

import ListField from '.';
import TextField from '../TextField';
import BooleanField from '../BooleanField';

const StyledListField = styled(ListField)`
  width: 33vw;
`;

export default {
  title: 'Fields/ListField',
  component: ListField,
  argTypes: {
    items: {
      control: 'object',
    },
  },
  args: {
    label: 'Links',
    labelSingular: 'Link',
    inline: false,
    items: [],
  },
};

export function _ListField(args) {
  const [{ items }, updateArgs] = useArgs();

  function handleChange(items) {
    updateArgs({ items });
  }

  return (
    <StyledListField
      {...args}
      name="featureLinks"
      onChange={handleChange}
      fields={(setListItemValue, itemIndex) => (
        <React.Fragment>
          <TextField
            name="featureLinkText"
            label="Text"
            value={items[itemIndex] && items[itemIndex].text}
            onChange={text => setListItemValue({ text }, itemIndex)}
          />
          <TextField
            name="featureLinkPath"
            label="Path"
            value={items[itemIndex] && items[itemIndex].path}
            onChange={path => setListItemValue({ path }, itemIndex)}
          />
          <BooleanField
            name="newWindow"
            label="Open In New Window"
            value={items[itemIndex] && items[itemIndex].newWindow}
            onChange={newWindow => setListItemValue({ newWindow }, itemIndex)}
          />
        </React.Fragment>
      )}
    />
  );
}

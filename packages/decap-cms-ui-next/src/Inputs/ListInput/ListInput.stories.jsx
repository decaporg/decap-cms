import React from 'react';
import styled from '@emotion/styled';
import { useArgs } from '@storybook/preview-api';

import ListInput from '.';
import TextInput from '../TextInput';
import BooleanInput from '../BooleanInput';

const StyledListInput = styled(ListInput)`
  width: 33vw;
`;

export default {
  title: 'Inputs/ListInput',
  component: ListInput,
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

export function _ListInput(args) {
  const [{ items }, updateArgs] = useArgs();

  function handleChange(items) {
    updateArgs({ items });
  }

  return (
    <StyledListInput
      {...args}
      name="featureLinks"
      onChange={handleChange}
      fields={(setListItemValue, itemIndex) => (
        <React.Fragment>
          <TextInput
            name="featureLinkText"
            label="Text"
            value={items[itemIndex] && items[itemIndex].text}
            onChange={text => setListItemValue({ text }, itemIndex)}
          />
          <TextInput
            name="featureLinkPath"
            label="Path"
            value={items[itemIndex] && items[itemIndex].path}
            onChange={path => setListItemValue({ path }, itemIndex)}
          />
          <BooleanInput
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

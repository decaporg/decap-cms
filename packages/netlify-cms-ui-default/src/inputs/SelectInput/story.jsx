import React, { useState } from 'react';
import styled from '@emotion/styled';
import { withKnobs } from '@storybook/addon-knobs';

import SelectInput from '.';

const StyledSelectInput = styled(SelectInput)`
  width: 100%;
`;

export default {
  title: 'Inputs/SelectInput',
  decorators: [withKnobs],
};

export const _SelectInput = () => {
  const [category, setCategory] = useState();
  return (
    <StyledSelectInput
      name="category"
      label="Categories"
      labelSingular="Category"
      value={category}
      onChange={category => setCategory(category)}
      options={[
        { name: 'general', label: 'General' },
        { name: 'advice', label: 'Advice' },
        { name: 'opinion', label: 'Opinion' },
        { name: 'technology', label: 'Technology' },
        { name: 'businessFinance', label: 'Business & Finance' },
        { name: 'foodCooking', label: 'Food & Cooking' },
        { name: 'worldPolitics', label: 'World & Politics' },
        { name: 'moviesEntretainment', label: 'Movies & Entertainment' },
        { name: 'lifestyle', label: 'Lifestyle' },
        { name: 'homeGardening', label: 'Home & Gardening' },
      ]}
    />
  );
};

_SelectInput.story = {
  name: 'SelectInput',
};

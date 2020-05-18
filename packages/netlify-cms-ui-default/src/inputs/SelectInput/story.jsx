import React, { useState } from 'react';
import styled from '@emotion/styled';
import { withKnobs, boolean } from '@storybook/addon-knobs';

import SelectInput from '.';

const StyledSelectInput = styled(SelectInput)`
  width: 100%;
`;

export default {
  title: 'Inputs/SelectInput',
  decorators: [withKnobs],
};

export const _SelectInput = () => {
  const [categories, setCategories] = useState([]);
  return (
    <StyledSelectInput
      name="category"
      label="Categories"
      labelSingular="Category"
      inline={boolean('inline', false)}
      multiple={boolean('multiple', false)}
      error={boolean('error', false)}
      value={categories}
      onChange={categories => setCategories(categories)}
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

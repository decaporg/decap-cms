import React, { useState } from 'react';
import styled from '@emotion/styled';
import { withKnobs, boolean } from '@storybook/addon-knobs';

import SelectWidget from '.';

const StyledSelectWidget = styled(SelectWidget)`
  width: 100%;
`;

export default {
  title: 'Widgets/SelectWidget',
  decorators: [withKnobs],
};

export const _SelectWidget = () => {
  const [category, setCategory] = useState();
  return (
    <StyledSelectWidget
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

_SelectWidget.story = {
  name: 'SelectWidget',
};

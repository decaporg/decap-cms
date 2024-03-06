import React from 'react';
import styled from '@emotion/styled';
import { withKnobs } from '@storybook/addon-knobs';

import ParticleBackground from '.';

const StyledParticleBackground = styled(ParticleBackground)`
  width: 100%;
  height: 100%;
`;

export default {
  title: 'Components/ParticleBackground',
  decorators: [withKnobs],
};

export const _ParticleBackground = () => {
  return <StyledParticleBackground />;
};

_ParticleBackground.story = {
  name: 'ParticleBackground',
};

import React from 'react';
import styled from '@emotion/styled';

import Card from '../Card';

export default {
  title: 'Foundations/Shadows',
  parameters: {
    options: {
      showPanel: false,
    },
  },
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4rem;
`;

const ElevationWrapper = styled.div`
  display: flex;
  gap: 2rem;
`;

const StyledCard = styled(Card)`
  padding: 1rem;
`;

const PropertyList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const Property = styled.li`
  display: flex;
  gap: 1rem;
`;

const PropertyName = styled.p`
  font-weight: bold;
  margin: 0;
`;

const PropertyValue = styled.pre`
  font-weight: normal;
  margin: 0;
`;

export function _Shadows() {
  const elevations = ['xs', 'sm', 'md', 'lg'];
  const directions = ['up', 'down', 'left', 'right'];

  return (
    <>
      <h1> Shadows</h1>
      <Wrapper>
        {elevations.map(elevation => (
          <ElevationWrapper key={elevation}>
            {directions.map(direction => (
              <StyledCard
                key={`${elevation}-${direction}`}
                elevation={elevation}
                direction={direction}
              >
                <PropertyList>
                  <Property>
                    <PropertyName>Elevation</PropertyName>
                    <PropertyValue>{elevation}</PropertyValue>
                  </Property>
                  <Property>
                    <PropertyName>Direction</PropertyName>
                    <PropertyValue>{direction}</PropertyValue>
                  </Property>
                </PropertyList>
              </StyledCard>
            ))}
          </ElevationWrapper>
        ))}
      </Wrapper>
    </>
  );
}

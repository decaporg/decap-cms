import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import Particle from 'particleground-light';
import color from '../utils/color';

const ParticleContainer = styled.div`
  background-color: ${color.neutral['1400']};
  position: relative;
  width: 100%;
  height: 100%;
`;
const Particles = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  height: 100%; /* We need a height defined */
`;

const ParticleBackground = ({ children, className }) => {
  const particlesRef = useRef(null);
  useEffect(() => {
    if (particlesRef.current) {
      setTimeout(() => {
        new Particle(particlesRef.current, {
          dotColor: color.neutral['1000'],
          lineColor: color.neutral['1200'],
          minSpeedX: 0.5,
          maxSpeedX: 2,
          minSpeedY: 0.5,
          maxSpeedY: 2,
          density: 20000, // One particle every n pixels
          curvedLines: false,
          proximity: 100, // How close two dots need to be before they join
          parallaxMultiplier: 10, // Lower the number is more extreme parallax
          particleRadius: 4, // Dot size
        });
      });
    }
  }, [particlesRef]);

  return (
    <ParticleContainer className={className}>
      <Particles ref={particlesRef} />
      {children}
    </ParticleContainer>
  );
};

export default ParticleBackground;

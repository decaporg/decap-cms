import styled from '@emotion/styled';

const Card = styled.div`
  background-color: ${({ theme }) => theme.color.elevatedSurface};
  ${({ rounded }) =>
    rounded ? `border-radius: ${rounded === 'sm' ? 2 : rounded === 'lg' ? 6 : 4}px` : ``};
  box-shadow: ${({ theme, direction, elevation }) =>
    theme.shadow({
      direction,
      size: elevation && typeof elevation === 'string' ? elevation : 'xs',
      theme,
    })};
`;

Card.defaultProps = { direction: 'down', rounded: 'lg' };

export default Card;

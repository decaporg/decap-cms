import styled from '@emotion/styled';

const ThumbnailGrid = styled.div`
  display: grid;
  grid-gap: 1rem;
  width: 100%;
  grid-template-columns: repeat(
    auto-fill,
    minmax(min(${({ horizontal }) => (horizontal ? 24 : 16)}rem, 100%), 1fr)
  );
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    grid-gap: 0.5rem;
    grid-template-columns: repeat(
      auto-fill,
      minmax(min(${({ horizontal }) => (horizontal ? 24 : 8)}rem, 100%), 1fr)
    );
  }
`;

export default ThumbnailGrid;

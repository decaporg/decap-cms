import styled from '@emotion/styled';

// TODO: add name prop and display two initials

export default styled.div`
  border-radius: ${props => (props.size ? props.size : 32)}px;
  width: ${props => (props.size ? props.size : 32)}px;
  height: ${props => (props.size ? props.size : 32)}px;
  transition: 200ms;
  ${props =>
    props.src &&
    `
    background-image: url(${props.src});
    background-size: cover;
    background-position: center;
  `}
  background-color: rgba(0, 0, 0, 0.25);
`;

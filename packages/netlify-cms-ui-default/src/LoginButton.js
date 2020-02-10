import Icon from './Icon';
import { buttons, shadows } from './styles';
import styled from '@emotion/styled';

const LoginButton = styled.button`
  ${buttons.button};
  ${shadows.dropDeep};
  ${buttons.default};

  display: flex;
  border-radius: 5px;
  width: 100%;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 1rem;
  color: white;
  background-color: ${props => props.color || '#798291'};

  &:last-of-type {
    margin-bottom: 0;
  }

  ${Icon} {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
  }
`;

export default LoginButton;

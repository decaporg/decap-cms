import React from 'react';
import styled from '@emotion/styled';
import color from 'color';
import 'react-toastify/dist/ReactToastify.minimal.css';

import Icon from '../Icon';
import Card from '../Card';
import LinearProgress from '../LinearProgress';

const ToastWrap = styled.div`
  padding-bottom: 8px;
  box-sizing: content-box;
  &:hover {
    position: relative;
    z-index: 1;
  }
`;

const ToastInside = styled(Card)`
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-height: 800px;
  overflow: hidden;
  cursor: pointer;
  direction: ltr;
  margin-right: 24px;
  transition: 200ms;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    margin-right: 16px;
  }
  ${ToastWrap}:hover & {
    box-shadow: ${({ theme }) => theme.shadow({ size: 'lg', theme })};
  }
`;
ToastInside.defaultProps = { elevation: 'sm', rounded: 'lg' };

const ToastContentWrap = styled.div`
  font-family: ${({ theme }) => theme.fontFamily};
  display: flex;
`;

const ToastContent = styled.div`
  flex: 1;
  padding: 20px;
  align-self: center;
`;

const ToastActions = styled.div`
  padding: 12px 12px 12px 0;
`;

const Title = styled.h4`
  font-family: ${({ theme }) => theme.fontFamily};
  color: ${({ theme }) => theme.color.highEmphasis};
  padding: 0;
  margin: 0 0 ${props => (props.hasContent ? '8px' : 0)} 0;
  font-size: 16px;
  font-weight: bold;
`;
const Content = styled.div`
  color: ${({ theme }) => theme.color.mediumEmphasis};
  font-size: 14px;
  line-height: 1rem;
`;

const IconWrap = styled.div`
  background-color: ${({ theme, type }) => {
    if (type === 'success') return color(theme.color.success['900']).alpha(0.2).string();
    if (type === 'warning') return color('#FFB81C').alpha(0.2).string();
    if (type === 'error') return color(theme.color.danger['900']).alpha(0.2).string();
    return color(theme.color.neutral['700']).alpha(0.2).string();
  }};
  color: ${({ theme, type }) => {
    if (type === 'success') return theme.color.success[900];
    if (type === 'warning') return '#FFB81C';
    if (type === 'error') return theme.color.danger[900];
    return theme.color.mediumEmphasis;
  }};
  display: flex;
  justify-content: center;
  align-items: center;
  width: 56px;
`;

function Toast({
  position = 'bottom-right',
  autoClose = 5000,
  closeToast,
  type,
  title,
  content,
  closeButton,
}) {
  let icon = 'info';
  if (type === 'success') icon = 'check';
  if (type === 'warning') icon = 'alert-triangle';
  if (type === 'error') icon = 'alert-circle';

  return (
    <ToastWrap>
      <ToastInside>
        <ToastContentWrap>
          <IconWrap type={type}>
            <Icon name={icon} />
          </IconWrap>

          <ToastContent>
            {title && <Title hasContent={content}>{title}</Title>}
            {content && <Content>{content}</Content>}
          </ToastContent>

          <ToastActions>{closeButton && closeButton}</ToastActions>
        </ToastContentWrap>
        {autoClose && (
          <LinearProgress
            countdown={autoClose}
            // pauseCountdown={!this.props.isRunning}
            onCountdown={closeToast}
            closeToast={closeToast}
            type={type}
          />
        )}
      </ToastInside>
    </ToastWrap>
  );
}

export default Toast;

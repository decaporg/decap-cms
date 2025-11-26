import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const ProgressContainer = styled.div`
  width: ${(props: { width?: string }) => props.width || '100%'};
  max-width: 600px;
  margin: 16px auto;
  padding: 0 20px;
`;

const ProgressBarWrapper = styled.div`
  width: 100%;
  height: 8px;
  background-color: #e8eaed;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const ProgressBarFill = styled.div<{ percentage: number }>`
  height: 100%;
  width: ${props => props.percentage}%;
  background: linear-gradient(
    90deg,
    #3b82f6 0%,
    #60a5fa 25%,
    #3b82f6 50%,
    #60a5fa 75%,
    #3b82f6 100%
  );
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite linear;
  border-radius: 4px;
  transition: width 0.3s ease-out;
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 13px;
  color: #5c6873;
`;

const ProgressMessage = styled.span`
  font-weight: 500;
`;

const ProgressCount = styled.span`
  font-family: Monaco, Menlo, 'Ubuntu Mono', monospace;
  color: #3b82f6;
`;

export interface ProgressBarProps {
  loadedCount: number;
  totalCount: number;
  percentage: number;
  width?: string;
  message?: string;
}

export function ProgressBar({
  loadedCount,
  totalCount,
  percentage,
  width,
  message = 'Loading entries',
}: ProgressBarProps) {
  return (
    <ProgressContainer width={width}>
      <ProgressBarWrapper>
        <ProgressBarFill percentage={percentage} />
      </ProgressBarWrapper>
      <ProgressText>
        <ProgressMessage>{message}...</ProgressMessage>
        <ProgressCount>
          {loadedCount} / {totalCount} ({percentage}%)
        </ProgressCount>
      </ProgressText>
    </ProgressContainer>
  );
}

export default ProgressBar;

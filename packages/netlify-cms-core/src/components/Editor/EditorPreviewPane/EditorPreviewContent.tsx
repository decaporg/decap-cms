/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable func-style */
import styled from '@emotion/styled';
import { CmsWidgetPreviewProps } from 'netlify-cms-core';
import React, { ComponentType, ReactNode, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { ScrollSyncPane } from 'react-scroll-sync';

interface PreviewContentProps {
  previewComponent?:
    | React.ReactElement<unknown, string | React.JSXElementConstructor<any>>
    | ComponentType<CmsWidgetPreviewProps>;
  previewProps: CmsWidgetPreviewProps;
}

const StyledPreviewContent = styled.div`
  width: calc(50% - 2px);
  top: 66px;
  right: 0;
  position: absolute;
  height: calc(100% - 66px);
  overflow-y: auto;
`;

const PreviewContent = ({ previewComponent, previewProps }: PreviewContentProps) => {
  const element = useMemo(() => document.getElementById('cms-root'), []);

  return useMemo(() => {
    if (!element) {
      return null;
    }

    let children: ReactNode;
    if (!previewComponent) {
      children = null;
    } else if (React.isValidElement(previewComponent)) {
      children = React.cloneElement(previewComponent, previewProps);
    } else {
      children = React.createElement(previewComponent, previewProps);
    }

    return ReactDOM.createPortal(
      <ScrollSyncPane>
        <StyledPreviewContent className="preview-content">{children}</StyledPreviewContent>
      </ScrollSyncPane>,
      element,
      'preview-content'
    );
  }, [previewComponent, previewProps, element]);
};

export default PreviewContent;

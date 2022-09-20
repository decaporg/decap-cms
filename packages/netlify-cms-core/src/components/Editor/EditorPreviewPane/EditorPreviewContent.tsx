/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable func-style */
import { CmsWidgetPreviewProps } from 'netlify-cms-core';
import React, { ComponentType, ReactNode, useMemo } from 'react';
import ReactDOM from 'react-dom';

interface PreviewContentProps {
  previewComponent?:
    | React.ReactElement<unknown, string | React.JSXElementConstructor<any>>
    | ComponentType<CmsWidgetPreviewProps>;
  previewProps: CmsWidgetPreviewProps;
}

const PreviewContent = ({ previewComponent, previewProps }: PreviewContentProps) => {
  const element = useMemo(() => document.getElementById('nc-root'), []);

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

    return ReactDOM.createPortal(<div className="preview-content">{children}</div>, element);
  }, [previewComponent, previewProps, element]);
};

export default PreviewContent;

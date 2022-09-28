import React from 'react';

import { CmsWidgetPreviewProps } from '../../interface';
import { WidgetPreviewContainer } from '../../ui';

function StringPreview({ value = '' }: CmsWidgetPreviewProps<string>) {
  return <WidgetPreviewContainer>{value}</WidgetPreviewContainer>;
}

export default StringPreview;

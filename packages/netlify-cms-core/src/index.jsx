import createReactClass from 'create-react-class';
import React from 'react';

import bootstrap from './bootstrap';
import Registry from './lib/registry';
import * as backends from './backends';
import * as widgets from './widgets';
import * as mediaLibraries from './media-libraries';
import * as editorComponents from './editor-components';
import * as locales from './locales';
import * as lib from './lib';
import * as ui from './ui';

export * from './backends';
export * from './widgets';
export * from './media-libraries';
export * from './editor-components';
export * from './locales';
export * from './lib';
export * from './ui';

export const CMS = {
  ...Registry,
  ...backends,
  ...widgets,
  ...mediaLibraries,
  ...editorComponents,
  ...locales,
  ...lib,
  ...ui,
  init: bootstrap,
};

if (typeof window !== 'undefined') {
  window.CMS = CMS;
  window.createClass = window.createClass || createReactClass;
  window.h = window.h || React.createElement;
}

export default CMS;

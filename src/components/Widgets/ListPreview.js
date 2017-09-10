import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { resolveWidget } from '../Widgets';
import previewStyle from './defaultPreviewStyle';
import ObjectPreview from './ObjectPreview';

const ListPreview = ObjectPreview;

ListPreview.propTypes = {
  field: PropTypes.node,
};

export default ListPreview;

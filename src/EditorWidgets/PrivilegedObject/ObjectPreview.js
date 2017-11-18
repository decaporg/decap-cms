import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { resolveWidget } from '../../Widgets';

const ObjectPreview = ({ field }) => (
  <div className="nc-widgetPreview">{(field && field.get('fields')) || null}</div>
);

ObjectPreview.propTypes = {
  field: PropTypes.node,
};

export default ObjectPreview;

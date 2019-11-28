import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { translate } from 'react-polyglot';
import styled from '@emotion/styled';
import { colors, transitions } from 'netlify-cms-ui-default';
import { selectDraftPath } from 'Selectors/entryDraft';

const PathLabel = styled.label`
  color: ${colors.text};
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  border: 0;
  padding-left: 5px;
  transition: all ${transitions.main};
  position: relative;
`;

export const PathPreview = ({ value }) => {
  return <PathLabel data-testid="site_path-preview">{value}</PathLabel>;
};

PathPreview.propTypes = {
  value: PropTypes.string.isRequired,
  t: PropTypes.func.isRequired,
};

const mapStateToProps = (state, ownProps) => {
  const collection = ownProps.collection;
  const entry = ownProps.entry;
  const newRecord = entry.get('newRecord');

  const value = newRecord ? selectDraftPath(state, collection, entry) : entry.get('path');

  return { value };
};

const ConnectedPathPreview = connect(mapStateToProps)(translate()(PathPreview));

ConnectedPathPreview.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
};

export default ConnectedPathPreview;

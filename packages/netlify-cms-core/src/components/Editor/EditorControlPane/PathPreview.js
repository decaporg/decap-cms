import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { translate } from 'react-polyglot';
import styled from '@emotion/styled';
import { styleStrings, ControlContainer } from './EditorControl';
import { colors } from 'netlify-cms-ui-default';
import { selectDraftPath } from 'Selectors/entryDraft';

const PathLabel = styled.label`
  ${styleStrings.label}
`;

const PathInput = styled.input`
  ${styleStrings.widget}
  color: ${colors.controlLabel};
  background-color: ${colors.textFieldBorder};
`;

export const PathPreview = ({ value, t }) => {
  return (
    <ControlContainer>
      <PathLabel htmlFor="site_path-preview">
        {t('editor.editorControlPane.pathPreview.label')}
      </PathLabel>
      <PathInput
        value={value}
        readOnly
        id="site_path-preview"
        disabled
        data-testid="site_path-preview"
      />
    </ControlContainer>
  );
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

import PropTypes from 'prop-types';
import React from 'react';
import styled from '@emotion/styled';
import ImmutablePropTypes from 'react-immutable-proptypes';

import CreateNote from './CreateNote';
import NoteList from './NoteList';

const NotesContainer = styled.div`
  overflow: none;
  display: flex;
  flex-direction: column;
  height: calc(100% - 48px);
`;

const CenteredText = styled.p`
  margin: auto;
`;

class EditorNotesPane extends React.Component {
  render() {
    const { hasWorkflow, draftKey, slug, collection, t } = this.props;

    if (!hasWorkflow) {
      return (
        <NotesContainer>
          <CenteredText>Notes are only available in editorial workflow</CenteredText>
        </NotesContainer>
      );
    }

    return (
      <NotesContainer>
        <NoteList draftKey={draftKey} slug={slug} collection={collection} t={t} />
        <CreateNote />
      </NotesContainer>
    );
  }
}

EditorNotesPane.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  hasWorkflow: PropTypes.bool,
  draftKey: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
  t: PropTypes.func.isRequired,
};

export default EditorNotesPane;

/**
 * Notes for Notes:
 * Use cases:
 * 1. OpenCMS -> Draft -> Save draft -> Add notes -> End
 * 2. OpenCMS -> Draft -> Add notes -> Save draft -> End
 * 3. OpenCMS -> Draft -> Save draft -> Publish -> Open Published File -> Check Notes history -> End
 *
 * Data flow:
 * 1. Easy to show as PR is already created
 * 2. Save notes to local history?
 * 3. Possible? History yes. Comments? Not from all PRs.
 *
 */

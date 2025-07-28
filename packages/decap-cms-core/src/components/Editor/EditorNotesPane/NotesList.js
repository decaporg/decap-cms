import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';

import NoteItem from './NoteItem';

const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;

function NotesList({ notes, onUpdate, onDelete, onToggleResolution, user, t }) {
  // Sort notes: unresolved first, then by newest
  const sortedNotes = notes.sort((a, b) => {
    // First sort by resolved status (unresolved first)
    if (a.get('resolved') !== b.get('resolved')) {
      return a.get('resolved') ? 1 : -1;
    }
    // Then sort by timestamp (newest first)
    return new Date(b.get('timestamp')) - new Date(a.get('timestamp'));
  });

  return (
    <ListContainer>
      {sortedNotes.map(note => (
        <NoteItem
          key={note.get('id')}
          note={note}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onToggleResolution={onToggleResolution}
          user={user}
          t={t}
        />
      ))}
    </ListContainer>
  );
}

NotesList.propTypes = {
  notes: ImmutablePropTypes.list.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleResolution: PropTypes.func.isRequired, 
  user: PropTypes.object,
  t: PropTypes.func.isRequired,
};

export default NotesList;

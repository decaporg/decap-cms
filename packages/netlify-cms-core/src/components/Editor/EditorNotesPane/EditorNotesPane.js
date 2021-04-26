import React from "react";
import { connect } from 'react-redux';
import styled from '@emotion/styled';

import CreateNote from "./CreateNote";
import NoteList from "./NoteList";

const NotesContainer = styled.div`
  overflow: none;
  display: flex;
  flex-direction: column;
  height: calc(100% - 48px);
`;

export default function EditorNotesPane() {
  return (
    <NotesContainer>
      <NoteList />
      <CreateNote />
    </NotesContainer>
  )
}


// function mapStateToProps(state) {
//   const isLoadingAsset = selectIsLoadingAsset(state.medias);
//   return { isLoadingAsset, config: state.config };
// }

// function mapDispatchToProps(dispatch) {
//   return {
//     boundGetAsset: (collection, entry) => boundGetAsset(dispatch, collection, entry),
//   };
// }

// function mergeProps(stateProps, dispatchProps, ownProps) {
//   return {
//     ...stateProps,
//     ...dispatchProps,
//     ...ownProps,
//     getAsset: dispatchProps.boundGetAsset(ownProps.collection, ownProps.entry),
//   };
// }

// export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(EditorNotesPane);
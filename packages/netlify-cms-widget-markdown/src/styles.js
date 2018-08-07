import styled from 'react-emotion';

export const editorStyleVars = {
  stickyDistanceBottom: '100px',
};

export const EditorControlBar = styled.div`
  z-index: 1;
  position: sticky;
  top: 0;
  margin-bottom: ${editorStyleVars.stickyDistanceBottom};
`;

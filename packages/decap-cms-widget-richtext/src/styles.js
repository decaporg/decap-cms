import styled from '@emotion/styled';
import { zIndex } from 'decap-cms-ui-default';

export const editorStyleVars = {
  stickyDistanceBottom: '0',
};

export const EditorControlBar = styled.div`
  z-index: ${zIndex.zIndex200};
  position: sticky;
  top: 0;
  margin-bottom: ${editorStyleVars.stickyDistanceBottom};
`;

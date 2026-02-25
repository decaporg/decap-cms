import styled from '@emotion/styled';
import { fonts, zIndex } from 'decap-cms-ui-default';

export const editorStyleVars = {
  stickyDistanceBottom: '0',
};

export const EditorControlBar = styled.div`
  z-index: ${zIndex.zIndex200};
  position: sticky;
  top: 0;
  margin-bottom: ${editorStyleVars.stickyDistanceBottom};
`;

export const editorContainerStyles = `
  position: relative;
  font-family: ${fonts.primary};
  margin-top: -${editorStyleVars.stickyDistanceBottom};
  padding: 0;
  display: flex;
  flex-direction: column;
  z-index: ${zIndex.zIndex100};
  white-space: pre-wrap;
`;

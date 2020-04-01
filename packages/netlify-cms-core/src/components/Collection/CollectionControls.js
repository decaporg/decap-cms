import React from 'react';
import styled from '@emotion/styled';
import ViewStyleControl from './ViewStyleControl';
import SortControl from './SortControl';
import { lengths } from 'netlify-cms-ui-default';

const CollectionControlsContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row-reverse;
  margin-top: 22px;
  width: ${lengths.topCardWidth};
  max-width: 100%;

  & > div {
    margin-left: 6px;
  }
`;

const CollectionControls = ({
  collection,
  viewStyle,
  onChangeViewStyle,
  sortableFields,
  onSortClick,
  sort,
}) => (
  <CollectionControlsContainer>
    <ViewStyleControl viewStyle={viewStyle} onChangeViewStyle={onChangeViewStyle} />
    {sortableFields.length > 0 && (
      <SortControl
        fields={sortableFields}
        collection={collection}
        sort={sort}
        onSortClick={onSortClick}
      />
    )}
  </CollectionControlsContainer>
);

export default CollectionControls;

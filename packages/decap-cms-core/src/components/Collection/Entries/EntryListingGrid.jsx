import React from 'react';
import styled from '@emotion/styled';
import { Thumbnail, ThumbnailGrid } from 'decap-cms-ui-next';
import { Link } from 'react-router-dom';

const Wrap = styled.div`
  flex: 1;

  display: flex;
  align-items: ${({ center }) => (center ? `center` : `flex-start`)};
  justify-content: center;
  overflow-y: auto;
  margin: 1rem 2rem;
`;

function EntryListingGrid({ entries, isSingleCollectionInList = true }) {
  return (
    <Wrap>
      <ThumbnailGrid>
        {entries.toJS().map(entry => {
          const title = entry.titleFieldName ? entry.data[entry.titleFieldName] : entry.label;
          const description = entry.data[entry.descriptionFieldName];
          let image = entry.data[entry.imageFieldName];
          if (image) {
            image = encodeURI(image);
          }

          return (
            <Thumbnail
              as={Link}
              to={`/collections/${entry.collection}/entries/${entry.slug}`}
              selectable={false}
              key={entry.slug}
              supertitle={!isSingleCollectionInList ? entry.collectionLabel : null}
              title={title}
              description={description}
              previewImgSrc={image}
            />
          );
        })}
      </ThumbnailGrid>
    </Wrap>
  );
}

export default EntryListingGrid;

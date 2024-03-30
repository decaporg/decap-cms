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

function EntriesGrid({ collection, entries, inferredFields }) {
  console.log('EntriesGrid', collection, entries, inferredFields);

  return (
    <Wrap>
      <ThumbnailGrid>
        {entries.toJS().map(entry => {
          const title = entry.data[inferredFields.titleField];
          const description = entry.data[inferredFields.descriptionField];
          let image = entry.data[inferredFields.imageField];
          if (image) {
            image = encodeURI(image);
          }

          return (
            <Thumbnail
              as={Link}
              to={`/collections/${collection.get('name')}/entries/${entry.slug}`}
              selectable={false}
              key={entry.slug}
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

export default EntriesGrid;

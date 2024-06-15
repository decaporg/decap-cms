import React from 'react';
import styled from '@emotion/styled';
import { useHistory } from 'react-router-dom';
import { Table } from 'decap-cms-ui-next';

const Image = styled.div`
  background-image: url(${({ srcUrl }) => srcUrl});
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 6px;
`;

const Title = styled.div`
  color: ${({ theme }) => theme.color.highEmphasis};
  font-weight: bold;
`;

const Subtitle = styled.div`
  font-size: 12px;
`;

function EntryListingTable({ entries, isSingleCollectionInList = true }) {
  const columns = [
    {
      id: 'image',
      cell({ row: { original: rowData } }) {
        let image = rowData.data[rowData.imageFieldName];
        if (image) {
          image = encodeURI(image);
        }

        return image ? <Image srcUrl={image} /> : null;
      },
      size: 56,
    },
    {
      id: 'title',
      accessorKey: 'title',
      header: 'Title',
      cell({ row: { original: rowData } }) {
        const title = rowData.titleFieldName ? rowData.data[rowData.titleFieldName] : rowData.label;
        const description = rowData.data[rowData.descriptionFieldName];

        return (
          <>
            <Title>{title}</Title>
            <Subtitle>{description}</Subtitle>
          </>
        );
      },
    },
  ];

  if (!isSingleCollectionInList) {
    columns.splice(1, 0, {
      id: 'collection',
      accessorKey: 'collection',
      header: 'Collection',
      cell({ row: { original: rowData } }) {
        return rowData.collectionLabel;
      },
      size: 126,
    });
  }

  console.log('entries', entries.toJS());

  // if (inferredFields.imageField) {
  //   columns.unshift({
  //     id: 'image',
  //     cell({ row: { original: rowData } }) {
  //       let image = rowData.data[inferredFields.imageField];
  //       if (image) {
  //         image = encodeURI(image);
  //       }

  //       return <Image srcUrl={image} />;
  //     },
  //     size: 56,
  //   });
  // }

  const history = useHistory();

  function handleClick(row) {
    history.push(`/collections/${row.collection}/entries/${row.slug}`);
  }

  return (
    <Table
      style={{ width: '100%' }}
      selectable={false}
      draggable={false}
      rowSize={'md'}
      columns={columns}
      data={entries.toJS()}
      onClick={handleClick}
    />
  );
}

export default EntryListingTable;

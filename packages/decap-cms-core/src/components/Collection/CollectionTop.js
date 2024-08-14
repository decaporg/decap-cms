import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import React from 'react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { Link } from 'react-router-dom';
import { components } from 'decap-cms-ui-default';
import { Button, Card, Icon } from 'decap-cms-ui-next';

const CollectionTopContainer = styled(Card)`
  padding: 1rem;
`;

const CollectionTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CollectionTopHeading = styled.h1`
  ${components.cardTopHeading};
`;

const CollectionTopDescription = styled.p`
  ${components.cardTopDescription};
  margin-bottom: 0;
`;

function getCollectionProps(collection) {
  const collectionLabel = collection.get('label');
  const collectionLabelSingular = collection.get('label_singular');
  const collectionDescription = collection.get('description');

  return {
    collectionLabel,
    collectionLabelSingular,
    collectionDescription,
  };
}

function CollectionTop({ collection, newEntryUrl, t }) {
  const { collectionLabel, collectionLabelSingular, collectionDescription } = getCollectionProps(
    collection,
    t,
  );

  return (
    <CollectionTopContainer>
      <CollectionTopRow>
        <CollectionTopHeading>
          <Icon
            size="lg"
            name={
              collection.get('icon') ??
              (collection.get('type') === 'file_based_collection' ? 'file' : 'folder')
            }
          />
          {collectionLabel}
        </CollectionTopHeading>
        {newEntryUrl ? (
          <Button as={Link} to={newEntryUrl} icon={'plus'}>
            {t('collection.collectionTop.newButton', {
              collectionLabel: collectionLabelSingular || collectionLabel,
            })}
          </Button>
        ) : null}
      </CollectionTopRow>
      {collectionDescription ? (
        <CollectionTopDescription>{collectionDescription}</CollectionTopDescription>
      ) : null}
    </CollectionTopContainer>
  );
}

CollectionTop.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  newEntryUrl: PropTypes.string,
  t: PropTypes.func.isRequired,
};

export default translate()(CollectionTop);

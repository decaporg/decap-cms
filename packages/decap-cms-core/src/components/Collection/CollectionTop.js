import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import React from 'react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { Link } from 'react-router-dom';
import { components } from 'decap-cms-ui-default';
import { Button, Card } from 'decap-cms-ui-next';

const CollectionTopContainer = styled(Card)`
  padding: 18px 20px;
  margin: 0 1rem 1rem 1rem;
`;

const CollectionTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CollectionTopHeading = styled.h1`
  ${components.cardTopHeading};
`;

const CollectionTopNewButton = styled(Button)`
  padding: 0 30px;
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
        <CollectionTopHeading>{collectionLabel}</CollectionTopHeading>
        {newEntryUrl ? (
          <CollectionTopNewButton as={Link} to={newEntryUrl} primary>
            {t('collection.collectionTop.newButton', {
              collectionLabel: collectionLabelSingular || collectionLabel,
            })}
          </CollectionTopNewButton>
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

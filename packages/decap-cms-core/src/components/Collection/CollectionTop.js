import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import React from 'react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownItem, StyledDropdownButton, components, buttons, shadows } from 'decap-cms-ui-default';
import { createHashHistory } from 'history';

const CollectionTopContainer = styled.div`
  ${components.cardTop};
  margin-bottom: 22px;
`;

const CollectionTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CollectionTopHeading = styled.h1`
  ${components.cardTopHeading};
`;

const CollectionTopNewButton = styled(Link)`
  ${buttons.button};
  ${shadows.dropDeep};
  ${buttons.default};
  ${buttons.gray};

  padding: 0 30px;
`;

const CollectionTopDropdownButton = styled(StyledDropdownButton)`
  ${buttons.button};
  ${shadows.dropDeep};
  ${buttons.default};
  ${buttons.gray};

  padding: 0 30px 0 15px;
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

const history = createHashHistory();

function CollectionTop({ collection, newEntryUrl, t }) {
  const { collectionLabel, collectionLabelSingular, collectionDescription } = getCollectionProps(
    collection,
    t,
  );

  const indexFileConfig = collection.get('index_file');
  // const indexFile = get(collection.toJS(), ['meta', 'path', 'index_file'])

  console.log(newEntryUrl)

  function handleNewIndex () {
    history.push(newEntryUrl + "&path_type=index");
  }

  function handleNewLeaf () {
    history.push(newEntryUrl + "&path_type=slug");
  }

  return (
    <CollectionTopContainer>
      <CollectionTopRow>
        <CollectionTopHeading>{collectionLabel}</CollectionTopHeading>
        {indexFileConfig && collection.get('nested') ? (
          <Dropdown
            renderButton={() => (
              <CollectionTopDropdownButton>
                {t('collection.collectionTop.newButton', {
                  collectionLabel: collectionLabelSingular || collectionLabel,
                })}
              </CollectionTopDropdownButton>
            )}
            dropdownTopOverlap="30px"
            dropdownWidth="160px"
            dropdownPosition="left"
          >
            <DropdownItem key={'_index'} label={`Index page`} onClick={handleNewIndex} />
            <DropdownItem key={'{{slug}}'} label={'Leaf page'} onClick={handleNewLeaf} />
          </Dropdown>
        ) : newEntryUrl ? (
          <CollectionTopNewButton to={newEntryUrl}>
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

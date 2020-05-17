import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import React from 'react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { Link } from 'react-router-dom';
import { components } from 'netlify-cms-ui-legacy';
import { Button, Icon, IconButton, ButtonGroup } from 'netlify-cms-ui-default';
import { VIEW_STYLE_LIST, VIEW_STYLE_GRID } from 'Constants/collectionViews';

const CollectionTopContainer = styled.div`
  margin-bottom: 1rem;
`;

const CollectionTopRow = styled.div`
  display: flex;
  margin-bottom: 0.5rem;
  align-items: flex-start;
`;
const CollectionTopHeader = styled.div`
  flex: 1;
`;
const CollectionTopTitle = styled.h1`
  ${components.cardTopHeading};
  line-height: 2rem;
  letter-spacing: -0.25px;
`;

const CollectionTopDescription = styled.p`
  color: ${({ theme }) => theme.color.lowEmphasis};
  font-size: 0.875rem;
  margin: 0.25rem 0 0 0;
`;
const ViewControls = styled(ButtonGroup)`
  margin-left: 1rem;
  margin-right: 1rem;
  flex-wrap: nowrap;
`;
const HeaderIcon = styled(Icon)`
  vertical-align: sub;
  margin-right: 0.5rem;
`;

const CollectionTop = ({
  collection,
  collectionLabel,
  collectionLabelSingular,
  collectionDescription,
  viewStyle,
  onChangeViewStyle,
  newEntryUrl,
  t,
}) => {
  return (
    <CollectionTopContainer>
      <CollectionTopRow>
        <CollectionTopHeader>
          <CollectionTopTitle>
            <HeaderIcon name={collection.get('icon') || 'edit-3'} size="lg" />
            {collectionLabel}
          </CollectionTopTitle>
          {collectionDescription ? (
            <CollectionTopDescription>{collectionDescription}</CollectionTopDescription>
          ) : null}
        </CollectionTopHeader>
        <ViewControls>
          <IconButton
            icon="menu"
            active={viewStyle === VIEW_STYLE_LIST}
            onClick={() => onChangeViewStyle(VIEW_STYLE_LIST)}
          />
          <IconButton
            icon="grid"
            active={viewStyle === VIEW_STYLE_GRID}
            onClick={() => onChangeViewStyle(VIEW_STYLE_GRID)}
          />
        </ViewControls>
        {newEntryUrl ? (
          <Link to={newEntryUrl}>
            <Button icon="plus" primary to={newEntryUrl}>
              {t('collection.collectionTop.newButton', {
                collectionLabel: collectionLabelSingular || collectionLabel,
              })}
            </Button>
          </Link>
        ) : null}
      </CollectionTopRow>
    </CollectionTopContainer>
  );
};

CollectionTop.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  newEntryUrl: PropTypes.string,
  t: PropTypes.func.isRequired,
};

export default translate()(CollectionTop);

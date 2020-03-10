import PropTypes from 'prop-types';
import React from 'react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { Link } from 'react-router-dom';
import { components, colors } from 'netlify-cms-ui-legacy';
import { Card,Button, IconButton, ButtonGroup } from 'netlify-cms-ui-default'
import { VIEW_STYLE_LIST, VIEW_STYLE_GRID } from 'Constants/collectionViews';

const CollectionTopContainer = styled(Card)`
  ${components.cardTop};
`;

const CollectionTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const CollectionTopHeading = styled.h1`
  ${components.cardTopHeading};
`;

const CollectionTopDescription = styled.p`
  ${components.cardTopDescription};
`;

const ViewControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 24px;
`;

const ViewControlsText = styled.span`
  font-size: 14px;
  color: ${colors.text};
  margin-right: 12px;
`;

const CollectionTop = ({
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
        <CollectionTopHeading>{collectionLabel}</CollectionTopHeading>
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
      {collectionDescription ? (
        <CollectionTopDescription>{collectionDescription}</CollectionTopDescription>
      ) : null}
      <ViewControls>
        <ViewControlsText>{t('collection.collectionTop.viewAs')}:</ViewControlsText>
        <ButtonGroup>
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
        </ButtonGroup>
      </ViewControls>
    </CollectionTopContainer>
  );
};

CollectionTop.propTypes = {
  collectionLabel: PropTypes.string.isRequired,
  collectionLabelSingular: PropTypes.string,
  collectionDescription: PropTypes.string,
  viewStyle: PropTypes.oneOf([VIEW_STYLE_LIST, VIEW_STYLE_GRID]).isRequired,
  onChangeViewStyle: PropTypes.func.isRequired,
  newEntryUrl: PropTypes.string,
  t: PropTypes.func.isRequired,
};

export default translate()(CollectionTop);

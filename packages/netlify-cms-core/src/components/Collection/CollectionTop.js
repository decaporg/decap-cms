import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import React from 'react';
import { css } from '@emotion/core';
import styled from '@emotion/styled';
import { connect } from 'react-redux';
import { translate } from 'react-polyglot';
import { Link } from 'react-router-dom';
import { Icon, components, buttons, shadows, colors } from 'netlify-cms-ui-default';
import { selectSortableFields } from 'Reducers/collections';
import { sortByField } from 'Actions/entries';
import { selectEntriesSort } from 'Reducers/entries';
import { VIEW_STYLE_LIST, VIEW_STYLE_GRID } from 'Constants/collectionViews';
import { SortDirection } from '../../types/redux';

const CollectionTopContainer = styled.div`
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

const CollectionTopNewButton = styled(Link)`
  ${buttons.button};
  ${shadows.dropDeep};
  ${buttons.default};
  ${buttons.gray};

  padding: 0 30px;
`;

const CollectionTopDescription = styled.p`
  ${components.cardTopDescription};
`;

const ViewControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${props => (props.children.length > 1 ? 'space-between;' : 'flex-end;')};
  margin-top: 24px;
`;

const ViewControlsSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const ViewControlsText = styled.span`
  ${components.viewControlsText};
`;

const ViewControlsButton = styled.button`
  ${buttons.button};
  color: ${props => (props.isActive ? colors.active : '#b3b9c4')};
  background-color: transparent;
  display: block;
  padding: 0;
  margin: 0 4px;

  &:last-child {
    margin-right: 0;
  }

  ${Icon} {
    display: block;
  }
`;

const styles = {
  buttonActive: css`
    color: ${colors.active};
    background-color: ${colors.activeBackground};
  `,
};

const SortButton = styled.button`
  ${buttons.button};
  color: ${props => (props.isActive ? colors.active : '#7b8290')};
  background-color: ${props => (props.isActive ? colors.activeBackground : 'none')};
  flex: 0 0 auto;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  ${Icon} {
    margin-right: 4px;
    color: ${props => (props.isActive ? colors.active : '#7b8290')};
    background-color: ${props => (props.isActive ? colors.activeBackground : 'none')};
  }

  &:hover {
    ${styles.buttonActive};

    ${Icon} {
      ${styles.buttonActive};
    }
  }
`;

const SortIndex = styled.span`
  min-width: 20px;
`;

const SortList = styled.ul`
  display: flex;
  align-items: center;
  margin: 0;
  list-style: none;
`;

const SortControls = ({ t, fields, onSortClick, sort }) => {
  const multipleActive =
    sort
      ?.valueSeq()
      .toArray()
      .filter(v => v.get('direction') !== SortDirection.None).length > 1;

  const items = fields.map(field => {
    const { key, label } = field;
    const sortField = sort?.get(key);
    const index = sort?.valueSeq().findIndex(v => v.get('key') === key);
    const sortDirection = sortField?.get('direction');
    const isActive = sortDirection && sortDirection !== SortDirection.None;
    let nextDirection;
    switch (sortDirection) {
      case SortDirection.Ascending:
        nextDirection = SortDirection.Descending;
        break;
      case SortDirection.Descending:
        nextDirection = SortDirection.None;
        break;
      default:
        nextDirection = SortDirection.Ascending;
        break;
    }

    const showIndex = isActive && multipleActive;

    return (
      <SortButton key={key} onClick={() => onSortClick(key, nextDirection)} isActive={isActive}>
        {sortDirection === SortDirection.Descending ? (
          <Icon type="chevron" direction="down" size="xsmall"></Icon>
        ) : (
          <Icon type="chevron" direction="up" size="xsmall"></Icon>
        )}
        {label}
        <SortIndex>{showIndex ? ` (${index + 1})` : ''}</SortIndex>
      </SortButton>
    );
  });

  return (
    <ViewControlsSection>
      <ViewControlsText>{t('collection.collectionTop.sortBy')}:</ViewControlsText>
      <SortList>{items}</SortList>
    </ViewControlsSection>
  );
};

function mapStateToProps(state, ownProps) {
  const { collection } = ownProps;
  const sort = selectEntriesSort(state.entries, collection.get('name'));

  return {
    collection,
    sort,
  };
}

const mapDispatchToProps = {
  sortByField,
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  return {
    ...stateProps,
    ...ownProps,
    onSortClick: (key, direction) =>
      dispatchProps.sortByField(stateProps.collection, key, direction),
  };
};

const ConnectedSortControls = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(SortControls);

const ViewStyleControls = ({ t, viewStyle, onChangeViewStyle }) => {
  return (
    <ViewControlsSection>
      <ViewControlsText>{t('collection.collectionTop.viewAs')}:</ViewControlsText>
      <ViewControlsButton
        isActive={viewStyle === VIEW_STYLE_LIST}
        onClick={() => onChangeViewStyle(VIEW_STYLE_LIST)}
      >
        <Icon type="list" />
      </ViewControlsButton>
      <ViewControlsButton
        isActive={viewStyle === VIEW_STYLE_GRID}
        onClick={() => onChangeViewStyle(VIEW_STYLE_GRID)}
      >
        <Icon type="grid" />
      </ViewControlsButton>
    </ViewControlsSection>
  );
};

const getCollectionProps = (collection, t) => {
  const collectionLabel = collection.get('label');
  const collectionLabelSingular = collection.get('label_singular');
  const collectionDescription = collection.get('description');
  const collectionSortableFields = selectSortableFields(collection, t);

  return {
    collectionLabel,
    collectionLabelSingular,
    collectionDescription,
    collectionSortableFields,
  };
};

const CollectionTop = ({ collection, viewStyle, onChangeViewStyle, newEntryUrl, t }) => {
  const {
    collectionLabel,
    collectionLabelSingular,
    collectionDescription,
    collectionSortableFields,
  } = getCollectionProps(collection, t);

  const viewControls = [];
  if (collectionSortableFields.length > 0) {
    viewControls.push(
      <ConnectedSortControls
        key="sortControls"
        t={t}
        fields={collectionSortableFields}
        collection={collection}
      />,
    );
  }
  viewControls.push(
    <ViewStyleControls
      key="viewControls"
      t={t}
      viewStyle={viewStyle}
      onChangeViewStyle={onChangeViewStyle}
    />,
  );

  return (
    <CollectionTopContainer>
      <CollectionTopRow>
        <CollectionTopHeading>{collectionLabel}</CollectionTopHeading>
        {newEntryUrl ? (
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
      <ViewControls>{viewControls}</ViewControls>
    </CollectionTopContainer>
  );
};

CollectionTop.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  viewStyle: PropTypes.oneOf([VIEW_STYLE_LIST, VIEW_STYLE_GRID]).isRequired,
  onChangeViewStyle: PropTypes.func.isRequired,
  newEntryUrl: PropTypes.string,
  t: PropTypes.func.isRequired,
};

export default translate()(CollectionTop);

import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import React from 'react';
import { css } from '@emotion/core';
import styled from '@emotion/styled';
import { connect } from 'react-redux';
import { translate } from 'react-polyglot';
import { Link } from 'react-router-dom';
import { Icon, components, buttons, shadows, colors } from 'netlify-cms-ui-default';
import { selectField } from 'Reducers/collections';
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
  font-size: 14px;
  color: ${colors.text};
  margin-right: 12px;
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

const SortList = styled.ul`
  display: flex;
  align-items: center;
  margin: 0;
  list-style: none;
`;

const SortControls = ({ t, fields, onSortClick, sort }) => {
  const items = fields.map(f => {
    const sortField = sort && sort[f.key];
    const sortDirection = sortField?.direction;
    const isActive = sortField?.active && sortDirection !== SortDirection.None;
    let nextDirection;
    switch (sortDirection) {
      case SortDirection.Ascending:
        nextDirection = isActive ? SortDirection.Descending : sortDirection;
        break;
      case SortDirection.Descending:
        nextDirection = isActive ? SortDirection.None : sortDirection;
        break;
      default:
        nextDirection = SortDirection.Ascending;
        break;
    }

    return (
      <SortButton key={f.key} onClick={() => onSortClick(f.key, nextDirection)} isActive={isActive}>
        {sortDirection === SortDirection.Descending ? (
          <Icon type="chevron" direction="down" size="small" />
        ) : (
          <Icon type="chevron" direction="up" size="small" />
        )}
        {f.label}
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

const getCollectionProps = collection => {
  const collectionLabel = collection.get('label');
  const collectionLabelSingular = collection.get('label_singular');
  const collectionDescription = collection.get('description');
  const collectionSortableFields = collection
    .get('sortableFields')
    .toJS()
    .map(key => ({ key, field: selectField(collection, key)?.toJS() }))
    .filter(item => !!item.field)
    .map(item => ({ ...item.field, key: item.key }));

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
  } = getCollectionProps(collection);

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

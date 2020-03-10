import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import React from 'react';
import styled from '@emotion/styled';
import { connect } from 'react-redux';
import { translate } from 'react-polyglot';
import { Link } from 'react-router-dom';
import {
  Icon,
  components,
  buttons,
  shadows,
  colors,
  Dropdown,
  DropdownItem,
  StyledDropdownButton,
} from 'netlify-cms-ui-default';
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

const StyledDropdownItem = styled(DropdownItem)`
  ${components.dropdownItem}
`;

const SortButton = styled(StyledDropdownButton)`
  ${buttons.button};
  ${buttons.medium};
  ${buttons.gray};
  margin-right: 8px;

  &:after {
    top: 11px;
  }

  &.active {
    color: ${colors.active};
  }
`;

const SortControls = ({ t, fields, onSortClick, sortField, sortDirection }) => {
  const items = fields.map(f => {
    return (
      <StyledDropdownItem
        key={f.key}
        label={f.label}
        onClick={() => onSortClick(f.key, sortDirection)}
        className={sortField?.key === f.key ? 'active' : ''}
      />
    );
  });

  const selected = sortField || fields[0];
  const { key } = selected;

  const directions = [
    <StyledDropdownItem
      key={SortDirection.Ascending}
      label={SortDirection.Ascending}
      onClick={() => onSortClick(key, SortDirection.Ascending)}
      className={sortDirection === SortDirection.Ascending ? 'active' : ''}
    />,
    <StyledDropdownItem
      key={SortDirection.Descending}
      label={SortDirection.Descending}
      onClick={() => onSortClick(key, SortDirection.Descending)}
      className={sortDirection === SortDirection.Descending ? 'active' : ''}
    />,
  ];

  const sortLabel =
    sortDirection === SortDirection.Ascending
      ? t('collection.collectionTop.ascending')
      : t('collection.collectionTop.descending');

  return (
    <ViewControlsSection>
      <ViewControlsText>{t('collection.collectionTop.sortBy')}:</ViewControlsText>
      <Dropdown
        renderButton={() => (
          <SortButton className={sortField ? 'active' : ''}>{selected.label}</SortButton>
        )}
      >
        {items}
      </Dropdown>
      <Dropdown
        renderButton={() => (
          <SortButton className={sortField ? 'active' : ''}>{sortLabel}</SortButton>
        )}
      >
        {directions}
      </Dropdown>
    </ViewControlsSection>
  );
};

function mapStateToProps(state, ownProps) {
  const { collection } = ownProps;
  const sort = selectEntriesSort(state.entries, collection.get('name'));
  const sortField =
    sort?.key &&
    selectField(collection, sort.key)
      ?.set('key', sort.key)
      .toJS();

  const sortDirection = sort?.direction || SortDirection.Ascending;

  return {
    collection,
    sortField,
    sortDirection,
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

import React from 'react';
import styled from '@emotion/styled';
import { connect } from 'react-redux';
import { boundGetAsset } from 'Actions/media';
import { Link } from 'react-router-dom';
import { colors, colorsRaw, components, lengths, zIndex } from 'netlify-cms-ui-legacy';
import { VIEW_STYLE_LIST, VIEW_STYLE_GRID } from 'Constants/collectionViews';
import { selectIsLoadingAsset } from 'Reducers/medias';
import { selectEntryCollectionTitle } from 'Reducers/collections';

const ListCard = styled.li`
  ${components.card};
  width: ${lengths.topCardWidth};
  margin-left: 12px;
  margin-bottom: 10px;
  overflow: hidden;
`;

const ListCardLink = styled(Link)`
  display: block;
  max-width: 100%;
  padding: 16px 22px;
  &:hover {
    background-color: ${colors.foreground};
  }
`;

const GridCard = styled.li`
  ${components.card};
  flex: 0 0 335px;
  height: 240px;
  overflow: hidden;
  margin-left: 12px;
  margin-bottom: 16px;
`;

const GridCardLink = styled(Link)`
  display: block;
  &,
  &:hover {
    background-color: ${colors.foreground};
    color: ${colors.text};
  }
`;

const CollectionLabel = styled.h2`
  font-size: 12px;
  color: ${colors.textLead};
  text-transform: uppercase;
`;

const ListCardTitle = styled.h2`
  margin-bottom: 0;
`;

const CardHeading = styled.h2`
  margin: 0 0 2px;
`;

const CardBody = styled.div`
  padding: 16px 22px;
  height: 90px;
  position: relative;
  margin-bottom: ${props => props.hasImage && 0};

  &:after {
    content: '';
    position: absolute;
    display: block;
    z-index: ${zIndex.zIndex1};
    bottom: 0;
    left: -20%;
    height: 140%;
    width: 140%;
    box-shadow: inset 0 -15px 24px ${colorsRaw.white};
  }
`;

const CardImage = styled.div`
  background-image: url(${props => props.src});
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
  height: 150px;
`;

const EntryCard = ({
  path,
  summary,
  image,
  imageField,
  collectionLabel,
  viewStyle = VIEW_STYLE_LIST,
  getAsset,
}) => {
  if (viewStyle === VIEW_STYLE_LIST) {
    return (
      <ListCard>
        <ListCardLink to={path}>
          {collectionLabel ? <CollectionLabel>{collectionLabel}</CollectionLabel> : null}
          <ListCardTitle>{summary}</ListCardTitle>
        </ListCardLink>
      </ListCard>
    );
  }

  if (viewStyle === VIEW_STYLE_GRID) {
    return (
      <GridCard>
        <GridCardLink to={path}>
          <CardBody hasImage={image}>
            {collectionLabel ? <CollectionLabel>{collectionLabel}</CollectionLabel> : null}
            <CardHeading>{summary}</CardHeading>
          </CardBody>
          {image ? <CardImage src={getAsset(image, imageField).toString()} /> : null}
        </GridCardLink>
      </GridCard>
    );
  }
};

const mapStateToProps = (state, ownProps) => {
  const { entry, inferedFields, collection } = ownProps;
  const entryData = entry.get('data');
  const summary = selectEntryCollectionTitle(collection, entry);

  let image = entryData.get(inferedFields.imageField);
  if (image) {
    image = encodeURI(image);
  }

  const isLoadingAsset = selectIsLoadingAsset(state.medias);

  return {
    summary,
    path: `/collections/${collection.get('name')}/entries/${entry.get('slug')}`,
    image,
    imageFolder: collection
      .get('fields')
      ?.find(f => f.get('name') === inferedFields.imageField && f.get('widget') === 'image'),
    isLoadingAsset,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    boundGetAsset: (collection, entry) => boundGetAsset(dispatch, collection, entry),
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    getAsset: dispatchProps.boundGetAsset(ownProps.collection, ownProps.entry),
  };
};

const ConnectedEntryCard = connect(mapStateToProps, mapDispatchToProps, mergeProps)(EntryCard);

export default ConnectedEntryCard;

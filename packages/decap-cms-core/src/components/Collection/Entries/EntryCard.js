import React from 'react';
import styled from '@emotion/styled';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { colors, colorsRaw, components, lengths, zIndex } from 'decap-cms-ui-default';
import { translate } from 'react-polyglot';

import { boundGetAsset } from '../../../actions/media';
import { VIEW_STYLE_LIST, VIEW_STYLE_GRID } from '../../../constants/collectionViews';
import { selectIsLoadingAsset } from '../../../reducers/medias';
import { selectEntryCollectionTitle } from '../../../reducers/collections';

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
  padding: 16px 20px;

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
  height: 100%;
  outline-offset: -2px;

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
  display: flex;
  justify-content: space-between;
`;

const CardHeading = styled.h2`
  margin: 0 0 2px;
  display: flex;
  justify-content: space-between;
`;

const CardBody = styled.div`
  padding: 16px 20px;
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

const TitleIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const WorkflowBadge = styled.span`
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  text-transform: uppercase;
  background-color: ${props => {
    switch (props.status) {
      case 'draft':
        return colors.statusDraftBackground;
      case 'pending_review':
        return colors.statusReviewBackground;
      case 'pending_publish':
        return colors.statusReadyBackground;
      default:
        return colors.background;
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'draft':
        return colors.statusDraftText;
      case 'pending_review':
        return colors.statusReviewText;
      case 'pending_publish':
        return colors.statusReadyText;
      default:
        return colors.text;
    }
  }};
`;

function EntryCard({
  path,
  summary,
  image,
  imageField,
  collectionLabel,
  viewStyle = VIEW_STYLE_LIST,
  workflowStatus,
  getAsset,
  t,
}) {
  function getStatusLabel(status) {
    switch (status) {
      case 'pending_review':
        return t('editor.editorToolbar.inReview');
      case 'pending_publish':
        return t('editor.editorToolbar.ready');
      case 'draft':
        return t('editor.editorToolbar.draft');
      default:
        return status;
    }
  }

  if (viewStyle === VIEW_STYLE_LIST) {
    return (
      <ListCard>
        <ListCardLink to={path}>
          {collectionLabel ? <CollectionLabel>{collectionLabel}</CollectionLabel> : null}
          <ListCardTitle>
            {summary}
            <TitleIcons>
              {workflowStatus && (
                <WorkflowBadge status={workflowStatus}>
                  {getStatusLabel(workflowStatus)}
                </WorkflowBadge>
              )}
            </TitleIcons>
          </ListCardTitle>
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
            <CardHeading>
              {summary}
              <TitleIcons>
                {workflowStatus && (
                  <WorkflowBadge status={workflowStatus}>
                    {getStatusLabel(workflowStatus)}
                  </WorkflowBadge>
                )}
              </TitleIcons>
            </CardHeading>
          </CardBody>
          {image ? <CardImage src={getAsset(image, imageField).toString()} /> : null}
        </GridCardLink>
      </GridCard>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { entry, inferredFields, collection } = ownProps;
  const entryData = entry.get('data');
  const summary = selectEntryCollectionTitle(collection, entry);

  let image = entryData.get(inferredFields.imageField);
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
      ?.find(f => f.get('name') === inferredFields.imageField && f.get('widget') === 'image'),
    isLoadingAsset,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    boundGetAsset: (collection, entry) => boundGetAsset(dispatch, collection, entry),
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    getAsset: dispatchProps.boundGetAsset(ownProps.collection, ownProps.entry),
  };
}

const ConnectedEntryCard = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(translate()(EntryCard));

export default ConnectedEntryCard;

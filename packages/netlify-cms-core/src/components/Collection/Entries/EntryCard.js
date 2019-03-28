import React from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { resolvePath } from 'netlify-cms-lib-util';
import { colors, colorsRaw, components, lengths } from 'netlify-cms-ui-default';
import { VIEW_STYLE_LIST, VIEW_STYLE_GRID } from 'Constants/collectionViews';
import { compileStringTemplate, parseDateFromEntry } from 'Lib/stringTemplate';
import { selectIdentifier } from 'Reducers/collections';

const ListCard = styled.li`
  ${components.card};
  width: ${lengths.topCardWidth};
  margin-left: 12px;
  margin-bottom: 16px;
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
    z-index: 1;
    bottom: 0;
    left: -20%;
    height: 140%;
    width: 140%;
    box-shadow: inset 0 -15px 24px ${colorsRaw.white};
  }
`;

const CardImage = styled.div`
  background-image: url(${props => props.url});
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
  height: 150px;
`;

const EntryCard = ({
  collection,
  entry,
  inferedFields,
  publicFolder,
  collectionLabel,
  viewStyle = VIEW_STYLE_LIST,
}) => {
  const label = entry.get('label');
  const entryData = entry.get('data');
  const defaultTitle = label || entryData.get(inferedFields.titleField);
  const path = `/collections/${collection.get('name')}/entries/${entry.get('slug')}`;
  const summary = collection.get('summary');
  const date = parseDateFromEntry(entry, collection) || null;
  const identifier = entryData.get(selectIdentifier(collection));
  const title = summary
    ? compileStringTemplate(summary, date, identifier, entryData)
    : defaultTitle;

  let image = entryData.get(inferedFields.imageField);
  image = resolvePath(image, publicFolder);
  if (image) {
    image = encodeURI(image);
  }

  if (viewStyle === VIEW_STYLE_LIST) {
    return (
      <ListCard>
        <ListCardLink to={path}>
          {collectionLabel ? <CollectionLabel>{collectionLabel}</CollectionLabel> : null}
          <ListCardTitle>{title}</ListCardTitle>
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
            <CardHeading>{title}</CardHeading>
          </CardBody>
          {image ? <CardImage url={image} /> : null}
        </GridCardLink>
      </GridCard>
    );
  }
};

export default EntryCard;

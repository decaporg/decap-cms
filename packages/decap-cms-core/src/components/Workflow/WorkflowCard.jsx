import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { translate } from 'react-polyglot';
import { Link } from 'react-router-dom';
import { Card, Button } from 'decap-cms-ui-next';

const WorkflowLink = styled(Link)`
  display: block;
  padding: 0 18px 18px;
  height: 200px;
  overflow: hidden;
`;

const CardCollection = styled.div`
  color: ${({ theme }) => theme.color.mediumEmphasis};
  text-transform: uppercase;
  margin-top: 12px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const CardTitle = styled.h2`
  margin: 28px 0 0;
`;

const CardDateContainer = styled.div`
  color: ${({ theme }) => theme.color.mediumEmphasis};
`;

const CardBody = styled.p`
  margin: 24px 0 0;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
`;

const CardButtonContainer = styled.div`
  display: flex;
  padding: 12px 18px;
`;

const DeleteButton = styled(Button)`
  margin-right: 6px;
`;

const PublishButton = styled(Button)`
  margin-left: 6px;
`;

const WorkflowCardContainer = styled(Card)`
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
`;

function lastChangePhraseKey(date, author) {
  if (date && author) {
    return 'lastChange';
  } else if (date) {
    return 'lastChangeNoAuthor';
  } else if (author) {
    return 'lastChangeNoDate';
  }
}

const CardDate = translate()(({ t, date, author }) => {
  const key = lastChangePhraseKey(date, author);
  if (key) {
    return (
      <CardDateContainer>{t(`workflow.workflowCard.${key}`, { date, author })}</CardDateContainer>
    );
  }
});

function WorkflowCard({
  collectionLabel,
  title,
  authorLastChange,
  body,
  isModification,
  editLink,
  timestamp,
  onDelete,
  allowPublish,
  canPublish,
  onPublish,
  postAuthor,
  t,
}) {
  return (
    <WorkflowCardContainer>
      <WorkflowLink to={editLink}>
        <CardCollection>{collectionLabel}</CardCollection>
        {postAuthor}
        <CardTitle>{title}</CardTitle>
        {(timestamp || authorLastChange) && <CardDate date={timestamp} author={authorLastChange} />}
        <CardBody>{body}</CardBody>
      </WorkflowLink>
      <CardButtonContainer>
        <DeleteButton onClick={onDelete} type="danger">
          {isModification
            ? t('workflow.workflowCard.deleteChanges')
            : t('workflow.workflowCard.deleteNewEntry')}
        </DeleteButton>
        {allowPublish && (
          <PublishButton disabled={!canPublish} onClick={onPublish} type="success" primary>
            {isModification
              ? t('workflow.workflowCard.publishChanges')
              : t('workflow.workflowCard.publishNewEntry')}
          </PublishButton>
        )}
      </CardButtonContainer>
    </WorkflowCardContainer>
  );
}

WorkflowCard.propTypes = {
  collectionLabel: PropTypes.string.isRequired,
  title: PropTypes.string,
  authorLastChange: PropTypes.string,
  body: PropTypes.string,
  isModification: PropTypes.bool,
  editLink: PropTypes.string.isRequired,
  timestamp: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
  allowPublish: PropTypes.bool.isRequired,
  canPublish: PropTypes.bool.isRequired,
  onPublish: PropTypes.func.isRequired,
  postAuthor: PropTypes.string,
  t: PropTypes.func.isRequired,
};

export default translate()(WorkflowCard);

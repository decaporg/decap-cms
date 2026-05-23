import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { Link } from 'react-router-dom';
import { components, colors, colorsRaw, transitions, buttons } from 'decap-cms-ui-default';

const styles = {
  text: css`
    font-size: 13px;
    font-weight: normal;
    margin-top: 4px;
  `,
  button: css`
    ${buttons.button};
    width: auto;
    flex: 1 0 0;
    font-size: 13px;
    padding: 6px;
  `,
};

const WorkflowLink = styled(Link)`
  display: block;
  padding: 8px;
  height: 140px;
  overflow: hidden;

  @media (min-width: 800px) {
    height: 200px;
    padding: 12px 18px 18px;
  }
`;

const CardCollection = styled.div`
  font-size: 12px;
  color: ${colors.textLead};
  text-transform: uppercase;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  @media (min-width: 800px) {
    font-size: 14px;
  }
`;

const CardTitle = styled.h2`
  font-size: 14px;
  line-height: 17px;
  margin: 10px 0 0;
  color: ${colors.textLead};
  word-break: break-word;

  @media (min-width: 800px) {
    font-size: 15px;
    line-height: 18px;
    margin-top: 28px;
  }
`;

const CardDateContainer = styled.div`
  ${styles.text};
`;

const CardBody = styled.p`
  ${styles.text};
  line-height: 17px;
  color: ${colors.text};
  margin: 10px 0 0;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;

  @media (min-width: 800px) {
    margin-top: 24px;
  }
`;

const CardButtonContainer = styled.div`
  background-color: ${colors.foreground};
  position: absolute;
  bottom: 0;
  width: 100%;
  display: flex;
  padding: 8px;
  flex-direction: column;
  gap: 6px;
  transition: opacity ${transitions.main};
  cursor: pointer;

  @media (min-width: 800px) {
    padding: 12px 18px;
    flex-direction: row;
    gap: 12px;
  }
`;

const DeleteButton = styled.button`
  ${styles.button};
  background-color: ${colorsRaw.redLight};
  color: ${colorsRaw.red};
`;

const PublishButton = styled.button`
  ${styles.button};
  background-color: ${colorsRaw.teal};
  color: ${colors.textLight};

  &[disabled] {
    ${buttons.disabled};
  }
`;

const WorkflowCardContainer = styled.div`
  ${components.card};
  margin-bottom: 10px;
  position: relative;
  overflow: hidden;

  &:hover ${CardButtonContainer}, &:has(:focus-visible) ${CardButtonContainer} {
    opacity: 1;
  }

  @media (min-width: 800px) {
    margin-bottom: 24px;
  }
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
        <DeleteButton onClick={onDelete}>
          {isModification
            ? t('workflow.workflowCard.deleteChanges')
            : t('workflow.workflowCard.deleteNewEntry')}
        </DeleteButton>
        {allowPublish && (
          <PublishButton disabled={!canPublish} onClick={onPublish}>
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

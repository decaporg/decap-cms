import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { Link } from 'react-router-dom';
import {
  Thumbnail,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownMenuItem,
  IconButton,
} from 'decap-cms-ui-next';

const StyledWorkflowCard = styled(Thumbnail)`
  border: 1px solid ${({ theme }) => theme.color.border};
  transition: 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.color.elevatedSurfaceHighlight};
  }
`;

const ActionsWrap = styled.div`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 1;
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

const formatDateAuthor = translate()(({ t, date, author }) => {
  const key = lastChangePhraseKey(date, author);
  if (key) {
    return t(`workflow.workflowCard.${key}`, { date, author });
  }
});

function WorkflowCard({
  collectionLabel,
  image,
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
    <StyledWorkflowCard
      as={Link}
      to={editLink}
      selectable={false}
      supertitle={collectionLabel}
      previewImgSrc={image}
      horizontal={true}
      title={title}
      description={body}
      subtitle={
        { postAuthor } &&
        (timestamp || authorLastChange) &&
        formatDateAuthor({ date: timestamp, author: authorLastChange })
      }
      renderActions={() => (
        <ActionsWrap>
          <Dropdown>
            <DropdownTrigger>
              <IconButton icon="more-vertical" />
            </DropdownTrigger>
            <DropdownMenu>
              {allowPublish && (
                <DropdownMenuItem onClick={onPublish} icon="radio" disabled={!canPublish}>
                  {isModification
                    ? t('workflow.workflowCard.publishChanges')
                    : t('workflow.workflowCard.publishNewEntry')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDelete} icon="trash-2" type="danger">
                {isModification
                  ? t('workflow.workflowCard.deleteChanges')
                  : t('workflow.workflowCard.deleteNewEntry')}
              </DropdownMenuItem>
            </DropdownMenu>
          </Dropdown>
        </ActionsWrap>
      )}
    />
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

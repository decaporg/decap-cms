import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Badge, Icon } from 'decap-cms-ui-next';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

import {
  getWorkflowStatusIconName,
  getWorkflowStatusColor,
  getWorkflowStatusTranslatedKey,
} from '../../../lib/editorialWorkflowHelper';

const StyledWorkflowList = styled.ul`
  display: flex;
  flex-direction: row;
  gap: 1rem;
`;

const WorkflowListCard = styled(Badge)`
  ${({ theme, color }) => css`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    color: ${theme.color[color][theme.darkMode ? '300' : '1400']};
    padding: 1rem;
    border-radius: 8px;
  `}
`;

const WorkflowIcon = styled(Icon)`
  margin-bottom: 1rem;
`;

const WorkflowLabel = styled.div`
  font-size: 0.85rem;
`;
const WorkflowCount = styled.div`
  font-size: 1.75rem;
`;

function WorkflowList({ entries, t }) {
  const totalEntriesCount = entries.reduce(
    (total, workflowEntries) => total + workflowEntries.size,
    0,
  );

  return (
    <StyledWorkflowList>
      <WorkflowListCard key="all_entries" variant="outline">
        <WorkflowIcon name="file" size="xl" />
        <WorkflowLabel>{t('workflow.workflowList.allEntriesHeader')}</WorkflowLabel>
        <WorkflowCount>{totalEntriesCount}</WorkflowCount>
      </WorkflowListCard>

      {entries.entrySeq().map(([workflowStatus, workflowEntries]) => (
        <WorkflowListCard
          key={workflowStatus}
          variant="outline"
          color={getWorkflowStatusColor(workflowStatus)}
        >
          <WorkflowIcon name={getWorkflowStatusIconName(workflowStatus)} size="xl" />
          <WorkflowLabel>{t(getWorkflowStatusTranslatedKey(workflowStatus))}</WorkflowLabel>
          <WorkflowCount>{workflowEntries.size}</WorkflowCount>
        </WorkflowListCard>
      ))}
    </StyledWorkflowList>
  );
}

WorkflowList.propTypes = {
  entries: ImmutablePropTypes.orderedMap,
  collections: ImmutablePropTypes.map.isRequired,
  t: PropTypes.func.isRequired,
};

export default WorkflowList;

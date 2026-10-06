import styled from '@emotion/styled';
import React from 'react';
import { shallowEqual } from 'react-redux';

import { createNewEntry } from '@/core/actions/collections';
import {
  checkScheduledPublishes,
  deleteUnpublishedEntry,
  loadUnpublishedEntries,
  publishUnpublishedEntry,
  updateUnpublishedEntryStatus,
} from '@/core/actions/editorialWorkflow';
import { EDITORIAL_WORKFLOW } from '@/core/constants/publishModes';
import { useCurrentUserScopes } from '@/core/hooks/useCurrentUserScopes';
import { useAppDispatch, useAppSelector } from '@/core/hooks/useRedux';
import { translate } from '@/core/i18n';
import { canEditCollection } from '@/core/lib/collectionAccess';
import { useCmsSlots } from '@/core/lib/slots';
import { selectCreatableCollectionNames } from '@/core/lib/canCreateNewEntry';
import { selectUnpublishedEntriesGroupedByStatus } from '@/core/reducers';
import { components, Dropdown, DropdownItem, lengths, Loader, shadows, StyledDropdownButton } from '@/ui/default/index';
import WorkflowList from './WorkflowList';

import type { Status } from '@/core/constants/publishModes';
import type { CmsCollections, CmsCollectionState } from '@/lib/util/index';
import type { TranslateFunction } from '@/ui/default/index';

type Collections = CmsCollections;
type Collection = CmsCollectionState;

const WorkflowContainer = styled.div`
  height: 100vh;
  margin: ${lengths.pageMarginMobile};
  @media (min-width: 500px) {
    margin: ${lengths.pageMargin};
  }
`;

const WorkflowTop = styled.div`
  ${components.cardTop};
`;

const WorkflowTopRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;

  span[role='button'] {
    ${shadows.dropDeep};
  }
`;

const WorkflowTopHeading = styled.h1`
  ${components.cardTopHeading};
`;

const WorkflowTopDescription = styled.p`
  ${components.cardTopDescription};
`;

interface WorkflowProps {
  t: TranslateFunction;
}

function Workflow({ t }: WorkflowProps) {
  const { renderLoader } = useCmsSlots();
  const dispatch = useAppDispatch();
  const collections = useAppSelector((state: any) => state.collections as Collections);
  // `create` plus any collection `limit` (selectCanCreateNewEntry).
  const creatableNames = useAppSelector(selectCreatableCollectionNames, shallowEqual);
  const isEditorialWorkflow = useAppSelector(
    (state: any) => state.config.publish_mode === EDITORIAL_WORKFLOW,
  );
  const isOpenAuthoring = useAppSelector((state: any) => state.globalUI.useOpenAuthoring);
  const userScopes = useCurrentUserScopes();
  const isFetching = useAppSelector((state: any) =>
    isEditorialWorkflow ? (state.editorialWorkflow?.pages?.isFetching ?? false) : false
  );
  const unpublishedEntries = useAppSelector((state: any) =>
    isEditorialWorkflow ? selectUnpublishedEntriesGroupedByStatus(state) : undefined
  );

  React.useEffect(() => {
    if (isEditorialWorkflow) {
      dispatch(loadUnpublishedEntries(collections));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- match prior componentDidMount semantics
  }, []);

  // DCMS-1991: scheduled publishing has no server-side cron - a scheduled
  // entry only actually publishes while a tab has the Workflow board
  // mounted, checked here on mount and every minute after. If nobody has
  // the CMS open when the scheduled time arrives, it publishes the next
  // time someone does. This is a deliberate best-effort limitation, not a
  // bug - see the doc comment on `checkScheduledPublishes`.
  React.useEffect(() => {
    if (!isEditorialWorkflow) return;
    dispatch(checkScheduledPublishes() as any);
    const interval = setInterval(() => {
      dispatch(checkScheduledPublishes() as any);
    }, 60_000);
    return () => clearInterval(interval);
  }, [isEditorialWorkflow, dispatch]);

  if (!isEditorialWorkflow) return null;
  if (isFetching) {
    return renderLoader
      ? <>{renderLoader({ label: t('workflow.workflow.loading'), context: 'workflow' })}</>
      : <Loader active>{t('workflow.workflow.loading')}</Loader>;
  }
  const reviewCount = unpublishedEntries ? (unpublishedEntries['pending_review']?.length ?? 0) : 0;
  const readyCount = unpublishedEntries ? (unpublishedEntries['pending_publish']?.length ?? 0) : 0;
  const creatableCollections = Object.values(collections).filter(
    (collection: Collection) => creatableNames.includes(collection.name) && canEditCollection(collection, userScopes),
  );

  return (
    <WorkflowContainer>
      <WorkflowTop>
        <WorkflowTopRow>
          <WorkflowTopHeading>{t('workflow.workflow.workflowHeading')}</WorkflowTopHeading>
          {creatableCollections.length > 0
            ? (
              <Dropdown
                dropdownWidth="160px"
                dropdownPosition="left"
                dropdownTopOverlap="40px"
                renderButton={() => <StyledDropdownButton>{t('workflow.workflow.newPost')}</StyledDropdownButton>}
              >
                {creatableCollections.map((collection: Collection) => (
                  <DropdownItem
                    key={collection.name}
                    label={collection.label}
                    onClick={() => createNewEntry(collection.name)}
                  />
                ))}
              </Dropdown>
            )
            : null}
        </WorkflowTopRow>
        <WorkflowTopDescription>
          {t('workflow.workflow.description', {
            smart_count: reviewCount,
            readyCount,
          })}
        </WorkflowTopDescription>
      </WorkflowTop>
      {React.createElement(WorkflowList as any, {
        entries: unpublishedEntries,
        handleChangeStatus: (
          collection: string,
          slug: string,
          oldStatus: Status,
          newStatus: Status,
        ) => dispatch(updateUnpublishedEntryStatus(collection, slug, oldStatus, newStatus)),
        handlePublish: (collection: string, slug: string) => dispatch(publishUnpublishedEntry(collection, slug)),
        handleDelete: (collection: string, slug: string) => dispatch(deleteUnpublishedEntry(collection, slug)),
        isOpenAuthoring,
        collections,
        userScopes,
      })}
    </WorkflowContainer>
  );
}

export default translate()(Workflow as any) as any;

import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { OrderedMap } from 'immutable';
import { translate } from 'react-polyglot';
import { connect } from 'react-redux';
import { Loader, components } from 'netlify-cms-ui-legacy';
import { Button, Menu, MenuItem, useUIContext } from 'netlify-cms-ui-default';
import { createNewEntry } from 'Actions/collections';
import {
  loadUnpublishedEntries,
  updateUnpublishedEntryStatus,
  publishUnpublishedEntry,
  deleteUnpublishedEntry,
} from 'Actions/editorialWorkflow';
import { selectUnpublishedEntriesByStatus } from 'Reducers';
import { EDITORIAL_WORKFLOW, status } from 'Constants/publishModes';
import WorkflowList from './WorkflowList';
import { CollectionsAppBarActions } from '../Collection/Collection';

const WorkflowContainer = styled.div`
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const WorkflowTop = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  margin: -1rem -1rem 0 -1rem;
  padding: 1rem;
`;

const WorkflowTopRow = styled.div`
  display: flex;
  align-items: flex-start;
`;

const WorkflowTopHeadingWrap = styled.div`
  flex: 1;
`;
const WorkflowTopHeading = styled.h1`
  ${components.cardTopHeading};
  line-height: 2rem;
  letter-spacing: -0.25px;
`;

const WorkflowTopDescription = styled.p`
  color: ${({ theme }) => theme.color.lowEmphasis};
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
`;

const Workflow = ({
  loadUnpublishedEntries,
  isEditorialWorkflow,
  collections,
  isOpenAuthoring,
  isFetching,
  unpublishedEntries,
  updateUnpublishedEntryStatus,
  publishUnpublishedEntry,
  deleteUnpublishedEntry,
  t,
}) => {
  const [createMenuAnchorEl, setCreateMenuAnchorEl] = useState();
  const { setPageTitle, setBreadcrumbs, renderAppBarEnd } = useUIContext();

  useEffect(() => {
    setPageTitle(null);
    setBreadcrumbs([
      {
        label: 'My Website',
        onClick: () => {
          history.push('/');
        },
      },
      { label: 'Workflow' },
    ]);
    renderAppBarEnd(() => <CollectionsAppBarActions collections={collections} t={t} />);

    if (isEditorialWorkflow) {
      loadUnpublishedEntries(collections);
    }
  }, []);

  if (!isEditorialWorkflow) return null;
  if (isFetching) return <Loader active>{t('workflow.workflow.loading')}</Loader>;
  const reviewCount = unpublishedEntries.get('pending_review').size;
  const readyCount = unpublishedEntries.get('pending_publish').size;

  return (
    <WorkflowContainer>
      <WorkflowTop>
        <WorkflowTopRow>
          <WorkflowTopHeadingWrap>
            <WorkflowTopHeading>{t('workflow.workflow.workflowHeading')}</WorkflowTopHeading>
            <WorkflowTopDescription>
              {t('workflow.workflow.description', {
                smart_count: reviewCount,
                readyCount,
              })}
            </WorkflowTopDescription>
          </WorkflowTopHeadingWrap>
          <Button primary hasMenu onClick={e => setCreateMenuAnchorEl(e.currentTarget)}>
            {t('workflow.workflow.newPost')}
          </Button>
          <Menu
            open={!!createMenuAnchorEl}
            anchorEl={createMenuAnchorEl}
            onClose={() => setCreateMenuAnchorEl(null)}
          >
            {collections
              .filter(collection => collection.get('create'))
              .toList()
              .map(collection => (
                <MenuItem
                  key={collection.get('name')}
                  icon={collection.get('icon') || 'edit-3'}
                  onClick={() => {
                    setCreateMenuAnchorEl(null);
                    createNewEntry(collection.get('name'));
                  }}
                >
                  {collection.get('label')}
                </MenuItem>
              ))}
          </Menu>
        </WorkflowTopRow>
      </WorkflowTop>
      <WorkflowList
        entries={unpublishedEntries}
        handleChangeStatus={updateUnpublishedEntryStatus}
        handlePublish={publishUnpublishedEntry}
        handleDelete={deleteUnpublishedEntry}
        isOpenAuthoring={isOpenAuthoring}
        collection={collections}
      />
    </WorkflowContainer>
  );
};

Workflow.propTypes = {
  collections: ImmutablePropTypes.orderedMap,
  isEditorialWorkflow: PropTypes.bool.isRequired,
  isOpenAuthoring: PropTypes.bool,
  isFetching: PropTypes.bool,
  unpublishedEntries: ImmutablePropTypes.map,
  loadUnpublishedEntries: PropTypes.func.isRequired,
  updateUnpublishedEntryStatus: PropTypes.func.isRequired,
  publishUnpublishedEntry: PropTypes.func.isRequired,
  deleteUnpublishedEntry: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  const { collections, config, globalUI } = state;
  const isEditorialWorkflow = config.get('publish_mode') === EDITORIAL_WORKFLOW;
  const isOpenAuthoring = globalUI.get('useOpenAuthoring', false);
  const returnObj = { collections, isEditorialWorkflow, isOpenAuthoring };

  if (isEditorialWorkflow) {
    returnObj.isFetching = state.editorialWorkflow.getIn(['pages', 'isFetching'], false);

    /*
     * Generates an ordered Map of the available status as keys.
     * Each key containing a Sequence of available unpubhlished entries
     * Eg.: OrderedMap{'draft':Seq(), 'pending_review':Seq(), 'pending_publish':Seq()}
     */
    returnObj.unpublishedEntries = status.reduce((acc, currStatus) => {
      const entries = selectUnpublishedEntriesByStatus(state, currStatus);
      return acc.set(currStatus, entries);
    }, OrderedMap());
  }
  return returnObj;
}

export default connect(mapStateToProps, {
  loadUnpublishedEntries,
  updateUnpublishedEntryStatus,
  publishUnpublishedEntry,
  deleteUnpublishedEntry,
})(translate()(Workflow));

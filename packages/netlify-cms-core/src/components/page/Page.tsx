import { styled } from '@mui/material/styles';
import React, { useMemo } from 'react';
import { translate } from 'react-polyglot';
import { connect } from 'react-redux';

import { getAdditionalLink } from '../../lib/registry';
import { Collections, State } from '../../types/redux';
import { lengths } from '../../ui';
import Sidebar from '../Collection/Sidebar';

const StylePage = styled('div')`
  margin: ${lengths.pageMargin};
`;

const StyledPageContent = styled('div')`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface PageProps {
  match: any;
}

interface ConnectedPageProps extends PageProps {
  collections: Collections;
  isSearchEnabled: boolean;
  searchTerm: string;
  filterTerm: string;
}

const Page = ({
  match,
  collections,
  isSearchEnabled,
  searchTerm,
  filterTerm,
}: ConnectedPageProps) => {
  const { id } = match.params;
  const Content = useMemo(() => {
    const page = getAdditionalLink(id);
    if (!page) {
      return '';
    }

    return page.data;
  }, []);

  const pageContent = useMemo(() => {
    if (!Content) {
      return <StyledPageContent>Page not found</StyledPageContent>;
    }

    return (
      <StyledPageContent>
        <Content />
      </StyledPageContent>
    );
  }, [Content]);

  return (
    <StylePage>
      <Sidebar
        collections={collections}
        collection={false}
        isSearchEnabled={isSearchEnabled}
        searchTerm={searchTerm}
        filterTerm={filterTerm}
      />
      {pageContent}
    </StylePage>
  );
};

function mapStateToProps(state: State, ownProps: PageProps) {
  const { collections } = state;
  const isSearchEnabled = state.config && state.config.search != false;
  const { match } = ownProps;
  const { searchTerm = '', filterTerm = '' } = match.params;

  return {
    collections,
    isSearchEnabled,
    searchTerm,
    filterTerm,
  };
}

const mapDispatchToProps = {};

function mergeProps(
  stateProps: ReturnType<typeof mapStateToProps>,
  dispatchProps: typeof mapDispatchToProps,
  ownProps: PageProps,
) {
  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
  };
}

const ConnectedPage = connect(mapStateToProps, mapDispatchToProps, mergeProps)(Page);

export default translate()(ConnectedPage);

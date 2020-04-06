import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import styled from '@emotion/styled';
import moment from 'moment';
import { translate } from 'react-polyglot';
import { colors, components, buttons, IconButton } from 'netlify-cms-ui-default';
import { loadHistory, loadHistoryItem, removeHistoryItem } from '../../actions/history';
import { selectEntryHistory } from '../../reducers/history';
import { createDraftFromEntry } from '../../actions/entries';
import { selectEntry } from '../../reducers/entries';
import { selectUnpublishedEntry } from '../../reducers/editorialWorkflow';

const HistoryItemCard = styled.li`
  ${components.card};
  overflow: hidden;
  display: flex;
  margin-bottom: 4px;
  align-items: center;
`;

const StyledIconButton = styled(IconButton)`
  &:focus,
  &:hover {
    background-color: ${colors.activeBackground};
  }
  position: relative;
  right: 25px;
`;

const ButtonContainer = styled.div`
  width: 0;
`;

const HistoryItemCardButton = styled.button`
  ${buttons.button};
  font-size: 14px;
  font-weight: 500;
  width: 100%;
  padding: 8px;
  &:focus,
  &:hover {
    background-color: ${colors.activeBackground};
  }
  text-align: left;
`;

const HistoryList = styled.ul`
  display: flex;
  flex-direction: column;
  list-style-type: none;
`;

const Heading = styled.h3`
  ${components.cardTopHeading};
  padding: 8px;
  width: 100%;
`;

const HeadingContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export class EditorHistory extends React.Component {
  static propTypes = {
    collection: ImmutablePropTypes.map.isRequired,
    draft: ImmutablePropTypes.map.isRequired,
    entry: ImmutablePropTypes.map,
    t: PropTypes.func.isRequired,
  };

  interval;
  state = { refreshIndex: 0 };

  componentDidMount() {
    const { collection, draft, loadHistory } = this.props;
    loadHistory(collection, draft);
    this.interval = setInterval(() => {
      this.setState({ refreshIndex: this.state.refreshIndex + 1 });
    }, 10 * 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  loadHistoryItem(item) {
    const { collection, entry } = this.props;
    this.props.loadHistoryItem(collection, entry, item);
  }

  restoreEntry() {
    const { entry } = this.props;
    this.props.createDraftFromEntry(entry);
  }

  removeHistoryItem(item) {
    const { collection, draft } = this.props;
    this.props.removeHistoryItem(collection, draft, item);
  }

  render() {
    const { entryHistory, t, entry } = this.props;

    return (
      <HistoryList>
        <HeadingContainer>
          <Heading>{t('editor.editorHistory.heading')}</Heading>
          {entry && (
            <ButtonContainer>
              <StyledIconButton
                onClick={() => this.restoreEntry()}
                size="tiny"
                type="refresh"
                title={t('editor.editorHistory.reloadEntryButtonTitle')}
              />
            </ButtonContainer>
          )}
        </HeadingContainer>
        {entryHistory.items.map(item => {
          return (
            <HistoryItemCard key={item.id}>
              <HistoryItemCardButton onClick={() => this.loadHistoryItem(item)}>
                {moment(item.timestamp).fromNow()}
              </HistoryItemCardButton>
              <ButtonContainer>
                <StyledIconButton
                  onClick={() => this.removeHistoryItem(item)}
                  size="tiny"
                  type="close"
                  title={t('editor.editorHistory.deleteItemButtonTitle')}
                />
              </ButtonContainer>
            </HistoryItemCard>
          );
        })}
      </HistoryList>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, draft } = ownProps;
  const { history, entries, editorialWorkflow } = state;
  const entry = selectEntry(entries, collection.get('name'), draft.get('slug'));
  const unpublishedEntry = selectUnpublishedEntry(
    editorialWorkflow,
    collection.get('name'),
    draft.get('slug'),
  );
  const entryHistory = selectEntryHistory(history, collection.get('name'), draft.get('slug'));

  return { entryHistory, entry: unpublishedEntry || entry };
};

const mapDispatchToProps = {
  createDraftFromEntry,
  loadHistory,
  loadHistoryItem,
  removeHistoryItem,
};

export default connect(mapStateToProps, mapDispatchToProps)(translate()(EditorHistory));

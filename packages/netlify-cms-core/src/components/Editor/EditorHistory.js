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

const HistoryItemCard = styled.li`
  ${components.card};
  overflow: hidden;
  display: flex;
  margin-bottom: 4px;
`;

const HistoryItemCardButton = styled.button`
  ${buttons.button};
  display: flex;
  font-size: 14px;
  font-weight: 500;
  align-items: center;
  width: 100%;
  padding: 8px;
  &:focus,
  &:hover {
    color: ${colors.active};
    background-color: ${colors.activeBackground};
  }
`;

const HistoryList = styled.ul`
  display: flex;
  flex-direction: column;
  list-style-type: none;
  align-items: 'center';
`;

const Heading = styled.h3`
  ${components.cardTopHeading};
  padding: 8px;
`;

export class EditorHistory extends React.Component {
  static propTypes = {
    collection: ImmutablePropTypes.map.isRequired,
    entry: ImmutablePropTypes.map.isRequired,
    t: PropTypes.func.isRequired,
  };

  componentDidMount() {
    const { collection, entry, loadHistory } = this.props;
    loadHistory(collection, entry);
  }

  loadHistoryItem(item) {
    const { collection, entry } = this.props;
    this.props.loadHistoryItem(collection, entry, item);
  }

  removeHistoryItem(item) {
    const { collection, entry } = this.props;
    this.props.removeHistoryItem(collection, entry, item);
  }

  render() {
    const { entryHistory } = this.props;

    return (
      <HistoryList>
        <Heading>History</Heading>
        {entryHistory.items.map((item, index) => {
          return (
            <HistoryItemCard key={item.id}>
              <HistoryItemCardButton onMouseEnter={() => this.loadHistoryItem(item)}>
                {moment(item.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                {'   '}
                {item.origin}
                {index === 0 ? ' Current' : ''}
              </HistoryItemCardButton>
              <IconButton
                onClick={() => this.removeHistoryItem(item)}
                size="small"
                type="close"
                title="Delete Item"
              />
            </HistoryItemCard>
          );
        })}
      </HistoryList>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, entry } = ownProps;
  const { history } = state;
  const entryHistory = selectEntryHistory(history, collection.get('name'), entry.get('slug'));

  return { entryHistory };
};

const mapDispatchToProps = { loadHistory, loadHistoryItem, removeHistoryItem };

export default connect(mapStateToProps, mapDispatchToProps)(translate()(EditorHistory));

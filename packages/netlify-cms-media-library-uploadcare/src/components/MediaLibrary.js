import React, { Component } from 'react';
import styled from 'react-emotion';
import { orderBy, map } from 'lodash';
import fuzzy from 'fuzzy';
import MediaLibrarySearch from './MediaLibrarySearch';
import MediaLibraryCardGrid from './MediaLibraryCardGrid';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const COLUMNS = 4;

const Wrapper = styled.div`
  width: 100%;
  padding: 0 5px;
`;

const Header = styled.div`
  display: flex;
`;

const ActionsPanel = styled.div``;

const ActionButton = styled.button``;

class MediaLibrary extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      files: [],
      selectedUuids: [],
      selectionMode: false,
      query: null,
    };
  }

  static getDerivedStateFromProps(props) {
    return {
      files: props.files.toArray(),
    };
  }

  componentDidMount() {
    if (!this.state.files.length > 0) {
      this.props.actions.loadFiles();
    }
  }

  onAssetClick = uuid => {
    if (this.state.selectionMode) {
      this.setState({
        selectedUuids: this.state.selectedUuids.includes(uuid)
          ? this.state.selectedUuids.filter(selectedUuid => selectedUuid !== uuid)
          : this.state.selectedUuids.concat(uuid),
      });
    } else {
      this.props.dialogApi.addFiles([
        window.uploadcare.fileFrom('uploaded', uuid, this.props.settings),
      ]);
    }
  };

  onSelectClick = () => {
    this.setState({
      selectionMode: !this.state.selectionMode,
      selectedUuids: [],
    });
  };

  onRemoveClick = () => {
    this.props.actions.removeFiles(this.state.selectedUuids);
  };

  /**
   * Updates query state as the user types in the search field.
   */
  handleSearchChange = event => {
    this.setState({ query: event.target.value });
  };

  /**
   * Filters files that do not match the query. Not used for dynamic search.
   */
  handleQuery = (query, files) => {
    /**
     * Because file names don't have spaces, typing a space eliminates all
     * potential matches, so we strip them all out internally before running the
     * query.
     */
    const strippedQuery = query.replace(/ /g, '');
    const matches = fuzzy.filter(strippedQuery, files, { extract: file => file.name });
    const matchFiles = matches.map((match, queryIndex) => {
      const file = files[match.index];
      return { ...file, queryIndex };
    });
    return matchFiles;
  };

  /**
   * Transform file data for table display.
   */
  toTableData = files => {
    const tableData =
      files &&
      files.map(({ uuid, name, size, cdnUrl }) => {
        return {
          uuid,
          name,
          cdnUrl,
          size,
        };
      });

    /**
     * Get the sort order for use with `lodash.orderBy`, and always add the
     * `queryOrder` sort as the lowest priority sort order.
     */
    const { sortFields } = this.state;
    const fieldNames = map(sortFields, 'fieldName').concat('queryOrder');
    const directions = map(sortFields, 'direction').concat('asc');
    const ordered = orderBy(tableData, fieldNames, directions);
    const rows = ordered.reduce((acc, cell, idx) => {
      const row = Math.floor(idx / COLUMNS);
      acc[row] = acc[row] ? [...acc[row], cell] : [cell]; // eslint-disable-line no-param-reassign
      return acc;
    }, []);

    return rows;
  };

  getCell = (rowIndex, columnIndex) => {
    const { files, query } = this.state;
    const queriedFiles = this.state.query ? this.handleQuery(query, files) : files;
    const tableData = this.toTableData(queriedFiles);

    if (tableData && tableData.length > 0) {
      if (tableData[rowIndex] && tableData[rowIndex].length > 0) {
        if (tableData[rowIndex][columnIndex]) {
          return tableData[rowIndex][columnIndex];
        }
      }
    }

    return null;
  };

  render() {
    const { files, query } = this.state;
    const queriedFiles = this.state.query ? this.handleQuery(query, files) : files;
    const tableData = this.toTableData(queriedFiles);
    const hasFiles = files && !!files.length;
    const anySelected = this.state.selectionMode && this.state.selectedUuids.length > 0;
    const actionInProgress = this.props.isDeleting || this.props.isLoading || this.props.isFetching;

    return (
      <Wrapper>
        <Header>
          <MediaLibrarySearch
            value={this.state.query}
            onChange={this.handleSearchChange}
            placeholder="Search..."
            disabled={false}
          />
          <ActionsPanel>
            <ActionButton onClick={this.onSelectClick} disabled={actionInProgress}>
              Select
            </ActionButton>
            {anySelected && (
              <ActionButton onClick={this.onRemoveClick} disabled={actionInProgress}>
                Remove
              </ActionButton>
            )}
          </ActionsPanel>
        </Header>
        {this.props.isLoading ? (
          <em>Loading...</em>
        ) : (
          <MediaLibraryCardGrid
            selectedUuids={this.state.selectedUuids}
            onAssetRemove={this.onAssetRemove}
            onAssetClick={this.onAssetClick}
            getCell={this.getCell}
            columnCount={COLUMNS}
            rowCount={hasFiles ? tableData.length : 0}
          />
        )}
      </Wrapper>
    );
  }
}

function mapStateToProps(state) {
  const files = state.uploadcare.get('files');
  const isLoading = state.mediaLibrary.get('isLoading');
  const isDeleting = state.mediaLibrary.get('isDeleting');
  const isFetching = state.globalUI.get('isFetching');

  return { files, isLoading, isDeleting, isFetching };
}

MediaLibrary.propTypes = {
  store: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  dialogApi: PropTypes.object.isRequired,
  settings: PropTypes.object.isRequired,
  isLoading: PropTypes.func.isRequired,
  isDeleting: PropTypes.func.isRequired,
  isFetching: PropTypes.func.isRequired,
};

export default connect(mapStateToProps)(MediaLibrary);

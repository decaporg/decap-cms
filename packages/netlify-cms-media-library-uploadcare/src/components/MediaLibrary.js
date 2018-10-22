import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import { orderBy, map } from 'lodash';
import fuzzy from 'fuzzy';
import axios from 'axios';
import MediaLibrarySearch from './MediaLibrarySearch';
import MediaLibraryCardGrid from './MediaLibraryCardGrid';
import { connect } from 'react-redux';
import { loadFiles, removeFile } from '../actions';

const COLUMNS = 4;

const Wrapper = styled.div`
  width: 100%;
  padding: 0 5px;
`;

class MediaLibrary extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      files: [],
      query: null,
    };
  }

  static getDerivedStateFromProps(props, state) {
    return {
      files: props.files.toArray(),
    };
  }

  componentDidMount() {
    if (!this.state.files.length > 0) {
      this.props.loadFiles();
    }
  }

  onAssetClick = uuid =>
    this.props.dialogApi.addFiles([
      window.uploadcare.fileFrom('uploaded', uuid, this.props.settings),
    ]);

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

    return (
      <Wrapper>
        <MediaLibrarySearch
          value={this.state.query}
          onChange={this.handleSearchChange}
          placeholder="Search..."
          disabled={false}
        />
        {this.props.isLoading ? (
          <em>Loading...</em>
        ) : (
          <MediaLibraryCardGrid
            removeFile={this.props.removeFile}
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

function mapStateToProps(state, ownProps) {
  const files = state.uploadcare.get('files');
  const isLoading = state.mediaLibrary.get('isLoading');

  return { files, isLoading };
}

const mapDispatchToProps = {
  loadFiles,
  removeFile,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MediaLibrary);

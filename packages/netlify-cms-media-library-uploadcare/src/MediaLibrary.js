import React, { Component } from 'react'
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import { orderBy, map } from 'lodash';
import fuzzy from 'fuzzy';
import axios from 'axios'
import { colors } from 'netlify-cms-ui-default';
import MediaLibrarySearch from './MediaLibrarySearch';
import MediaLibraryCardGrid from './MediaLibraryCardGrid';


const url = 'https://api.uploadcare.com/files/?stored=true&limit=5&ordering=-datetime_uploaded';
const public_key = `7ad920aaf5c04d95c32a`
const private_key = `a9fcc9086bbbfa4d9afc`

export default class MediaLibrary extends Component {

  constructor(...args) {
    super(...args)
    this.state = {
      files: [],
      query: null
    }
  }


  async getDataPage(url) {

    // GET request for remote images
    const res = await axios({
        method: 'get',
        url: url,
        headers: {
          'Authorization': 'Uploadcare.Simple ' + public_key + ':' + private_key
        }
      })

    return {
      results: res.data.results.map(file => ({
        uuid: file.uuid,
        size: file.size,
        url: `${this.props.settings.cdnBase}/${file.uuid}/-/stretch/off/-/scale_crop/280x280/center/`,
        name: file.original_filename
      })),
      next: res.data.next
    }

  }

  async getData(url) {
    const page = await this.getDataPage(url)
    if (page.next) {
      return page.results.concat(await this.getData(page.next))
    } else {
      return page.results
    }
  }

  componentDidMount() {
    if (!this.state.files.length > 0) {
      this.getData(url).then(files => {
        console.log('files: ', files)
        this.setState({files})
      }).catch(err => { /*...handle the error...*/});
    }
  }

  onAssetClick = (uuid) => this.props.dialogApi.addFiles([window.uploadcare.fileFrom('uploaded', uuid, this.props.settings)])

  /**
   * Updates query state as the user types in the search field.
   */
  handleSearchChange = event => {
    this.setState({ query: event.target.value });
  }

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
  }

  /**
   * Transform file data for table display.
   */
  toTableData = files => {
    const tableData =
      files &&
      files.map(({ uuid, name, size, queryOrder, url }) => {
        return {
          uuid,
          name,
          url,
          size,
          queryOrder
        };
      });

    /**
     * Get the sort order for use with `lodash.orderBy`, and always add the
     * `queryOrder` sort as the lowest priority sort order.
     */
    const { sortFields } = this.state;
    const fieldNames = map(sortFields, 'fieldName').concat('queryOrder');
    const directions = map(sortFields, 'direction').concat('asc');
    return orderBy(tableData, fieldNames, directions);
  };

  render() {

    const { files, query } = this.state

    const queriedFiles = this.state.query ? this.handleQuery(query, files) : files;
    const tableData = this.toTableData(queriedFiles);
    const hasFiles = files && !!files.length;

    return (
      <div>
      <MediaLibrarySearch
        value={this.state.query}
        onChange={this.handleSearchChange}
        placeholder="Search..."
        disabled={false}
      />
      {
        !hasFiles ? <em>Loading...</em> :
        <MediaLibraryCardGrid
          mediaItems={tableData}
          onAssetClick={this.onAssetClick}
        />
      }
    </div>

    )
  }
}


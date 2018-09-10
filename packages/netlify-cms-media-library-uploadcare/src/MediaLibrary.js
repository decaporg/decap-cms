import React, { Component } from 'react'
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import MediaLibrarySearch from './MediaLibrarySearch';
import MediaLibraryCardGrid from './MediaLibraryCardGrid';
import { colors } from 'netlify-cms-ui-default';


import axios from 'axios'

const url = 'https://api.uploadcare.com/files/?stored=true&limit=5&ordering=-datetime_uploaded';
const public_key = `7ad920aaf5c04d95c32a`
const private_key = `a9fcc9086bbbfa4d9afc`

export default class MediaLibrary extends Component {

  constructor(...args) {
    super(...args)
    this.state = {files: []}
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

  render() {
    return (!this.state.files.length > 0 ? <em>Loading...</em> :
    <MediaLibraryCardGrid
      mediaItems={this.state.files}
      onAssetClick={this.onAssetClick}
    />)
  }
}


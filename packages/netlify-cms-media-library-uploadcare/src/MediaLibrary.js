import React, { Component } from 'react'
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import MediaLibrarySearch from './MediaLibrarySearch';
import MediaLibraryCardGrid from './MediaLibraryCardGrid';
import { colors } from 'netlify-cms-ui-default';


import axios from 'axios'

const url = 'https://api.uploadcare.com/files/?stored=true&limit=10&ordering=-datetime_uploaded';
const public_key = `7ad920aaf5c04d95c32a`
const private_key = `a9fcc9086bbbfa4d9afc`

export default class MediaLibrary extends Component {

  async getData(url) {

    // GET request for remote images
    const res = await axios({
        method: 'get',
        url: url,
        headers: {
          'Authorization': 'Uploadcare.Simple ' + public_key + ':' + private_key
        }
      })
    return await res.data
  }

  constructor(...args) {
    super(...args)
    this.state = {files: []}
  }

  componentDidMount() {
    const files = []
    if (!this.state.files.length > 0) {
      this.getData(url).then(data => {

        console.log('data: ', data)

        if (data.next) {
          this.getData(data.next).then(data => {
            console.log(files.concat(
              data.results.map(file => ({
                uuid: file.uuid,
                size: file.size,
                url: `${this.props.settings.cdnBase}/${file.uuid}/-/stretch/off/-/scale_crop/280x280/center/`,
                name: file.original_filename
              }))
            ))
          })
        }

        this.setState({
          files: data.results.map(file => ({
              uuid: file.uuid,
              size: file.size,
              url: `${this.props.settings.cdnBase}/${file.uuid}/-/stretch/off/-/scale_crop/280x280/center/`,
              name: file.original_filename
            })
          )
        })
      })
        .catch(err => { /*...handle the error...*/});
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


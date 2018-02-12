import PropTypes from 'prop-types';
import React, { Component } from 'react';

// https://github.com/nodeca/pica
// const picaJs = require('pica')();
import picaImport from 'pica/dist/pica'
const pica = picaImport()

// https://stackoverflow.com/a/7557690

export class ImageCanvas extends Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.prepareCanvas(this.props.src)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.src !== this.props.src) {
      this.prepareCanvas(nextProps.src)
    }
  }

  prepareCanvas = (src) => {
    const self = this
    const canvas = this.canvas
    const ctx = canvas.getContext('2d')
    const image = new Image()
    image.src = src
    image.onload = function(event){

      const aspectRatio = image.width / image.height
      canvas.width = aspectRatio * 210
      canvas.height = 210

      pica.resize(image, canvas, {
        unsharpAmount: 80,
        unsharpRadius: 0.6,
        unsharpThreshold: 2
      })
      .then(result => console.log('resize done!', result));

      //console.log('aspectRatio, width: ', aspectRatio, ctx.width, ctx.height)
      //ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }

  }

  render() {
    return (
      <canvas
        ref={ (ref) => this.canvas = ref }
        style={{
          ...this.props.style
        }}
        className={ this.props.className }
      />
    )
  }
}

const GalleryPreview = ({ value, getAsset }) => {
  //console.log('GalleryPreview: field: ', field, field.get('fields'))
  //console.log('GalleryPreview: entry.getIn: ', entry, entry.getIn(['data', 'images']))

  const images = []
  value.forEach(function(val, index) {
    const src = val.getIn(['image'])
    // console.log('valueMap: ', val);
    // console.log('imageMap src: ', src)
    const asset = getAsset(src)
    if (asset) {
      // console.log('getAsset: ', asset, asset && asset.path)
      images.push(asset.path)
    }
  })

  // console.log('images: ', images)

  return (
    <div
      style={{
        textAlign: 'center'
      }}
    >
      {
        images.length > 0 && images.map(image =>
        <ImageCanvas
          key={ image }
          src={ image }
          style={{
            display: 'inline-block',
            margin: '15px',
            cursor: 'pointer'
          }}
        />
      )
    }
    </div>
  )
  // getIn data, images returns the List
  // return ( <div className="nc-widgetPreview">{(field && field.get('fields')) || null}</div>
}


/*const GalleryPreview = ({ value, getAsset }) => {
  //console.log('GalleryPreview: field: ', field, field.get('fields'))
  //console.log('GalleryPreview: entry.getIn: ', entry, entry.getIn(['data', 'images']))

  const images = []
  value.forEach(function(val, index) {
    const src = val.getIn(['image'])
    // console.log('valueMap: ', val);
    // console.log('imageMap src: ', src)
    const asset = getAsset(src)
    if (asset) {
      console.log('getAsset: ', asset, asset && asset.path)
      images.push(asset.path)
    }
  })

  console.log('images: ', images)

  return (
    <div
      style={{
        textAlign: 'center'
      }}
    >
      {
        images.length > 0 && images.map(image =>
        <img
          src={image}
          style={{
            display: 'inline-block',
            margin: '15px',
            cursor: 'pointer',
            width: 'auto',
            height: '210px'
          }}
        />
      )
    }
    </div>
  )
  // getIn data, images returns the List
  // return ( <div className="nc-widgetPreview">{(field && field.get('fields')) || null}</div>
}*/

GalleryPreview.propTypes = {
  value: PropTypes.node,
};
export default GalleryPreview;


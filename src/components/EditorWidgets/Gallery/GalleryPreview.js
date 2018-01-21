import PropTypes from 'prop-types';
import React, { Component } from 'react';

/*
import Gallery from 'react-photo-gallery'
export default class GalleryPreview extends Component {

  static propTypes = {
    value: PropTypes.node,
  }

  constructor(props) {
    super(props);

    this.state = {
      images: [],
      loaded: []
    }
  }

  componentDidMount() {
    this.loadImages()
  }

  componentDidUpdate() {
    this.loadImages()
  }

  loadImages = () => {
    const { value, getAsset } = this.props
    const self = this
    value.forEach(function(val, index) {
      const src = val.getIn(['image'])
      // console.log('valueMap: ', val);
      // console.log('imageMap src: ', src)
      const asset = getAsset(src)
      // console.log('getAsset: ', asset, asset && asset.path)

      if (asset) {

        var found = self.state.loaded.findIndex(element => {
          return element === asset.path
        });

        // console.log('found? ', found)

        if (found !== -1) {
          // https://stackoverflow.com/questions/6011378/how-to-add-image-to-canvas

          self.setState(prevState => ({
            loaded: [
              ...prevState.loaded,
              asset.path
            ]
          }));

          var image = new Image();
          image.src = asset.path;
          image.onload = function(event) {
            const img = event.currentTarget

            // https://stackoverflow.com/questions/586182/how-to-insert-an-item-into-an-array-at-a-specific-index
            // arr.splice(index, 0, item);

            // https://stackoverflow.com/questions/26253351/correct-modification-of-state-arrays-in-reactjs

            self.setState(prevState => ({
              images: [
                ...prevState.images,
                {
                  src: img.src,
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                  order: index
                }
              ]
            }))


          }
        } else {
          // it is found.
          // is it's order correct?
          console.log('found index: ', found)

        }
      }
    })
  }

  get photos() {
    if (this.state.loaded.length > 0) {
      const ordered = this.state.images.concat().sort(function(a, b){
        return a.order > b.order;
      });
      return ordered
    } else {
      return []
    }
  }

  render() {
    console.log('this.photos: ', this.photos)
    return <Gallery photos={this.photos} />
  }
}*/


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
      console.log('aspectRatio, width: ', aspectRatio, ctx.width, ctx.height)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
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


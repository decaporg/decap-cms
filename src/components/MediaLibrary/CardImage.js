import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Observer from 'react-intersection-observer'

// https://github.com/nodeca/pica
// const picaJs = require('pica')();
import picaImport from 'pica/dist/pica'
const pica = picaImport()

// https://stackoverflow.com/a/7557690

class CardImage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      inView: false
    }
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
    image.setAttribute('crossOrigin', '')
    image.onload = function(event){

      const aspectRatio = image.width / image.height
      canvas.width = aspectRatio * 210
      canvas.height = 210

      pica.resize(image, canvas, {
        unsharpAmount: 80,
        unsharpRadius: 0.6,
        unsharpThreshold: 2
      }).then(result => pica.toBlob(result, 'image/jpeg', 0.90))
      .then(blob => console.log('resized to canvas & created blob!', blob));
      //.then(result => console.log('resize done!', result));

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


export default CardImage;


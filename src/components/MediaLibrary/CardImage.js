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
      //this.prepareCanvas(nextProps.src)
    }

    if(
      nextProps.visible !== this.props.visible &&
      !this.state.resized
    ) {
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


      let aspectRatio = image.width / image.height
      if (image.width > image.height) {
        //canvas.width = 552
        //canvas.height = aspectRatio * 552
      } else {
        //aspectRatio = image.height / image.width
      }
      canvas.width = aspectRatio * 320
      canvas.height = 320
      // 276 * 2 = 552
      // 160 * 2 = 320


      pica.resize(image, canvas, {
        //unsharpAmount: 80,
        //unsharpRadius: 0.5,
        //unsharpThreshold: 0,
        //quality: 5,
      }).then(result => pica.toBlob(result, 'image/jpeg', 1))
      .then(blob => {
        console.log('resized to canvas & created blob!', blob)
        self.setState({resized: true})
      });

/*
options - quality (number) or object:
quality - 0..3. Default = 3 (lanczos, win=3).
alpha - use alpha channel. Default = false.
unsharpAmount - >=0, in percents. Default = 0 (off). Usually between 50 to 100 is good.
unsharpRadius - 0.5..2.0. By default it's not set. Radius of Gaussian blur. If it is less than 0.5, Unsharp Mask is off. Big values are clamped to 2.0.
unsharpThreshold - 0..255. Default = 0. Threshold for applying unsharp mask.
cancelToken - Promise instance. If defined, current operation will be terminated on rejection.
*/

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


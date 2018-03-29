import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Observer from 'react-intersection-observer'

// https://github.com/nodeca/pica
// const picaJs = require('pica')();
import picaImport from 'pica/dist/pica'
const pica = picaImport()

// https://stackoverflow.com/a/7557690


function blobToImg(img, blob, handler) {

  if (img && blob) {
    const imageUrl = URL.createObjectURL(blob)
    console.log('img: ', img, ' blob: ', blob, ' imageUrl: ', imageUrl)
    //img.addEventListener('load', () => {
    //  console.log('img load!', imageUrl)
    //  return URL.revokeObjectURL(imageUrl)
    //})

    img.addEventListener('load', handler = function () {
      console.log('img load!', imageUrl, handler)
      return URL.revokeObjectURL(imageUrl)
    }, false)

    img.src = imageUrl
  }

}

class CardImage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      inView: false
    }
  }

  componentDidMount() {
    this.prepareCanvas(this.props.src)

    this.handler = null
  }

  componentWillUnmount() {

    if (this.img) {
      console.log('unMount removeListener')
      this.img.removeEventListener('load',  this.handler, false)
    }

    if (this.imgMem) {
      this.imgMem.onload = function(){};
      console.log('unMount unset onload: ', this.imgMem)
      delete this.imgMem;
    }

  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.src !== this.props.src) {
      //this.prepareCanvas(nextProps.src)
    }

    //if(nextProps.blob !== props.blob) {}

    if(
      nextProps.visible !== this.props.visible &&
      !this.state.resized
    ) {
      this.prepareCanvas(nextProps.src)
    }
  }

  prepareCanvas = (src) => {

    if (this.props.blob) {
      blobToImg(this.img, this.props.blob, this.handler)
    } else {
      const self = this
      const canvas = this.canvas
      const ctx = canvas.getContext('2d')
      self.imgMem = new Image()
      self.imgMem.src = src
      self.imgMem.setAttribute('crossOrigin', '')
      self.imgMem.onload = function(event){
        console.log('imgMem onLoad', src)
        let aspectRatio = self.imgMem.width / self.imgMem.height
        canvas.width = aspectRatio * 320
        canvas.height = 320
        // 276 * 2 = 552
        // 160 * 2 = 320
        pica.resize(self.imgMem, canvas, {
          //unsharpAmount: 80,
          //unsharpRadius: 0.5,
          //unsharpThreshold: 0,
          //quality: 5,
        }).then(result => {
          return pica.toBlob(result, 'image/jpeg', 1)
        })
        .then(blob => {
          self.props.saveBlob(self.props.fileId, blob)
          //console.log('resized to canvas & created blob!', blob)
          blobToImg(self.img, blob, this.handler)
        });
    }


      // how to use
      // cancelToken - Promise instance. If defined, current operation will be terminated on rejection.


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
      <div>
        <canvas
          ref={ (ref) => this.canvas = ref }
          style={{
            ...this.props.style,
            display: `none`
          }}
          className={ this.props.className }
        />
        <img
          ref={ (ref) => this.img = ref }
          style={{
            ...this.props.style,
          }}
          className={ this.props.className }
        />
      </div>
    )
  }
}


export default CardImage;


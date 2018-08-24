import React from 'react';
import styled from 'react-emotion';

const CardImage = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 2px 2px 0 0;
`;

const CardImagePlaceholder = CardImage.withComponent(`div`);

export default class MediaLibraryCardImage extends React.Component {
  state = {
    imageURL: '',
    isFetching: false,
  };

  loadImage() {
    const { image, getCachedImageURLByID, cacheImageURLByID } = this.props;
    const { imageURL: existingImageURL, isFetching } = this.state;

    if (existingImageURL !== '' || isFetching) {
      return;
    }

    if (getCachedImageURLByID && image.key) {
      const imageURL = getCachedImageURLByID(image.key);
      if (imageURL) {
        this.setState({ imageURL });
        return;
      }
    }

    if (image.url) {
      this.setState({ imageURL: image.url });
      if (image.key && cacheImageURLByID) {
        cacheImageURLByID(image.key, image.url);
      }
      return;
    }

    if (image.getBlobPromise) {
      this.setState({ isFetching: true });
      image.getBlobPromise().then(blob => {
        const imageURL = window.URL.createObjectURL(blob);
        this.setState({ imageURL, isFetching: false });
        if (image.key && cacheImageURLByID) {
          cacheImageURLByID(image.key, imageURL);
        }
      });
    }
  }

  render() {
    const { imageURL, isFetching } = this.state;

    if (imageURL === '' && !isFetching) {
      this.loadImage();
    }

    return imageURL === '' ? <CardImagePlaceholder /> : <CardImage src={imageURL} />;
  }
}

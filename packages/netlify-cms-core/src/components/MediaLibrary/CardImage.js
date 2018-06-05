import React from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';

const StyledCardImage = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 2px 2px 0 0;
`;

const CardImagePlaceholder = CardImage.withComponent(`div`);

export default class CardImage extends React.Component {
  propTypes = {
    image: PropTypes.object.isRequired,
  };

  state = {
    blobURL: '',
  };

  componentDidMount() {
    const { image } = this.props;

    if (!image.url && image.blobPromise) {
      image.blobPromise.then(blob => {
        const blobURL = window.URL.createObjectURL(blob);
        this.setState({ blobURL });
      });
    }
  }

  componentWillUnmount() {
    const { blobURL } = this.state;
    blobURL && window.URL.revokeObjectURL(blobURL);
  }

  render() {
    return <StyledCardImage src={image.url ? this.props.image.url : this.state.blobURL} />;
  }
}

import React from 'react';
import { Map } from 'immutable';
import { render } from '@testing-library/react';

import MediaLibraryCard from '../MediaLibraryCard';

describe('MediaLibraryCard', () => {
  const props = {
    displayURL: Map({ url: 'url' }),
    text: 'image.png',
    onClick: jest.fn(),
    draftText: 'Draft',
    width: '100px',
    height: '240px',
    margin: '10px',
    isViewableImage: true,
    loadDisplayURL: jest.fn(),
  };

  it('should match snapshot for non draft image', () => {
    const { asFragment, queryByTestId } = render(<MediaLibraryCard {...props} />);

    expect(queryByTestId('draft-text')).toBeNull();
    expect(asFragment()).toMatchSnapshot();
  });

  it('should match snapshot for draft image', () => {
    const { asFragment, getByTestId } = render(<MediaLibraryCard {...props} isDraft={true} />);
    expect(getByTestId('draft-text')).toHaveTextContent('Draft');
    expect(asFragment()).toMatchSnapshot();
  });

  it('should match snapshot for non viewable image', () => {
    const { asFragment, getByTestId } = render(
      <MediaLibraryCard {...props} isViewableImage={false} type="Not Viewable" />,
    );
    expect(getByTestId('card-file-icon')).toHaveTextContent('Not Viewable');
    expect(asFragment()).toMatchSnapshot();
  });

  it('should call loadDisplayURL on mount when url is empty', () => {
    const loadDisplayURL = jest.fn();
    render(
      <MediaLibraryCard {...props} loadDisplayURL={loadDisplayURL} displayURL={Map({ url: '' })} />,
    );

    expect(loadDisplayURL).toHaveBeenCalledTimes(1);
  });
});

import React from 'react';
import { CopyToClipBoardButton } from '../MediaLibraryButtons';
import { render } from '@testing-library/react';

describe('CopyToClipBoardButton', () => {
  const props = {
    disabled: false,
    t: jest.fn(key => key),
  };

  it('should use copy text when no path is defined', () => {
    const { container } = render(<CopyToClipBoardButton {...props} />);

    expect(container).toHaveTextContent('mediaLibrary.mediaLibraryCard.copy');
  });

  it('should use copyUrl text when path is absolute and is draft', () => {
    const { container } = render(
      <CopyToClipBoardButton {...props} path="https://www.images.com/image.png" draft />,
    );

    expect(container).toHaveTextContent('mediaLibrary.mediaLibraryCard.copyUrl');
  });

  it('should use copyUrl text when path is absolute and is not draft', () => {
    const { container } = render(
      <CopyToClipBoardButton {...props} path="https://www.images.com/image.png" />,
    );

    expect(container).toHaveTextContent('mediaLibrary.mediaLibraryCard.copyUrl');
  });

  it('should use copyName when path is not absolute and is draft', () => {
    const { container } = render(<CopyToClipBoardButton {...props} path="image.png" draft />);

    expect(container).toHaveTextContent('mediaLibrary.mediaLibraryCard.copyName');
  });

  it('should use copyPath when path is not absolute and is not draft', () => {
    const { container } = render(<CopyToClipBoardButton {...props} path="image.png" />);

    expect(container).toHaveTextContent('mediaLibrary.mediaLibraryCard.copyPath');
  });
});

import React from 'react';
import { Button, BrowseButton } from 'react-toolbox/lib/button';
import Loader from '../UI/loader/Loader';

const MediaLibraryFooter = ({
  onDelete,
  onPersist,
  onClose,
  onInsert,
  hasSelection,
  forImage,
  canInsert,
  isPersisting,
  isDeleting,
}) => {
  const shouldShowLoader = isPersisting || isDeleting;
  const loaderText = isPersisting ? 'Uploading...' : 'Deleting...';
  const loader = (
    <div className="nc-mediaLibrary-footer-button-loader">
      <Loader className="nc-mediaLibrary-footer-button-loaderSpinner" active/>
      <strong className="nc-mediaLibrary-footer-button-loaderText">{loaderText}</strong>
    </div>
  );
  return (
    <div>
      <Button
        label="Delete"
        onClick={onDelete}
        className="nc-mediaLibrary-footer-buttonLeft"
        disabled={shouldShowLoader || !hasSelection}
        accent
        raised
      />
      <BrowseButton
        label="Upload"
        accept={forImage}
        onChange={onPersist}
        className="nc-mediaLibrary-footer-buttonLeft"
        disabled={shouldShowLoader}
        primary
        raised
      />
      { shouldShowLoader ? loader : null }
      <Button
        label="Close"
        onClick={onClose}
        className="nc-mediaLibrary-footer-buttonRight"
        raised
      />
      { !canInsert ? null :
        <Button
          label="Insert"
          onClick={onInsert}
          className="nc-mediaLibrary-footer-buttonRight"
          disabled={!hasSelection}
          primary
          raised
        />
      }
    </div>
  );
};

export default MediaLibraryFooter;

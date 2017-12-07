import React from 'react';
import { FileUploadButton, Loader } from 'UI';

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

  );
};

export default MediaLibraryFooter;

import React from 'react';
import FileUploadButton from '../UI/FileUploadButton/FileUploadButton';
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
    <div className="nc-mediaLibrary-footer">
      <div className="nc-mediaLibrary-footer-section">
        <button
          onClick={onDelete}
          disabled={shouldShowLoader || !hasSelection}
        >
          Delete
        </button>
        <FileUploadButton
          className={`nc-mediaLibrary-uploadButton ${shouldShowLoader ? 'nc-mediaLibrary-uploadButton-disabled' : ''}`}
          label="Upload"
          imagesOnly={forImage}
          onChange={onPersist}
          disabled={shouldShowLoader}
        />
        { shouldShowLoader ? loader : null }
      </div>
      <div className="nc-mediaLibrary-footer-section">
        <button
          onClick={onClose}
        >
          Close
        </button>
        { !canInsert ? null :
          <button
            onClick={onInsert}
            disabled={!hasSelection}
          >
            Insert
          </button>
        }
      </div>
    </div>
  );
};

export default MediaLibraryFooter;

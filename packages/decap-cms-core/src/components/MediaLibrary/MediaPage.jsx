import React from 'react';

import MediaLibrary from './MediaLibrary';

function MediaPage() {
  return <MediaLibrary />;
}

// function mapStateToProps(state) {
//   const { mediaLibrary } = state;
//   const field = mediaLibrary.get('field');
//   const mediaLibraryProps = {
//     isVisible: mediaLibrary.get('isVisible'),
//     canInsert: mediaLibrary.get('canInsert'),
//     files: selectMediaFiles(state, field),
//     displayURLs: mediaLibrary.get('displayURLs'),
//     dynamicSearch: mediaLibrary.get('dynamicSearch'),
//     dynamicSearchActive: mediaLibrary.get('dynamicSearchActive'),
//     dynamicSearchQuery: mediaLibrary.get('dynamicSearchQuery'),
//     forImage: mediaLibrary.get('forImage'),
//     isLoading: mediaLibrary.get('isLoading'),
//     isPersisting: mediaLibrary.get('isPersisting'),
//     isDeleting: mediaLibrary.get('isDeleting'),
//     privateUpload: mediaLibrary.get('privateUpload'),
//     config: mediaLibrary.get('config'),
//     page: mediaLibrary.get('page'),
//     hasNextPage: mediaLibrary.get('hasNextPage'),
//     isPaginating: mediaLibrary.get('isPaginating'),
//     field,
//   };
//   return { ...mediaLibraryProps };
// }

// const mapDispatchToProps = {
//   loadMedia: loadMediaAction,
//   persistMedia: persistMediaAction,
//   deleteMedia: deleteMediaAction,
//   insertMedia: insertMediaAction,
//   loadMediaDisplayURL: loadMediaDisplayURLAction,
//   closeMediaLibrary: closeMediaLibraryAction,
// };

// export default connect(mapStateToProps, mapDispatchToProps)(MediaPage);

export default MediaPage;

import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import { injectGlobal } from 'emotion';
import FileType from 'file-type/browser';

import { CMSUploader } from './cmsUploader';

async function init({ handlePersist, handleLoadMedia, handleGetMedia }) {
  injectGlobal(require('@uppy/core/dist/style.css'));
  injectGlobal(require('@uppy/dashboard/dist/style.css'));

  handleLoadMedia();
  const uppy = new Uppy().use(Dashboard).use(CMSUploader, { handlePersist });

  return {
    show: async () => {
      const files = handleGetMedia();
      uppy.reset();
      await Promise.all(
        files.map(async file => {
          const { mime: type } = await FileType.fromBlob(file.file);
          uppy.addFile({
            name: file.name,
            type,
            data: file.file,
            source: 'Local',
            isRemote: false,
            meta: {},
          });
        }),
      );
      uppy.getFiles().forEach(file => {
        uppy.setFileState(file.id, {
          progress: { uploadComplete: true, uploadStarted: true },
        });
      });
      return uppy.getPlugin('Dashboard').openModal();
    },
    enableStandalone: () => true,
  };
}

const uppyMediaLibrary = { name: 'uppy', init };

export const NetlifyCmsMediaLibraryUppy = uppyMediaLibrary;
export default uppyMediaLibrary;

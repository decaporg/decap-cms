import AuthenticationPage from './AuthenticationPage';

function getSlug(path) {
  const m = path.match(/([^\/]+?)(\.[^\/\.]+)?$/);
  return m && m[1];
}

function getFileData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = function() {
      reject('Unable to read file');
    };
    reader.readAsDataURL(file);
  });
}

// Only necessary in test-repo, where images won't actually be persisted on server
function changeFilePathstoBase64(content, mediaFiles, base64Files) {
  let _content = content;
  mediaFiles.forEach((media, index) => {
    const reg = new RegExp('\\b' + media.uri + '\\b', 'g');
    _content = _content.replace(reg, base64Files[index]);
  });

  return _content;
}

export default class TestRepo {
  constructor(config) {
    this.config = config;
    if (window.repoFiles == null) {
      throw 'The TestRepo backend needs a "window.repoFiles" object.';
    }
  }

  setUser() {}

  authComponent() {
    return AuthenticationPage;
  }

  authenticate(state) {
    return Promise.resolve({email: state.email});
  }

  entries(collection) {
    const entries = [];
    const folder = collection.get('folder');
    if (folder) {
      for (var path in window.repoFiles[folder]) {
        entries.push({
          path: folder + '/' + path,
          slug: getSlug(path),
          raw: window.repoFiles[folder][path].content
        });
      }
    }

    return Promise.resolve({
      pagination: {},
      entries
    });
  }

  entry(collection, slug) {
    return this.entries(collection).then((response) => (
      response.entries.filter((entry) => entry.slug === slug)[0]
    ));
  }

  persist(collection, entry, mediaFiles = []) {
    return new Promise((resolve, reject) => {
      Promise.all(mediaFiles.map((imageProxy) => getFileData(imageProxy.file))).then(
        (base64Files) => {
          const content = changeFilePathstoBase64(entry.raw, mediaFiles, base64Files);
          const folder = collection.get('folder');
          const fileName = entry.path.substring(entry.path.lastIndexOf('/') + 1);

          window.repoFiles[folder][fileName]['content'] = content;
          resolve({collection, entry});
        },
        (error) => reject({collection, entry, error})
      );
    });
  }
}

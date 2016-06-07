let config;
export const setConfig = (configObj) => {
  config = configObj;
};

export default function ImageProxy(name, size, objectURL, uploaded = false) {
  this.uploaded = uploaded;
  this.name = name;
  this.size = size || 0;
  this.uri = config.media_folder && !uploaded ? config.media_folder + '/' + name : name;
  this.toString = function() {
    return uploaded ? this.uri : objectURL;
  };
}

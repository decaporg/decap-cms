let config;
export const setConfig = (configObj) => {
  config = configObj;
};

export default function ImageProxy(value, objectURL, uploaded = false) {
  this.value = value;
  this.uploaded = uploaded;
  this.uri = config.media_folder && !uploaded ? config.media_folder + '/' + value : value;
  this.toString = function() {
    return uploaded ? this.uri : objectURL;
  };
}

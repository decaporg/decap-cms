let config;
export const setConfig = (configObj) => {
  config = configObj;
};

export default function MediaProxy(value, objectURL, uri, uploaded = false) {
  this.value = value;
  this.uploaded = uploaded;
  this.uri = uri || config.media_folder && config.media_folder + '/' + value;
  this.toString = function() {
    return uploaded ? this.uri : objectURL;
  };
}

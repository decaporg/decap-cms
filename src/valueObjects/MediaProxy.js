let config;
export const setConfig = (configObj) => {
  config = configObj;
};

export default function MediaProxy(value, file, uploaded = false) {
  this.value = value;
  this.file = file;
  this.uploaded = uploaded;
  this.uri = config.media_folder && !uploaded ? config.media_folder + '/' + value : value;
  this.toString = function() {
    return this.uploaded ? this.uri : window.URL.createObjectURL(this.file, {oneTimeOnly: true});
  };
}

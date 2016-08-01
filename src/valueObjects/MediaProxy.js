let config;
export const setConfig = (configObj) => {
  config = configObj;
};

export default function MediaProxy(value, file, uploaded = false) {
  this.value = value;
  this.file = file;
  this.uploaded = uploaded;
  this.sha = null;
  this.path = config.media_folder && !uploaded ? config.media_folder + '/' + value : value;
}

MediaProxy.prototype.toString = function() {
  return this.uploaded ? this.path : window.URL.createObjectURL(this.file, { oneTimeOnly: true });
};

MediaProxy.prototype.toBase64 = function() {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = (readerEvt) => {
      const binaryString = readerEvt.target.result;

      resolve(binaryString.split('base64,')[1]);
    };
    fr.readAsDataURL(this.file);
  });
};

import sha256 from 'js-sha256';

export default blob =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = ({ target: { result } }) => resolve(sha256(result));
    fr.onerror = err => {
      fr.abort();
      reject(err);
    };
    fr.readAsArrayBuffer(blob);
  });

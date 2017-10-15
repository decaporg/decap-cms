/* add polyfill scripts as required here */
const checkScripts = () => {
  let scripts = [];
  if (!window.Promise || !window.Symbol || !window.fetch) {
    scripts.push('polyfills.js')
  }
  // if (!window.Promise || !window.Symbol || !window.fetch) {
  //   scripts.push('https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.26.0/polyfill.min.js')
  // }
  console.log('scripts needed...', scripts);
  return scripts;
}

export const supportsAll = () => {
  return checkScripts().length === 0;
}

export const loadScript = (src, callback, reject) => {
  const js = document.createElement('script');
  js.src = src;
  js.onload = function() {
    console.log('loading...', src);
    callback();
  };
  js.onerror = function() {
    console.log('Error loading...', src);
    const rejectMessage = new Error('Failed to load script ' + src);
    if (reject) {
      reject(rejectMessage);
    } else {
      callback(rejectMessage);
    }
  };
  document.head.appendChild(js);
}

export const loadRequiredScripts = (callback) => {
  const requiredScripts = checkScripts();
  // If Promises are supported we are golden
  if (Promise) {
    let promises = [];
    for (let i = 0; i < requiredScripts.length; i++) {
      const promise = new Promise((resolve, reject) => {
        loadScript(requiredScripts[i], resolve);
      });
      promises.push(promise);
    }
    Promise.all(promises).then(callback);
  } else {
    // Otherwise we will load them synchronously
    const SyncLoader = (scriptName, loader, callback) => {
      function call() {
        loader(scriptName, callback);
      }
      return { call }
    };
    // first in last out
    let lastCall = new SyncLoader(requiredScripts[0], loadScript, callback);
    for (let i = 1; i < requiredScripts.length; i++) {
      lastCall = new SyncLoader(ourSyncLoader(requiredScripts[i], loadScript, lastCall.call));
    }
  }
}

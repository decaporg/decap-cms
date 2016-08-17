import { registerComponent } from '../actions/editor';

let storeRef;
const requiredEditorComponentProperties = ['label', 'fields', 'detect', 'fromBlock', 'toBlock'];

const checkConfigKeys = (config, requiredProps) => {
  for (var i = requiredProps.length; i--;) {
    if (!config.hasOwnProperty(requiredProps[i])) return false;
  }
  return true;
};

const wrap = (func) => function() {
  func.apply(null, arguments);
};

function CMS() {
  this.registerEditorComponent = (config) => {
    if (checkConfigKeys(config, requiredEditorComponentProperties)) {
      const configObj = {
        label: config.label || 'unnamed',
        icon: config.icon || 'exclamation-triangle',
        fields: config.fields,
        detect: wrap(config.detect),
        fromBlock: wrap(config.fromBlock),
        toBlock: wrap(config.toBlock),
        toPreview: config.toPreview ? wrap(config.toPreview) : wrap(config.toBlock)
      };
      storeRef.dispatch(registerComponent(configObj));
    } else {
      const label = config.label || 'unnamed';
      window.console && console.error(`The provided component configuration for ${label} is incorrect.`);
    }
  };
}

export const initPluginAPI = (store) => {
  storeRef = store;
  window.CMS = new CMS();
};

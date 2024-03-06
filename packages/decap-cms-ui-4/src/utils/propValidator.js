import { isValidElement } from 'react';

export function isValidDelay(val) {
  return typeof val === 'number' && !isNaN(val) && val > 0;
}

export function objectValues(obj) {
  return Object.keys(obj).map(key => obj[key]);
}

function withRequired(fn) {
  fn.isRequired = function(props, propName, componentName) {
    const prop = props[propName];

    if (typeof prop === 'undefined') {
      return new Error(`The prop ${propName} is marked as required in 
      ${componentName}, but its value is undefined.`);
    }

    fn(props, propName, componentName);
  };
  return fn;
}

export const falseOrDelay = withRequired((props, propName, componentName) => {
  const prop = props[propName];

  if (prop !== false && !isValidDelay(prop)) {
    return new Error(`${componentName} expect ${propName} 
      to be a valid Number > 0 or equal to false. ${prop} given.`);
  }

  return null;
});

export const falseOrElement = withRequired((props, propName, componentName) => {
  const prop = props[propName];

  if (prop !== false && !isValidElement(prop)) {
    return new Error(`${componentName} expect ${propName} 
      to be a valid react element or equal to false. ${prop} given.`);
  }

  return null;
});

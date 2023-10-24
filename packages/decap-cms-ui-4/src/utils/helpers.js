import React, { useState, useRef, useEffect } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import warning from 'warning';

export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => void (ref.current = value), [value]);
  return ref.current;
}

export function useMeasure() {
  const ref = useRef();
  const [bounds, set] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [ro] = useState(() => new ResizeObserver(([entry]) => set(entry.contentRect)));
  useEffect(() => {
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [{ ref }, bounds];
}

/**
 * Safe chained function
 *
 * Will only create a new function if needed,
 * otherwise will pass back existing functions or null.
 *
 * @param {function} functions to chain
 * @returns {function|null}
 */

export const camelToKebabCase = string =>
  string
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();

export const kebabToCamelCase = string => string.replace(/-([a-z])/g, g => g[1].toUpperCase());

export function createChainedFunction(...funcs) {
  return funcs.reduce(
    (acc, func) => {
      if (func == null) {
        return acc;
      }

      warning(
        typeof func === 'function',
        'Invalid Argument Type, must only provide functions, undefined, or null.',
      );

      return function chainedFunction(...args) {
        acc.apply(this, args);
        func.apply(this, args);
      };
    },
    () => {},
  );
}

export function setRef(ref, value) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

export function useForkRef(refA, refB) {
  /**
   * This will create a new function if the ref props change and are defined.
   * This means react will call the old forkRef with `null` and the new forkRef
   * with the ref. Cleanup naturally emerges from this behavior
   */
  return React.useMemo(() => {
    if (refA == null && refB == null) {
      return null;
    }
    return refValue => {
      setRef(refA, refValue);
      setRef(refB, refValue);
    };
  }, [refA, refB]);
}

export function queryStringToJSON(search) {
  const pairs = search.slice(1).split('&');
  const result = {};

  pairs.forEach(pair => {
    pair = pair.split('=');
    result[pair[0]] = decodeURIComponent(pair[1] || '');
  });

  return JSON.parse(JSON.stringify(result));
}

// A change of the browser zoom change the scrollbar size.
// Credit https://github.com/twbs/bootstrap/blob/3ffe3a5d82f6f561b82ff78d82b32a7d14aed558/js/src/modal.js#L512-L519
export function getScrollbarSize() {
  const scrollDiv = document.createElement('div');
  scrollDiv.style.width = '99px';
  scrollDiv.style.height = '99px';
  scrollDiv.style.position = 'absolute';
  scrollDiv.style.top = '-9999px';
  scrollDiv.style.overflow = 'scroll';

  document.body.appendChild(scrollDiv);
  const scrollbarSize = scrollDiv.offsetWidth - scrollDiv.clientWidth;
  document.body.removeChild(scrollDiv);

  return scrollbarSize;
}

export const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const titleCase = string => {
  var titleArr = string.toLowerCase().split(' ');

  for (var i = 0; i < titleArr.length; i++) {
    titleArr[i] = titleArr[i][0].toUpperCase() + titleArr[i].slice(1);
  }

  const title = titleArr.join(' ');

  return title;
};

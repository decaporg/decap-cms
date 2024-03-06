import eventManager from '../../utils/eventManager';
import { POSITION, TYPE, ACTION } from '../../utils/constants';

let container = null;
let queue = [];
const noop = () => false;

/**
 * Merge provided options with the defaults settings and generate the toastId
 */
function mergeOptions(options, type) {
  return { ...options, type, toastId: getToastId(options) };
}

/**
 * Generate a random toastId
 */
function generateToastId() {
  return (Math.random().toString(36) + Date.now().toString(36)).substr(2, 10);
}

/**
 * Generate the toastId either automatically or by provided toastId
 */
function getToastId(options) {
  if (
    options &&
    (typeof options.toastId === 'string' ||
      (typeof options.toastId === 'number' && !isNaN(options.toastId)))
  ) {
    return options.toastId;
  }

  return generateToastId();
}

/**
 * Dispatch toast. If the container is not mounted, the toast is enqueued
 */
function emitEvent(options) {
  if (container !== null) {
    eventManager.emit(ACTION.SHOW, options);
  } else {
    queue.push({ action: ACTION.SHOW, options });
  }

  return options.toastId;
}

const toast = Object.assign(
  options => emitEvent(mergeOptions(options, (options && options.type) || TYPE.DEFAULT)),
  {
    success: options => emitEvent(mergeOptions(options, TYPE.SUCCESS)),
    info: options => emitEvent(mergeOptions(options, TYPE.INFO)),
    warn: options => emitEvent(mergeOptions(options, TYPE.WARNING)),
    warning: options => emitEvent(mergeOptions(options, TYPE.WARNING)),
    error: options => emitEvent(mergeOptions(options, TYPE.ERROR)),
    dismiss: (id = null) => container && eventManager.emit(ACTION.CLEAR, id),
    isActive: noop,
    update(toastId, options) {
      setTimeout(() => {
        if (container && typeof container.collection[toastId] !== 'undefined') {
          const { options: oldOptions } = container.collection[toastId];

          const nextOptions = {
            ...oldOptions,
            ...options,
            toastId: options.toastId || toastId,
          };

          if (!options.toastId || options.toastId === toastId) {
            nextOptions.updateId = generateToastId();
          } else {
            nextOptions.staleToastId = toastId;
          }

          emitEvent(nextOptions);
        }
      }, 0);
    },
    done(id, progress = 1) {
      toast.update(id, {
        progress,
        isProgressDone: true,
      });
    },
    onChange(callback) {
      if (typeof callback === 'function') {
        eventManager.on(ACTION.ON_CHANGE, callback);
      }
    },
    POSITION,
    TYPE,
  },
);

/**
 * Wait until the ToastContainer is mounted to dispatch the toast
 * and attach isActive method
 */
eventManager
  .on(ACTION.DID_MOUNT, containerInstance => {
    container = containerInstance;
    toast.isActive = id => container.isToastActive(id);

    queue.forEach(item => {
      eventManager.emit(item.action, item.options);
    });

    queue = [];
  })
  .on(ACTION.WILL_UNMOUNT, () => {
    container = null;
    toast.isActive = noop;
  });

export default toast;

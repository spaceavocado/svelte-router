/**
 * Svelte Router history module.
 * @module svelte-router/history
 */

// Reference: https://www.npmjs.com/package/history
import {createBrowserHistory, createHashHistory} from 'history';

/**
 * History modes.
 */
enum HISTORY_MODE {
  /** History mode. */
  HISTORY = 'HISTORY',
  /** Hash mode. */
  HASH = 'HASH',
}

/**
 * History actions.
 */
enum HISTORY_ACTION {
  /** Push into location. */
  PUSH = 'PUSH',
  /** Replace in location. */
  REPLACE = 'REPLACE',
  /** Pop from the location. */
  POP = 'POP',
};

/**
 * History hash types
 */
enum HASH_TYPE {
  /** The default. */
  SLASH = 'SLASH',
  /** Omit the leading slash. */
  NOSLASH = 'NOSLASH',
  /** Google's legacy AJAX URL format. */
  HASHBANG = 'HASHBANG',
};

/**
 * Create a new history wrapper.
 * @param {HISTORY_MODE} mode history mode,
 * defaults to HISTORY_MODE.HISTORY.
 * @param {object} opts options of individual modes,
 * see https://github.com/ReactTraining/history.
 * @return {object}
 */
const history = (mode: HISTORY_MODE, opts: object): object => {
  opts = opts || {};
  switch (mode) {
    case HISTORY_MODE.HISTORY:
      return createBrowserHistory(opts);
    case HISTORY_MODE.HASH:
    default:
      return createHashHistory(opts);
  }
};

export {
  HISTORY_MODE,
  HISTORY_ACTION,
  HASH_TYPE,
};

export default history;

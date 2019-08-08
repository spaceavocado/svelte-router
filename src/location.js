/**
 * Svelte Router location module.
 * @module svelte-router/location
 */

import {HISTORY_ACTION} from './history';
import {hasPrefix, parseURL} from './utils';
import tc from '@spaceavocado/type-check';

/**
 * Location object.
 * Name property has higher priority that path property.
 * @typedef Location
 * @property {string} name name of the route.
 * @property {string} path route URL.
 * @property {string} hash name of the route.
 * @property {object} query query parameters.
 * @property {object} params route parameters.
 * @property {module:svelte-router/history~HISTORY_ACTION} action location
 * history action.
 */

/**
 * RawLocation object.
 * @typedef RawLocation
 * @property {string} name name of the route.
 * @property {string} path route URL.
 * @property {string} hash name of the route.
 * @property {object} query query parameters.
 * @property {object} params route parameters.
 * @property {boolean} replace replace in the history.
 */

/**
 * Create location object.
 * @param {module:svelte-router/location~RawLocation} rawLocation raw
 * location object.
 * @return {module:svelte-router/location~Location}
 */
export function createLocation(rawLocation) {
  const location = {
    name: null,
    path: '',
    hash: '',
    query: {},
    params: {},
    action: HISTORY_ACTION.PUSH,
  };

  location.path = rawLocation.path;
  if (hasPrefix(location.path, '/') == false) {
    location.path = '/' + location.path;
  }

  if (tc.not.isNullOrUndefined(rawLocation.replace)
  && rawLocation.replace === true) {
    location.action = HISTORY_ACTION.REPLACE;
  }
  if (tc.not.isNullOrUndefined(rawLocation.name)
  && tc.isString(rawLocation.name)) {
    location.name = rawLocation.name;
  }
  if (tc.not.isNullOrUndefined(rawLocation.hash)
  && tc.isString(rawLocation.hash)) {
    location.hash = rawLocation.hash.replace('#', '');
  }

  // Param object
  if (tc.not.isNullOrUndefined(rawLocation.params)
  && tc.isObject(rawLocation.params)) {
    for (const key in rawLocation.params) {
      if (rawLocation.params.hasOwnProperty(key)) {
        location.params[key] = rawLocation.params[key];
      }
    }
  }

  // Query object
  if (tc.not.isNullOrUndefined(rawLocation.query)
  && tc.isObject(rawLocation.query)) {
    for (const key in rawLocation.query) {
      if (rawLocation.query.hasOwnProperty(key)) {
        location.query[key] = rawLocation.query[key];
      }
    }
  }

  // Query in URL
  try {
    const parsedURL = parseURL(location.path);
    location.path = parsedURL.base;
    location.query = {...location.query, ...parsedURL.query};
    if (parsedURL.hash.length > 0) {
      location.hash = parsedURL.hash;
    }
  } catch (e) {
    throw new Error(`invalid URL, ${e.message}`);
  }

  return location;
};

/**
 * Svelte Router location module.
 * @module svelte-router/location
 */

import tc from '@spaceavocado/type-check';
import {HISTORY_ACTION} from './history';
import {hasPrefix, parseURL} from './utils';

/**
 * Name property has higher priority that path property.
 */
interface LocationBase {
  /** Name name of the route. */
  name?: string;
  /** Path route URL. */
  path: string;
  /** Hash name of the route. */
  hash: string;
}

export interface RawLocation extends LocationBase {
  /** Query parameters. */
  query?: {[k: string]: string} | null;
  /** Route parameters */
  params?: {[k: string]: string} | null;
  /** Replace in the history. */
  replace: boolean;
}

export interface Location extends LocationBase {
  /** Query parameters. */
  query: {[k: string]: string};
  /** Route parameters. */
  params: {[k: string]: string};
  /** Location history action. */
  action: HISTORY_ACTION;
}

/**
 * Create location object.
 * @param {RawLocation} rawLocation raw location object.
 * @return {Location}
 */
export function createLocation(rawLocation: RawLocation): Location {
  const location: Location = {
    path: '',
    hash: '',
    query: {},
    params: {},
    action: HISTORY_ACTION.PUSH,
  };

  location.path = rawLocation.path || '';
  if (location.path.length > 0
    && hasPrefix(location.path, '/') == false) {
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

  if (location.path.length == 0) {
    return location;
  }

  // Query in URL
  try {
    const parsedURL = parseURL(location.path);
    location.path = parsedURL.base;
    location.query = {...location.query, ...parsedURL.query};
    if (parsedURL.hash.length > 0) {
      location.hash = parsedURL.hash;
    }
  } catch (e: any) {
    throw new Error(`invalid URL, ${e.toString()}`);
  }

  return location;
};

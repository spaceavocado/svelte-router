/**
 * Svelte Router utilities module.
 * @module svelte-router/utils
 */
/**
 * String has prefix predicate.
 * @param {string} s tested string.
 * @param {string} prefix needle.
 * @return {boolean}
 */
export declare function hasPrefix(s: string, prefix: string): boolean;
/**
 * String has suffix predicate.
 * @param {string} s tested string.
 * @param {string} suffix needle.
 * @return {boolean}
 */
export declare function hasSuffix(s: string, suffix: string): boolean;
/**
 * Trim prefix
 * @param {string} s tested string.
 * @param {string} prefix needle.
 * @return {string}
 */
export declare function trimPrefix(s: string, prefix: string): string;
/**
 * Join URL paths.
 * @param {string} a URL path A.
 * @param {string} b URL path B.
 * @return {string}
 */
export declare function joinPath(a: string, b: string): string;
/**
 * URL match predicate
 * @param {string} a URL a.
 * @param {string} b URL b.
 * @throws an error if the URL is not valid.
 * @return {boolean}
 */
export declare function urlMatch(a: string, b: string): boolean;
/**
 * URL prefix predicate
 * @param {string} haystack URL haystack.
 * @param {string} prefix URL prefix.
 * @throws an error if the URL is not valid.
 * @return {boolean}
 */
export declare function urlPrefix(haystack: string, prefix: string): boolean;
/**
 * Parsed URL object.
 */
interface ParsedURL {
    /** URL base path without query or hash */
    base: string;
    /** Query params */
    query: {
        [k: string]: string;
    };
    /** Hash string */
    hash: string;
}
/**
 * Extract query param and hash from URL and return
 * the base URL, dictionary of query params, and the hash.
 * @param {string} path full URL.
 * @throws an error if the URL is not valid.
 * @return {ParsedURL}
 */
export declare function parseURL(path: string): ParsedURL;
/**
 * Get full URL from the base URL, query object, and hash.
 * @param {string} path URL base path without query or hash.
 * @param {object?} query query param dictionary.
 * @param {string} hash hash param.
 * @return {string}
 */
export declare function fullURL(path: string, query: {
    [k: string]: string;
} | null | undefined, hash: string): string;
/**
 * History location object
 */
export interface HistoryLocation {
    /** A unique string representing this location. */
    key: string;
    /** The path of the URL. */
    pathname: string;
    /** The URL query string. */
    search: string;
    /** The URL hash fragment. */
    hash: string;
    /** Extra state for this location. */
    state: string;
}
/**
 * Get full URL from the history location object.
 * @param {HistoryLocation} location history location objec.
 * @return {string}
 */
export declare function historyFullURL(location: HistoryLocation): string;
/**
 * Simple object deep clone.
 * @param {object} o source object.
 * @return {object}
 */
export declare function deepClone(o: object): object;
export {};

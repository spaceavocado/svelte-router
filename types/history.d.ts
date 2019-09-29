/**
 * Svelte Router history module.
 * @module svelte-router/history
 */
/**
 * History modes.
 */
declare enum HISTORY_MODE {
    /** History mode. */
    HISTORY = "HISTORY",
    /** Hash mode. */
    HASH = "HASH"
}
/**
 * History actions.
 */
declare enum HISTORY_ACTION {
    /** Push into location. */
    PUSH = "PUSH",
    /** Replace in location. */
    REPLACE = "REPLACE",
    /** Pop from the location. */
    POP = "POP"
}
/**
 * History hash types
 */
declare enum HASH_TYPE {
    /** The default. */
    SLASH = "SLASH",
    /** Omit the leading slash. */
    NOSLASH = "NOSLASH",
    /** Google's legacy AJAX URL format. */
    HASHBANG = "HASHBANG"
}
/**
 * Create a new history wrapper.
 * @param {HISTORY_MODE} mode history mode,
 * defaults to HISTORY_MODE.HISTORY.
 * @param {object} opts options of individual modes,
 * see https://github.com/ReactTraining/history.
 * @return {object}
 */
declare const history: (mode: HISTORY_MODE, opts: object) => object;
export { HISTORY_MODE, HISTORY_ACTION, HASH_TYPE, };
export default history;

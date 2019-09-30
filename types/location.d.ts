/**
 * Svelte Router location module.
 * @module svelte-router/location
 */
import { HISTORY_ACTION } from './history';
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
    query?: {
        [k: string]: string;
    } | null;
    /** Route parameters */
    params?: {
        [k: string]: string;
    } | null;
    /** Replace in the history. */
    replace: boolean;
}
export interface Location extends LocationBase {
    /** Query parameters. */
    query: {
        [k: string]: string;
    };
    /** Route parameters. */
    params: {
        [k: string]: string;
    };
    /** Location history action. */
    action: HISTORY_ACTION;
}
/**
 * Create location object.
 * @param {RawLocation} rawLocation raw location object.
 * @return {Location}
 */
export declare function createLocation(rawLocation: RawLocation): Location;
export {};

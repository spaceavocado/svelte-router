import {SvelteComponent} from 'svelte';
import {RawLocation} from '../types/location';

export type Events = {
  completed: CustomEvent<void>;
  aborted: CustomEvent<void>;
}

export type Props = {
  to: string | RawLocation;
  replace?: boolean;
  exact?: boolean;
  cls?: string;
  activeClass?: string;
  disabled?: boolean;
};

/**
 *
 */
export default class RouterLink extends SvelteComponent<Props, Events, {}> {
}
export {};

<script>
  /**
   * Router link component module
   * @module svelte-router/component/link
   */

  import tc from '@spaceavocado/type-check';
  import {router} from '../router.js';
  import {onMount, onDestroy, createEventDispatcher} from 'svelte';
  import {urlMatch} from '../utils';

  // Props
  export let to;
  export let replace = false;
  export let activeClass = null;

  // Resolve route object to URL
  if (tc.isObject(to)) {
    try {
      to = $router.routeURL(to);
    } catch (e) {
      console.error(`svelte-router/link, ${e.message}`);
      to = '';
    }
  }

  // Internals
  const dispatch = createEventDispatcher();
  let cssClass = '';
  let navigationChangedListener = null;

  onMount(() => {
    navigationChangedListener = $router.onNavigationChanged((fromRoute, toRoute) => {
      cssClass = urlMatch(toRoute.fullPath, to)
        ? activeClass || $router.activeClass
        : '';
    });
  });
  onDestroy(() => {
		if (navigationChangedListener != null) {
      navigationChangedListener();
      navigationChangedListener = null;
    }
	});

  // Toggle the collapsed state
  function navigate(to) {
    if (replace === true) {
      $router.replace(to,
        () => dispatch('onCompleted'),
        () => dispatch('onAborted'));
    } else {
      $router.push(to,
        () => dispatch('onCompleted'),
        () => dispatch('onAborted'));
    }
  }
</script>

<a
  href="{to}"
  class="{cssClass}"
  on:click|preventDefault="{(e) => navigate(to)}"
>
  <slot></slot>
</a>
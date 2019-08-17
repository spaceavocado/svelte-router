<script>
  /**
   * Router link component module
   * @module svelte-router/component/link
   */

  import tc from '@spaceavocado/type-check';
  import {router, urlMatch, urlPrefix, trimPrefix} from '@spaceavocado/svelte-router';
  import {onMount, onDestroy, createEventDispatcher} from 'svelte';

  // Props
  export let to;
  export let replace = false;
  export let exact = false;
  export let cls = '';
  export let activeClass = null;

  // Internals
  const dispatch = createEventDispatcher();
  let cssClass = '';
  let matchUrl;
  let navigationChangedListener = null;
  const setCssClass = (active) => {
    cssClass = cls;
    cssClass += active
      ? ` ${activeClass || $router.activeClass}`
      : '';
  };

  // Resolve route object to URL
  $: {
    if (tc.isObject(to)) {
      try {
        to = $router.routeURL(to);
      } catch (e) {
        console.error(`svelte-router/link, ${e.message}`);
        to = '';
      }
    }
    matchUrl = trimPrefix(to, $router.basename);
  }

  onMount(() => {
    setCssClass(false);
    navigationChangedListener = $router.onNavigationChanged((fromRoute, toRoute) => {
      setCssClass(exact
        ? urlMatch(toRoute.fullPath, matchUrl)
        : urlPrefix(toRoute.fullPath, matchUrl)
      );
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
        () => dispatch('completed'),
        () => dispatch('aborted'));
    } else {
      $router.push(to,
        () => dispatch('completed'),
        () => dispatch('aborted'));
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
<script>
  /**
   * Router link component module
   * @module svelte-router/component/link
   */

  import tc from '@spaceavocado/type-check';
  import {router, urlMatch} from '@spaceavocado/svelte-router';
  import {onMount, onDestroy, createEventDispatcher} from 'svelte';

  // Props
  export let to;
  export let replace = false;
  export let cls = '';
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
  const setCssClass = (active) => {
    cssClass = cls;
    cssClass += active
      ? ` ${activeClass || $router.activeClass}`
      : '';
  };

  onMount(() => {
    setCssClass(false);
    navigationChangedListener = $router.onNavigationChanged((fromRoute, toRoute) => {
      setCssClass(urlMatch(toRoute.fullPath, to));
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
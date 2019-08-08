<script>
  /**
   * Router view component module
   * @module svelte-router/component/view
   */
  import tc from '@spaceavocado/type-check';
  import {onMount, onDestroy, setContext, getContext} from 'svelte';
  import {router} from '../router.js';

  // View depth context key
  const CONTEXT_KEY = 'VIEW_DEPTH';

  // Internals
  let view = null;
  let viewDepth = 0;
  let viewPropsMethod = null;
  let navigationChangedListener = null;

  // Get closest parent view depth
  let parentViewDepth = getContext(CONTEXT_KEY);
  viewDepth = parentViewDepth || 0;
  setContext(CONTEXT_KEY, viewDepth + 1);

  onMount(() => {
    // Start the route on the root level
    if (viewDepth == 0) {
      $router.start();
    }

    // Navigation update event
    navigationChangedListener = $router.onNavigationChanged((from, to) => {
      if (viewDepth < to.matched.length) {
        viewPropsMethod = to.matched[viewDepth].props;
        view = to.matched[viewDepth].component;
      }
    });

    // Resolve the on component load view
    if (tc.not.isNullOrUndefined($router.currentRoute)
    && viewDepth < $router.currentRoute.matched.length) {
      console.log('on laod view');
      viewPropsMethod = $router.currentRoute.matched[viewDepth].props;
      view = $router.currentRoute.matched[viewDepth].component;
    }
  });

  // Cleanup the navigation listener
  onDestroy(() => {
    if (navigationChangedListener != null) {
      navigationChangedListener();
      navigationChangedListener = null;
    }
  });

  /**
   * Generate view props based on the route props definition
   */ 
  function viewProps() {
    // No props
    if (viewPropsMethod === false) {
      return {};
    // Auto generated props from params
    } else if (viewPropsMethod === true) {
      return $router.currentRoute.params;
    // Function
    } else if (tc.isFunction(viewPropsMethod)) {
      return viewPropsMethod($router.currentRoute);
    // Direct props
    } else if (tc.isObject(viewPropsMethod)) {
      return viewPropsMethod;
    // Unexpected props method
    } else {
      console.error(`svelte-router/view, unexpected route props type.`);
      return {};
    }
  }
</script>

{#if view}
  <svelte:component this={view} route={$router.currentRoute} {...viewProps()} />
{/if}

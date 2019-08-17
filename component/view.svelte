<script>
  /**
   * Router view component module
   * @module svelte-router/component/view
   */
  import tc from '@spaceavocado/type-check';
  import {router} from '@spaceavocado/svelte-router';
  import {onMount, onDestroy, setContext, getContext}
    from 'svelte';

  // View depth context key
  const CONTEXT_KEY = 'VIEW_DEPTH';

  // Internals
  let self = false;
  let view = null;
  let viewPropsMethod = null;
  let viewProps = {};
  let viewDepth = 0;
  let navigationChangedListener = null;

  // Get closest parent view depth
  let parentViewDepth = getContext(CONTEXT_KEY);
  viewDepth = parentViewDepth || 0;
  setContext(CONTEXT_KEY, viewDepth + 1);

  /**
   * Get view props based on the route props definition
   */ 
  function setViewProps(currentRoute) {
    // No props
    if (viewPropsMethod === false) {
      viewProps = {};
    // Auto generated props from params
    } else if (viewPropsMethod === true) {
      viewProps = currentRoute.params;
    // Function
    } else if (tc.isFunction(viewPropsMethod)) {
      viewProps = viewPropsMethod(currentRoute);
    // Direct props
    } else if (tc.isObject(viewPropsMethod)) {
      viewProps = viewPropsMethod;
    // Unexpected props method
    } else {
      console.error(`svelte-router/view, unexpected route props type.`);
      return {};
    }
  }

  onMount(() => {
    // Start the route on the root level
    if (viewDepth == 0) {
      $router.start();
    }

    // Navigation update event
    navigationChangedListener = $router.onNavigationChanged((from, to) => {
      if (viewDepth < to.matched.length) {
        viewPropsMethod = to.matched[viewDepth].props;
        setViewProps(to);
        self = to.matched[viewDepth].component === false;
        view = to.matched[viewDepth].component;
      }
    });

    // Resolve the on component load view
    if (tc.not.isNullOrUndefined($router.currentRoute)
    && viewDepth < $router.currentRoute.matched.length) {
      viewPropsMethod = $router.currentRoute.matched[viewDepth].props;
      setViewProps($router.currentRoute);
      self = $router.currentRoute.matched[viewDepth].component === false;
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
</script>

{#if self}
  <svelte:self />
{:else if view}
  <svelte:component this={view} route={$router.currentRoute} {...viewProps} />
{/if}
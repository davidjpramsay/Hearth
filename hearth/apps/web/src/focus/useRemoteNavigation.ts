import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';

import {
  FocusMemory,
  focusById,
  focusIsWithin,
  nextSpatialTarget,
  focusControl,
  modalTabTarget,
  type FocusDirection,
} from './focusGraph';
import { COMPANION_MAX_WIDTH } from '../layout/viewportQueries';
import { isNativeBackMessage, requestNativeExit } from '../native/nativeBridge';

const arrowDirection: Partial<Record<string, FocusDirection>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export function useRemoteNavigation(defaultFocusId: string): void {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const focusMemory = useRef(new FocusMemory());
  const previousPath = useRef(location.pathname);
  const activePath = useRef(location.pathname);
  const remoteMoved = useRef(false);
  const pendingDirections = useRef<FocusDirection[]>([]);
  const activatedMenuLink = useRef<HTMLAnchorElement | null>(null);
  const pendingMenuEntry = useRef<{ control: HTMLElement; path: string } | null>(null);

  useLayoutEffect(() => {
    activePath.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    const rememberFocusedControl = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && event.target.dataset.focusId !== undefined) {
        focusMemory.current.remember(activePath.current, event.target.dataset.focusId);
      }
    };
    const menuActivated = (event: MouseEvent) => {
      activatedMenuLink.current = null;
      pendingMenuEntry.current = null;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (
        !(link instanceof HTMLAnchorElement) ||
        link.closest('[data-focus-navigation]') === null ||
        link.closest('[aria-modal="true"], dialog[open]') !== null ||
        event.button !== 0 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        (link.target !== '' && link.target !== '_self') ||
        new URL(link.href).origin !== window.location.origin
      )
        return;
      activatedMenuLink.current = link;
      // Safari does not focus tapped links. This is the user's chosen menu
      // control, so keep focus here rather than selecting a page action for them.
      focusControl(link, { scroll: false });
    };
    document.addEventListener('focusin', rememberFocusedControl);
    document.addEventListener('click', menuActivated, true);
    return () => {
      document.removeEventListener('focusin', rememberFocusedControl);
      document.removeEventListener('click', menuActivated, true);
    };
  }, []);

  useLayoutEffect(() => {
    const priorPath = previousPath.current;
    const routeChanged = priorPath !== location.pathname;
    if (routeChanged) {
      remoteMoved.current = false;
      pendingDirections.current = [];
      if (pendingMenuEntry.current?.path !== location.pathname) pendingMenuEntry.current = null;
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.dataset.focusId !== undefined) {
        focusMemory.current.remember(priorPath, active.dataset.focusId);
      }
      const previousControl = focusMemory.current.recall(priorPath, '');
      if (
        navigationType === 'PUSH' &&
        /^\/calendar\/(week|month|agenda)$/.test(priorPath) &&
        /^\/calendar\/(week|month|agenda)$/.test(location.pathname) &&
        previousControl.startsWith('calendar-view-')
      ) {
        // React may keep the old view visible while a new lazy view loads. A
        // further tab direction is still explicit input, not new-route autofocus.
        focusMemory.current.remember(location.pathname, previousControl);
      }
      previousPath.current = location.pathname;
    }
    const fallbackId = `nav-${location.pathname.slice(1) || 'today'}`;
    const target = focusMemory.current.recall(location.pathname, defaultFocusId);
    const scrollOnEntry = routeChanged || window.innerWidth > COMPANION_MAX_WIDTH;
    const menuLink = activatedMenuLink.current;
    const focusedMenu = document.activeElement?.closest('[data-focus-navigation]') ?? null;
    const menuEntry =
      routeChanged &&
      navigationType !== 'POP' &&
      ((menuLink !== null && new URL(menuLink.href).pathname === location.pathname) ||
        focusIsWithin(focusedMenu));
    if (menuEntry) {
      const retained = menuLink?.isConnected && focusControl(menuLink, { scroll: false });
      if (!retained && !focusIsWithin(focusedMenu)) {
        // A shell change can replace the navigation DOM. Focus its current
        // destination instead of falling through to a control inside the page.
        for (const link of document.querySelectorAll<HTMLElement>(
          '[data-focus-navigation] a[aria-current="page"], [data-focus-navigation] .phone-tab--active, [data-focus-navigation] .rail-item--active',
        )) {
          if (focusControl(link, { scroll: false })) break;
        }
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      const main = document.querySelector('#main-content');
      if (main !== null) main.scrollTop = 0;
    }
    let entered = menuEntry;
    const enterPendingMenu = () => {
      const waiting = pendingMenuEntry.current;
      if (waiting === null) return false;
      if (document.activeElement !== waiting.control || !waiting.control.isConnected) {
        pendingMenuEntry.current = null;
        return false;
      }
      // React can keep the outgoing page while the selected lazy route loads.
      // Wait for that route, rather than focusing the outgoing screen's entry.
      if (waiting.path !== location.pathname) return true;
      if (focusById(defaultFocusId) || focusById('screen-entry')) {
        pendingMenuEntry.current = null;
        remoteMoved.current = true;
        entered = true;
      }
      return true;
    };
    const applyPendingDirections = () => {
      const directions = pendingDirections.current;
      pendingDirections.current = [];
      for (const direction of directions) {
        const active = document.activeElement;
        if (!(active instanceof HTMLElement)) break;
        const next = nextSpatialTarget(active, direction);
        if (next !== null && focusControl(next)) remoteMoved.current = true;
      }
    };
    const enter = () => {
      const remembered = focusMemory.current.recall(location.pathname, target);
      const focused =
        focusById(remembered, { scroll: scrollOnEntry && !entered }) ||
        (remembered !== defaultFocusId &&
          focusById(defaultFocusId, { scroll: scrollOnEntry && !entered })) ||
        (defaultFocusId !== 'screen-entry' &&
          focusById('screen-entry', { scroll: scrollOnEntry && !entered }));
      if (focused) {
        entered = true;
        applyPendingDirections();
      }
      return focused;
    };
    // Move before paint when the committed route is ready; otherwise the observer
    // waits for its lazy content and restores any queued directional input.
    if (routeChanged && !menuEntry) enter();
    const animationFrame = requestAnimationFrame(() => {
      if (enterPendingMenu()) return;
      const content = document.querySelector('#main-content');
      const activeFocusId =
        document.activeElement instanceof HTMLElement
          ? document.activeElement.dataset.focusId
          : undefined;
      // A remote key, tap or form-field focus can arrive before this first frame.
      // Never steal that explicit interaction during initial screen entry.
      if (
        menuEntry ||
        remoteMoved.current ||
        focusIsWithin(content) ||
        (!routeChanged && activeFocusId !== undefined)
      ) {
        entered = true;
        return;
      }
      if (!enter() && target !== defaultFocusId) {
        focusById(fallbackId, { scroll: scrollOnEntry });
      }
    });
    const observer = new MutationObserver(() => {
      if (enterPendingMenu()) return;
      if (focusIsWithin(content)) {
        entered = true;
        const active = document.activeElement;
        if (
          active instanceof HTMLElement &&
          (active.matches('input, textarea, select') || active.isContentEditable)
        )
          pendingDirections.current = [];
        else applyPendingDirections();
        return;
      }
      const active = document.activeElement;
      // Do not take focus back from navigation/browser chrome. But if an error,
      // loading screen or removed row lost its focused node, restore the last
      // meaningful control (or the loaded screen entry) for the next remote key.
      if (
        entered &&
        active instanceof HTMLElement &&
        active !== document.body &&
        active !== document.documentElement &&
        active.getClientRects().length > 0
      )
        return;
      enter();
    });
    const content = document.querySelector('#main-content');
    if (content !== null) observer.observe(content, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [defaultFocusId, location.pathname, navigationType]);

  useLayoutEffect(() => {
    // Also clear same-page/query-only activations, without re-entering their content.
    activatedMenuLink.current = null;
  }, [location.key]);

  // Install the current route's keys in the same commit as its focus state.
  // A passive effect can leave the outgoing handler active for a quick next key.
  useLayoutEffect(() => {
    const handleBack = (fromNativeShell: boolean) => {
      pendingDirections.current = [];
      pendingMenuEntry.current = null;
      const dismiss = document.querySelector<HTMLElement>('[data-back-dismiss="true"]');
      if (dismiss !== null && dismiss.offsetParent !== null) {
        dismiss.click();
        return;
      }
      const pageBack = document.querySelector<HTMLAnchorElement>('a[data-page-back="true"]');
      if (pageBack !== null && pageBack.offsetParent !== null) {
        pageBack.click();
        return;
      }
      if (location.pathname === '/today') {
        if (fromNativeShell && requestNativeExit()) return;
        focusById(defaultFocusId);
      } else {
        navigate(-1);
      }
    };
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const active = document.activeElement;
      if (event.key === 'Tab' && active instanceof HTMLElement) {
        pendingDirections.current = [];
        pendingMenuEntry.current = null;
        const target = modalTabTarget(active, event.shiftKey);
        if (target !== null && focusControl(target)) event.preventDefault();
        return;
      }
      const direction = arrowDirection[event.key];
      if (direction !== undefined) {
        if (!(active instanceof HTMLElement)) return;
        if (active.matches('input, textarea, select') || active.isContentEditable) return;
        pendingMenuEntry.current = null;
        if (
          direction === 'right' &&
          active.closest('[data-focus-navigation="rail"]') !== null &&
          active.closest('[aria-modal="true"], dialog[open]') === null
        ) {
          event.preventDefault();
          // Entering the page is now an explicit action. Start at its meaningful
          // entry (the current Calendar view, for example), then use spatial arrows.
          const path =
            active instanceof HTMLAnchorElement && activatedMenuLink.current === active
              ? new URL(active.href).pathname
              : location.pathname;
          if (
            path === location.pathname &&
            (focusById(defaultFocusId) || focusById('screen-entry'))
          )
            remoteMoved.current = true;
          else pendingMenuEntry.current = { control: active, path };
          return;
        }
        if (
          document.querySelector('#main-content [data-focus-loading="true"]') !== null &&
          (active === document.body || active.getClientRects().length === 0)
        ) {
          // Remember a short burst of movement through a lazy route transition;
          // never replay activation, which could open an event without confirmation.
          if (pendingDirections.current.length < 8) pendingDirections.current.push(direction);
          event.preventDefault();
          return;
        }
        // At a spatial edge, keep focus stable instead of scrolling the page
        // independently of the remote selection.
        if (active.matches('a[href], button, summary, [tabindex]')) event.preventDefault();
        const target = nextSpatialTarget(active, direction);
        if (target !== null && focusControl(target)) {
          remoteMoved.current = true;
          event.preventDefault();
        }
        return;
      }
      if (
        event.key === 'Enter' &&
        active instanceof HTMLElement &&
        (active === document.body || active.getClientRects().length === 0) &&
        document.querySelector('#main-content [data-focus-loading="true"]') !== null
      ) {
        event.preventDefault();
        return;
      }
      if (['Escape', 'BrowserBack', 'GoBack'].includes(event.key)) {
        event.preventDefault();
        handleBack(false);
      }
    };
    const nativeMessageHandler = (event: MessageEvent<unknown>) => {
      if (isNativeBackMessage(event.data)) handleBack(true);
    };
    const pointerInteraction = () => {
      pendingDirections.current = [];
      pendingMenuEntry.current = null;
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('message', nativeMessageHandler);
    window.addEventListener('pointerdown', pointerInteraction);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('message', nativeMessageHandler);
      window.removeEventListener('pointerdown', pointerInteraction);
    };
  }, [defaultFocusId, location.pathname, navigate]);
}

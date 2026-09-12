import { useCallback, useEffect, useState } from 'react';
import type { Section } from '../types';

// import.meta.env.BASE_URL mirrors vite.config.ts's `base` — '/' in dev, '/twitch-clip-viewer/' in
// production — so route paths stay correct under the GitHub Pages project-site prefix without
// duplicating it here.
const BASE = import.meta.env.BASE_URL;

interface Route {
  section: Section;
  toolId: string | null;
}

function parseRoute(pathname: string): Route {
  const relative = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname.replace(/^\//, '');
  const [first, second] = relative.split('/');
  if (first === 'tools') return { section: 'tools', toolId: second || null };
  return { section: 'clips', toolId: null };
}

function pathForRoute(section: Section, toolId: string | null): string {
  if (section !== 'tools') return BASE;
  return toolId ? `${BASE}tools/${toolId}` : `${BASE}tools`;
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(() => parseRoute(location.pathname));

  useEffect(() => {
    function onPopState() {
      setRoute(parseRoute(location.pathname));
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // toolId defaults to null so switching top-level sections (e.g. clicking the "Tools" tab)
  // always lands on the tool list rather than whatever specific tool was last open.
  const navigate = useCallback((section: Section, toolId: string | null = null) => {
    const path = pathForRoute(section, toolId);
    if (path !== location.pathname) {
      history.pushState(null, '', path);
    }
    setRoute({ section, toolId });
  }, []);

  return { section: route.section, toolId: route.toolId, navigate };
}

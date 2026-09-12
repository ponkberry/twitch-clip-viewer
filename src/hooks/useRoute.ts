import { useCallback, useEffect, useState } from 'react';
import type { Section } from '../types';

// import.meta.env.BASE_URL mirrors vite.config.ts's `base` — '/' in dev, '/twitch-clip-viewer/' in
// production — so route paths stay correct under the GitHub Pages project-site prefix without
// duplicating it here.
const BASE = import.meta.env.BASE_URL;

function sectionFromPath(pathname: string): Section {
  const relative = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname.replace(/^\//, '');
  return relative.split('/')[0] === 'tools' ? 'tools' : 'clips';
}

function pathForSection(section: Section): string {
  return section === 'tools' ? `${BASE}tools` : BASE;
}

export function useRoute() {
  const [section, setSection] = useState<Section>(() => sectionFromPath(location.pathname));

  useEffect(() => {
    function onPopState() {
      setSection(sectionFromPath(location.pathname));
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((next: Section) => {
    const path = pathForSection(next);
    if (path !== location.pathname) {
      history.pushState(null, '', path);
    }
    setSection(next);
  }, []);

  return { section, navigate };
}

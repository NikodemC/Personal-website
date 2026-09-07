import { useEffect, useState } from 'react';
import { scrollToSection } from '@/scroll/useSmoothScroll';

const LINKS = [
  { id: 'about', label: 'About' },
  { id: 'voyage', label: 'Voyage' },
  { id: 'sunbay', label: 'Sunbay' },
  { id: 'skills', label: 'Skills' },
  { id: 'logbook', label: 'Logbook' },
  { id: 'contact', label: 'Contact' },
];

export const Nav = () => {
  const [activeId, setActiveId] = useState('about');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sections = LINKS.map((link) => document.getElementById(link.id)).filter(
      (element): element is HTMLElement => element !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visibleEntry) setActiveId(visibleEntry.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    );
    sections.forEach((section) => observer.observe(section));

    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <nav className={`nav${visible ? ' is-visible' : ''}`} aria-label="Sections">
      <ul>
        {LINKS.map((link) => (
          <li key={link.id}>
            <a
              href={`#${link.id}`}
              className={activeId === link.id ? 'is-current' : undefined}
              aria-current={activeId === link.id ? 'true' : undefined}
              onClick={(event) => {
                event.preventDefault();
                scrollToSection(link.id);
              }}
            >
              <span className="nav__dot" aria-hidden="true" />
              <span className="nav__label">{link.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

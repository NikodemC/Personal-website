import { MusicCv } from '@/components/MusicCv';
import { Nav } from '@/components/Nav';
import { VoyageCanvas } from '@/scene/VoyageCanvas';
import { scrollToSection, useSmoothScroll } from '@/scroll/useSmoothScroll';
import { About } from '@/sections/About';
import { Compass } from '@/sections/Compass';
import { Contact } from '@/sections/Contact';
import { Crew } from '@/sections/Crew';
import { Destination } from '@/sections/Destination';
import { Hero } from '@/sections/Hero';
import { Logbook } from '@/sections/Logbook';
import { Voyage } from '@/sections/Voyage';

export const App = () => {
  useSmoothScroll();

  return (
    <>
      <a
        className="skip-link"
        href="#about"
        onClick={(event) => {
          event.preventDefault();
          scrollToSection('about');
        }}
      >
        Skip to content
      </a>
      <VoyageCanvas />
      <div className="veil" aria-hidden="true" />
      <Nav />
      <MusicCv />
      <main className="page">
        <Hero />
        <About />
        <Voyage />
        <Destination />
        <Compass />
        <Logbook />
        <Crew />
        <Contact />
      </main>
    </>
  );
};

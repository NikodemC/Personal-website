import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useScrollStore, type CameraPreset, type VoyageKeyframe } from './scrollStore';

gsap.registerPlugin(ScrollTrigger);

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const centerProgress = (element: HTMLElement, viewport: number, maxScroll: number) => {
  const center = element.offsetTop + element.offsetHeight / 2 - viewport / 2;
  return maxScroll > 0 ? clamp01(center / maxScroll) : 0;
};

const measureLayout = () => {
  const viewport = window.innerHeight;
  const maxScroll = document.documentElement.scrollHeight - viewport;

  const keyframes: VoyageKeyframe[] = [];
  document.querySelectorAll<HTMLElement>('[data-tod]').forEach((element) => {
    keyframes.push({
      progress: centerProgress(element, viewport, maxScroll),
      tod: Number(element.dataset.tod),
      cam: (element.dataset.cam as CameraPreset | undefined) ?? 'reading',
    });
  });
  keyframes.sort((a, b) => a.progress - b.progress);

  const ports = Array.from(document.querySelectorAll<HTMLElement>('[data-port]')).map((element) =>
    centerProgress(element, viewport, maxScroll),
  );

  const destinationElement = document.querySelector<HTMLElement>('[data-destination]');
  const destination = destinationElement
    ? centerProgress(destinationElement, viewport, maxScroll)
    : 1;

  useScrollStore.getState().setLayout(keyframes, ports, destination);
};

let instance: Lenis | null = null;

/**
 * Anchor clicks have to go through Lenis. A native jump leaves its internal
 * position stale, and it then animates the page back to where it thought it was.
 */
export const scrollToSection = (id: string) => {
  const target = document.getElementById(id);
  if (!target) return;
  if (instance) {
    instance.scrollTo(target, { duration: 1.15 });
  } else {
    target.scrollIntoView({ behavior: 'smooth' });
  }
};

export const useSmoothScroll = () => {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lenis = new Lenis({
      lerp: reduceMotion ? 1 : 0.08,
      smoothWheel: !reduceMotion,
      syncTouch: false,
    });

    instance = lenis;
    lenis.on('scroll', () => ScrollTrigger.update());

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    measureLayout();
    ScrollTrigger.addEventListener('refresh', measureLayout);
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize);
    const fontsReady = document.fonts?.ready;
    fontsReady?.then(() => ScrollTrigger.refresh());

    return () => {
      ScrollTrigger.removeEventListener('refresh', measureLayout);
      window.removeEventListener('resize', onResize);
      gsap.ticker.remove(tick);
      instance = null;
      lenis.destroy();
    };
  }, []);
};

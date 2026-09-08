import { profile } from '@/content/profile';

export const Crew = () => (
  <section className="section crew" id="crew" data-tod="0.9" data-cam="reading">
    <figure className="crew__motto readable">
      <blockquote>{profile.quote.text}</blockquote>
      <figcaption className="coords">{profile.quote.author}</figcaption>
    </figure>
  </section>
);

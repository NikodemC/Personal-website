import { profile } from '@/content/profile';

export const Hero = () => (
  <section className="section hero" id="home" data-tod="0" data-cam="hero">
    <div className="hero__inner readable">
      <p className="hero__coords coords">
        {profile.coordinates} <span className="hero__coords-sep">/</span> {profile.location}
      </p>
      <h1 className="hero__name">
        <span>{profile.firstName}</span>
        <span>{profile.lastName}</span>
      </h1>
      <p className="hero__tagline">{profile.tagline}</p>
      <p className="hero__scroll">Scroll on. The island is a day&rsquo;s sail from here.</p>
    </div>
  </section>
);

import { profile } from '@/content/profile';

export const About = () => (
  <section className="section about" id="about" data-tod="0.08" data-cam="reading">
    <div className="about__grid">
      <div className="about__text column readable">
        <h2 className="section__title">Two logs, one course</h2>
        {profile.about.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
        <dl className="about__facts">
          <div>
            <dt>Based in</dt>
            <dd>{profile.location}</dd>
          </div>
          <div>
            <dt>Write to me</dt>
            <dd>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </dd>
          </div>
        </dl>
      </div>
      <figure className="about__portrait">
        <img src={profile.portraitUrl} alt={`${profile.firstName} ${profile.lastName}`} />
      </figure>
    </div>
  </section>
);

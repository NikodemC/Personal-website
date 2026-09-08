import { profile } from '@/content/profile';

export const Contact = () => (
  <section className="section contact" id="contact" data-tod="1" data-cam="harbour">
    <div className="contact__inner readable">
      <h2 className="contact__headline">Drop the anchor</h2>
      <p className="section__lead">
        The passage ends here. If anything on this page is worth a conversation, or you just want to
        talk boats, my inbox is open.
      </p>
      <p className="contact__mail">
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
      </p>
      <ul className="contact__socials">
        {profile.socials.map((social) => (
          <li key={social.label}>
            <a href={social.url} target="_blank" rel="noreferrer">
              {social.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

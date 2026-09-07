import { sunbay } from '@/content/sunbay';

export const Destination = () => (
  <section
    className="section destination"
    id="sunbay"
    data-destination="true"
    data-tod={sunbay.tod}
    data-cam="destination"
  >
    <div className="destination__inner readable">
      <p className="coords">
        {sunbay.period}, {sunbay.place}
      </p>
      <h2 className="destination__headline">{sunbay.headline}</h2>
      <div className="destination__body column">
        <p className="destination__role">
          {sunbay.role} at{' '}
          <a href={sunbay.url} target="_blank" rel="noreferrer">
            {sunbay.name}
          </a>
        </p>
        {sunbay.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>
      <ul className="destination__stack">
        {sunbay.stack.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  </section>
);

import { logbook } from '@/content/logbook';

export const Logbook = () => (
  <section className="section logbook" id="logbook" data-tod="0.78" data-cam="wide">
    <div className="logbook__head column readable">
      <h2 className="section__title">Logbook</h2>
      <p className="section__lead">What happens between the crossings.</p>
    </div>
    <div className="logbook__entries">
      {logbook.map((entry) => (
        <article key={entry.id} className="log-entry">
          <div className="log-entry__photo">
            <img src={entry.photo} alt="" loading="lazy" />
          </div>
          <div className="log-entry__text">
            <h3>{entry.title}</h3>
            <p className="coords">{entry.meta}</p>
            <p>{entry.entry}</p>
            {entry.link && (
              <a className="log-entry__link" href={entry.link.url} target="_blank" rel="noreferrer">
                {entry.link.label}
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  </section>
);

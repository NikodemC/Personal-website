import { ports } from '@/content/career';

export const Voyage = () => (
  <section className="voyage" id="voyage">
    <div className="section voyage__intro" data-tod="0.14" data-cam="voyage">
      <div className="column readable">
        <h2 className="section__title">Ports of call</h2>
        <p className="section__lead">
          Four crossings before the one I am on now. Each taught a different part of the job.
        </p>
      </div>
    </div>
    <ol className="voyage__ports">
      {ports.map((port) => (
        <li
          key={port.id}
          className="section voyage__port"
          data-port={port.id}
          data-tod={port.tod}
          data-cam="voyage"
        >
          <article className="port glass">
            <header className="port__header">
              <h3 className="port__company">{port.company}</h3>
              <p className="port__role">{port.role}</p>
              <p className="port__meta coords">
                {port.period}, {port.place}
              </p>
            </header>
            <p className="port__summary">{port.summary}</p>
            <ul className="port__stack">
              {port.stack.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </li>
      ))}
    </ol>
  </section>
);

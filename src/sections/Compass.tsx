import { useState } from 'react';
import { languages, skillGroups } from '@/content/skills';

export const Compass = () => {
  const [activeId, setActiveId] = useState(skillGroups[0].id);
  const active = skillGroups.find((group) => group.id === activeId) ?? skillGroups[0];

  return (
    <section className="section compass" id="skills" data-tod="0.62" data-cam="reading">
      <div className="compass__head column readable">
        <h2 className="section__title">What I can steer</h2>
        <p className="section__lead">
          Pick a bearing to see what sits on it. Backend is where I am strongest and where most of
          the miles are.
        </p>
      </div>
      <div className="compass__body">
        <div className="compass__rose" role="tablist" aria-label="Skill areas">
          <div className="compass__ring" aria-hidden="true" />
          {skillGroups.map((group, index) => {
            const angle = (index / skillGroups.length) * Math.PI * 2 - Math.PI / 2;
            const style = {
              '--x': `${Math.cos(angle) * 42}%`,
              '--y': `${Math.sin(angle) * 42}%`,
            } as React.CSSProperties;
            return (
              <button
                key={group.id}
                type="button"
                role="tab"
                aria-selected={group.id === active.id}
                aria-controls={`compass-panel-${group.id}`}
                id={`compass-tab-${group.id}`}
                className={`compass__point${group.id === active.id ? ' is-active' : ''}`}
                style={style}
                onClick={() => setActiveId(group.id)}
                onMouseEnter={() => setActiveId(group.id)}
              >
                <span className="compass__bearing">{group.bearing}</span>
                <span className="compass__label">{group.label}</span>
              </button>
            );
          })}
          <span
            className="compass__needle"
            style={
              {
                '--needle': `${skillGroups.findIndex((g) => g.id === active.id) * (360 / skillGroups.length)}deg`,
              } as React.CSSProperties
            }
            aria-hidden="true"
          />
        </div>
        <div
          className="compass__panel"
          role="tabpanel"
          id={`compass-panel-${active.id}`}
          aria-labelledby={`compass-tab-${active.id}`}
        >
          <h3>{active.label}</h3>
          <ul className="compass__items">
            {active.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <ul className="compass__languages">
        {languages.map((language) => (
          <li key={language.label}>
            <span className="compass__language-name">{language.label}</span>
            <span className="coords">{language.level}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

import { crew } from '@/content/crew';
import { profile } from '@/content/profile';

export const Crew = () => (
  <section className="section crew" id="crew" data-tod="0.9" data-cam="reading">
    <div className="crew__head column readable">
      <h2 className="section__title">People I sailed with</h2>
    </div>
    <div className="crew__quotes">
      {crew.map((testimonial) => (
        <blockquote key={testimonial.id} className="crew__quote readable">
          <p>{testimonial.quote}</p>
          <footer>
            <a href={testimonial.url} target="_blank" rel="noreferrer">
              {testimonial.author}
            </a>
          </footer>
        </blockquote>
      ))}
    </div>
    <figure className="crew__motto readable">
      <blockquote>{profile.quote.text}</blockquote>
      <figcaption className="coords">{profile.quote.author}</figcaption>
    </figure>
  </section>
);

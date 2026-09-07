export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  url: string;
}

export const crew: Testimonial[] = [
  {
    id: 'adamski',
    quote:
      'Nikodem is very passionate and has great vision for his work. His focus keeps everything moving smoothly, he makes sure all the deadlines are met, and makes sure that whatever project he is working on meets the highest standards.',
    author: 'Adam Adamski',
    url: 'https://www.linkedin.com/in/aagames/',
  },
  {
    id: 'piotrowski',
    quote:
      'Nikodem approached the delegated tasks very reliably and thoroughly. He has a high analytical competence in terms of risk analysis and project potential, copes well with interpersonal issues and has higher ambitions than the average member of the team. This is a man before whom you can see a good career.',
    author: 'Bartłomiej Świstak Piotrowski',
    url: 'https://www.linkedin.com/in/swistak-krakow/',
  },
];

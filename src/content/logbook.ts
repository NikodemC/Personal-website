export interface LogEntry {
  id: string;
  title: string;
  entry: string;
  photo: string;
  meta: string;
  link?: { label: string; url: string };
}

export const logbook: LogEntry[] = [
  {
    id: 'sailing',
    title: 'Sailing',
    entry:
      'Skippering yachts is the other half of the job. The Baltic and the Mediterranean, the Andaman Sea and the Indian Ocean, and one crossing of the Atlantic. Same rules as software: plan the passage, watch the weather, keep the crew rested and the boat in one piece.',
    photo: '/media/photos/sailing.jpg',
    meta: 'Baltic, Mediterranean, Andaman, Indian Ocean, Atlantic',
  },
  {
    id: 'podcast',
    title: 'How a spontaneous decision became a passion',
    entry:
      'A guest episode on the Halo WP podcast about finding sailing by accident and never letting it go.',
    photo: '/media/photos/sailing2.jpg',
    meta: 'Halo WP podcast, in Polish',
    link: {
      label: 'Listen to the episode',
      url: 'https://halo-wp.pinecast.co/episode/c2cb9fe3/dzi-ki-spontanicznej-decyzji-znalaz-pasj-ycia-nikodem-caba-a',
    },
  },
  {
    id: 'travel',
    title: 'Travel',
    entry:
      'New places, new people, new food. The best ideas for the next passage come from the last one.',
    photo: '/media/photos/travels.jpg',
    meta: 'Wherever the wind allows',
  },
  {
    id: 'sport',
    title: 'Sport',
    entry:
      'Three or four times a week, none of it competitive. It is the part of the day that has no keyboard in it, and that turns out to matter more than the training.',
    photo: '/media/photos/ninja.webp',
    meta: 'Gym, obstacle races, sailing',
  },
  {
    id: 'learning',
    title: 'Learning',
    entry:
      'Learning, unlearning and relearning is the whole development process in a nutshell. I try to keep the loop short.',
    photo: '/media/photos/knowledge.jpg',
    meta: 'Books, podcasts, people',
  },
];

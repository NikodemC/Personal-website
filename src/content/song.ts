export interface SongSection {
  label: string;
  lines: string[];
  /** Sung by the whole crew rather than the lead. */
  crew?: boolean;
}

export const song = {
  title: 'Two Logs, One Course',
  subtitle: 'My CV, as a shanty',
  url: '/media/audio/two-logs-one-course.mp3',
  sections: [
    {
      label: 'Verse',
      lines: [
        'I learned the money before the code',
        'The ledgers and the rules they keep',
        'Then somebody handed me a screen',
        'And I have not had a quiet week',
      ],
    },
    {
      label: 'Chorus',
      crew: true,
      lines: [
        'Soon may the reckoning come',
        'Two logs, one course!',
        'One out of timber, one out of light',
        'Two logs, one course!',
        'Both of them ask the same of me',
        'Pick a heading, keep the crew, and hold it right',
      ],
    },
    {
      label: 'Verse',
      lines: [
        'I built the parts that no one sees',
        'The ones that carry what you spend',
        'A tap on glass, a loan approved',
        'A hundred little services that bend',
      ],
    },
    {
      label: 'Verse',
      lines: [
        'We took a payment system down',
        'And raised it back a piece each night',
        'Nobody noticed anything',
        'And that is how you know it went right',
      ],
    },
    {
      label: 'Verse',
      lines: [
        'Now the thing I build is mine to steer',
        'Three of us and a plan to grow',
        'The chasing runs without a hand',
        'For money earned a month ago',
      ],
    },
    {
      label: 'Verse',
      lines: [
        'I want a thing that outlives the pitch',
        'That works the day I am not there',
        'I want the machines to do the reading',
        'And leave the people free to care',
      ],
    },
    {
      label: 'Bridge',
      lines: [
        'Salt gets whatever is left of me',
        'A wall to climb, a weight to raise',
        'A wheel to hold at three o’clock',
        'And an ocean I still owe some days',
      ],
    },
    {
      label: 'Verse',
      lines: [
        'I do not need to know the way',
        'Before I turn the boat around',
        'I only need to read the day',
        'And put the good crew on the ground',
      ],
    },
  ] satisfies SongSection[],
};

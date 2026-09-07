export interface Port {
  id: string;
  company: string;
  role: string;
  period: string;
  place: string;
  summary: string;
  stack: string[];
  tod: number;
}

export const ports: Port[] = [
  {
    id: 'eg',
    company: 'EG A/S',
    role: 'Junior full-stack developer',
    period: 'May 2020 to Jul 2021',
    place: 'Warsaw',
    summary:
      'First port. An application used by Danish municipalities to build intricate online forms that citizens fill in. I learned from very experienced people how to write code that someone else can read a year later.',
    stack: ['C#', '.NET', 'Angular', 'SQL', 'MongoDB', 'RabbitMQ', 'Docker'],
    tod: 0.12,
  },
  {
    id: 'homebook',
    company: 'Homebook.pl',
    role: '.NET developer',
    period: 'Aug 2021 to May 2022',
    place: 'Remote',
    summary:
      'Server side of a large interior design marketplace: APIs, third-party integrations, query tuning and keeping the platform fast under real traffic.',
    stack: ['C#', '.NET', 'Blazor', 'EF Core', 'Dapper', 'Azure DevOps'],
    tod: 0.2,
  },
  {
    id: 'nix',
    company: 'N-iX for Metro Bank',
    role: 'Software engineer',
    period: 'Jul 2022 to Mar 2024',
    place: 'Remote',
    summary:
      'Microservices that automate car loan applications for a UK bank, integrated with credit checks, vehicle history and identity verification. Scalable, secure, audited.',
    stack: ['C#', '.NET', 'Azure', 'Service Bus', 'Microservices', 'SpecFlow'],
    tod: 0.3,
  },
  {
    id: 'mbank',
    company: 'mBank',
    role: 'Software engineer',
    period: 'Apr 2024 to Jul 2025',
    place: 'Remote',
    summary:
      'Part of the crew rebuilding BLIK, the payment standard most of Poland taps every day, moving it onto microservices one service at a time. Alongside that, authorization work: keeping sensitive data confidential and the whole thing inside the rules a bank has to live by.',
    stack: ['C#', '.NET', 'Angular', 'React', 'xUnit', 'TeamCity'],
    tod: 0.4,
  },
];

export interface SkillGroup {
  id: string;
  label: string;
  bearing: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    id: 'backend',
    label: 'Backend',
    bearing: 'N',
    items: ['C#', '.NET', 'ASP.NET Core', 'EF Core', 'MediatR', 'SQL Server', 'Dapper', 'MongoDB'],
  },
  {
    id: 'cloud',
    label: 'Cloud and delivery',
    bearing: 'NE',
    items: [
      'Azure',
      'Azure Functions',
      'Service Bus',
      'GitHub Actions',
      'Docker',
      'TeamCity',
      'Octopus',
    ],
  },
  {
    id: 'frontend',
    label: 'Frontend',
    bearing: 'E',
    items: ['React', 'TypeScript', 'Vite', 'SCSS', 'Angular', 'Blazor'],
  },
  {
    id: 'ai',
    label: 'AI in production',
    bearing: 'SE',
    items: ['LLM agents', 'Claude', 'Gemini on Vertex AI', 'MCP', 'OCR pipelines', 'Evaluation'],
  },
  {
    id: 'quality',
    label: 'Quality',
    bearing: 'S',
    items: ['xUnit', 'NUnit', 'SpecFlow', 'Moq', 'NSubstitute', 'Shouldly', 'Sentry'],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    bearing: 'SW',
    items: ['Xero', 'QuickBooks', 'Fakturownia', 'wFirma', 'inFakt', 'Zoho', 'SaldeoSmart'],
  },
  {
    id: 'product',
    label: 'Product and finance',
    bearing: 'W',
    items: ['Corporate finance (MSc)', 'Accounting (BSc)', 'Collections', 'Invoicing', 'Jira'],
  },
  {
    id: 'sea',
    label: 'At sea',
    bearing: 'NW',
    items: ['Yacht skipper', 'Navigation', 'Crew leadership', 'Weather routing'],
  },
];

export const languages = [
  { label: 'Polish', level: 'native' },
  { label: 'English', level: 'fluent' },
  { label: 'Spanish', level: 'conversational' },
];

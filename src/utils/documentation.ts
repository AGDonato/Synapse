/**
 * Code documentation utilities
 * Generates comprehensive documentation for the codebase
 */

export interface ComponentDocumentation {
  name: string;
  description: string;
  props?: Record<string, PropDocumentation>;
  examples?: string[];
  category: string;
  complexity: 'low' | 'medium' | 'high';
  dependencies: string[];
}

export interface PropDocumentation {
  type: string;
  required: boolean;
  defaultValue?: string;
  description: string;
  examples?: string[];
}

export interface APIDocumentation {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters?: Record<string, ParameterDocumentation>;
  responses?: Record<number, ResponseDocumentation>;
  examples?: {
    request: unknown;
    response: unknown;
  }[];
  authentication: boolean;
  rateLimit?: {
    requests: number;
    window: string;
  };
}

export interface ParameterDocumentation {
  type: string;
  required: boolean;
  description: string;
  validation?: string[];
  examples?: string[];
}

export interface ResponseDocumentation {
  description: string;
  schema: string;
  examples?: unknown[];
}

export interface UtilityDocumentation {
  name: string;
  description: string;
  parameters?: Record<string, ParameterDocumentation>;
  returns: {
    type: string;
    description: string;
  };
  examples: string[];
  category: string;
  complexity: 'low' | 'medium' | 'high';
  testCoverage?: number;
}

// Component documentation registry
const componentDocs: ComponentDocumentation[] = [
  {
    name: 'Button',
    description: 'Reusable button component with multiple variants',
    props: {
      variant: {
        type: "'primary' | 'secondary' | 'danger' | 'ghost'",
        required: false,
        defaultValue: "'primary'",
        description: 'Visual style variant of the button',
        examples: ['primary', 'secondary', 'danger', 'ghost'],
      },
      size: {
        type: "'small' | 'medium' | 'large'",
        required: false,
        defaultValue: "'medium'",
        description: 'Size of the button',
        examples: ['small', 'medium', 'large'],
      },
      disabled: {
        type: 'boolean',
        required: false,
        defaultValue: 'false',
        description: 'Whether the button is disabled',
      },
      loading: {
        type: 'boolean',
        required: false,
        defaultValue: 'false',
        description: 'Whether the button is in loading state',
      },
      children: {
        type: 'React.ReactNode',
        required: true,
        description: 'Button content',
      },
    },
    examples: [
      '<Button variant="primary">Save</Button>',
      '<Button variant="secondary" size="small">Cancel</Button>',
      '<Button disabled loading>Processing...</Button>',
    ],
    category: 'UI Components',
    complexity: 'low',
    dependencies: [],
  },
  {
    name: 'Table',
    description: 'Advanced table component with sorting, filtering, and virtualization',
    props: {
      data: {
        type: 'T[]',
        required: true,
        description: 'Array of data objects to display',
      },
      columns: {
        type: 'ColumnDefinition<T>[]',
        required: true,
        description: 'Column configuration array',
      },
      sortable: {
        type: 'boolean',
        required: false,
        defaultValue: 'true',
        description: 'Whether columns can be sorted',
      },
      filterable: {
        type: 'boolean',
        required: false,
        defaultValue: 'false',
        description: 'Whether table supports filtering',
      },
      virtualized: {
        type: 'boolean',
        required: false,
        defaultValue: 'false',
        description: 'Whether to use virtualization for large datasets',
      },
    },
    examples: [
      '<Table data={users} columns={userColumns} />',
      '<Table data={documents} columns={documentColumns} sortable filterable />',
      '<Table data={largeDataset} columns={columns} virtualized />',
    ],
    category: 'Data Display',
    complexity: 'high',
    dependencies: ['@tanstack/react-virtual', 'react-window'],
  },
];

// API documentation registry
const apiDocs: APIDocumentation[] = [
  {
    endpoint: '/api/demandas',
    method: 'GET',
    description: 'Retrieve a paginated list of demands',
    parameters: {
      page: {
        type: 'number',
        required: false,
        description: 'Page number (1-based)',
        examples: ['1', '2', '10'],
      },
      per_page: {
        type: 'number',
        required: false,
        description: 'Number of items per page (1-100)',
        validation: ['min:1', 'max:100'],
        examples: ['10', '25', '50'],
      },
      sort_by: {
        type: 'string',
        required: false,
        description: 'Field to sort by',
        examples: ['created_at', 'updated_at', 'titulo'],
      },
      sort_direction: {
        type: "'asc' | 'desc'",
        required: false,
        description: 'Sort direction',
        examples: ['asc', 'desc'],
      },
      search: {
        type: 'string',
        required: false,
        description: 'Search term to filter results',
      },
    },
    responses: {
      200: {
        description: 'Successful response with paginated data',
        schema: 'PaginatedResponse<Demanda>',
        examples: [
          {
            data: [
              { id: 1, titulo: 'Demand 1', status: 'active' },
              { id: 2, titulo: 'Demand 2', status: 'pending' },
            ],
            meta: {
              current_page: 1,
              per_page: 10,
              total: 2,
              last_page: 1,
            },
          },
        ],
      },
      400: {
        description: 'Bad request - invalid parameters',
        schema: 'ErrorResponse',
      },
      500: {
        description: 'Internal server error',
        schema: 'ErrorResponse',
      },
    },
    examples: [
      {
        request: {
          method: 'GET',
          url: '/api/demandas?page=1&per_page=10&sort_by=created_at&sort_direction=desc',
        },
        response: {
          data: [],
          meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 },
        },
      },
    ],
    authentication: false,
    rateLimit: {
      requests: 100,
      window: '1 minute',
    },
  },
];

// Utility documentation registry
const utilityDocs: UtilityDocumentation[] = [
  {
    name: 'formatRelativeTime',
    description: 'Formats a date as a human-readable relative time string in Portuguese',
    parameters: {
      date: {
        type: 'Date | string | number',
        required: true,
        description: 'The date to format',
        examples: ['new Date()', '"2024-01-01"', '1640995200000'],
      },
    },
    returns: {
      type: 'string',
      description: 'Human-readable relative time string',
    },
    examples: [
      'formatRelativeTime(new Date()) // "agora mesmo"',
      'formatRelativeTime(Date.now() - 60000) // "1 minuto atrás"',
      'formatRelativeTime("2023-01-01") // "1 ano atrás"',
    ],
    category: 'Date/Time Utils',
    complexity: 'low',
    testCoverage: 95,
  },
  {
    name: 'safeAsync',
    description: 'Wraps async functions to return Result type instead of throwing errors',
    parameters: {
      fn: {
        type: '() => Promise<T>',
        required: true,
        description: 'Async function to wrap',
      },
      errorContext: {
        type: 'string',
        required: false,
        description: 'Context information for error logging',
      },
    },
    returns: {
      type: 'Promise<Result<T>>',
      description: 'Promise resolving to Result with success/failure status',
    },
    examples: [
      'const result = await safeAsync(() => fetchData())',
      'if (result.success) { logger.info("Operation successful", result.data) } else { logger.error("Operation failed", result.error) }',
    ],
    category: 'Error Handling',
    complexity: 'medium',
    testCoverage: 100,
  },
];

// Documentation generation functions
export const generateComponentDocs = (format: 'markdown' | 'json' = 'markdown'): string => {
  if (format === 'json') {
    return JSON.stringify(componentDocs, null, 2);
  }

  let markdown = '# Component Documentation\n\n';

  const categories = Array.from(new Set(componentDocs.map(doc => doc.category)));

  categories.forEach(category => {
    markdown += `## ${category}\n\n`;

    const categoryComponents = componentDocs.filter(doc => doc.category === category);

    categoryComponents.forEach(component => {
      markdown += `### ${component.name}\n\n`;
      markdown += `${component.description}\n\n`;

      if (component.props && Object.keys(component.props).length > 0) {
        markdown += '#### Props\n\n';
        markdown += '| Name | Type | Required | Default | Description |\n';
        markdown += '|------|------|----------|---------|-------------|\n';

        Object.entries(component.props).forEach(([name, prop]) => {
          markdown += `| ${name} | \`${prop.type}\` | ${prop.required ? 'Yes' : 'No'} | \`${prop.defaultValue || '-'}\` | ${prop.description} |\n`;
        });
        markdown += '\n';
      }

      if (component.examples && component.examples.length > 0) {
        markdown += '#### Examples\n\n';
        component.examples.forEach(example => {
          markdown += `\`\`\`tsx\n${example}\n\`\`\`\n\n`;
        });
      }

      markdown += `**Complexity:** ${component.complexity}\n\n`;

      if (component.dependencies.length > 0) {
        markdown += `**Dependencies:** ${component.dependencies.join(', ')}\n\n`;
      }

      markdown += '---\n\n';
    });
  });

  return markdown;
};

export const generateAPIDocs = (format: 'markdown' | 'json' = 'markdown'): string => {
  if (format === 'json') {
    return JSON.stringify(apiDocs, null, 2);
  }

  let markdown = '# API Documentation\n\n';

  apiDocs.forEach(api => {
    markdown += `## ${api.method} ${api.endpoint}\n\n`;
    markdown += `${api.description}\n\n`;

    if (api.authentication) {
      markdown += '🔐 **Authentication Required**\n\n';
    }

    if (api.rateLimit) {
      markdown += `⚡ **Rate Limited:** ${api.rateLimit.requests} requests per ${api.rateLimit.window}\n\n`;
    }

    if (api.parameters && Object.keys(api.parameters).length > 0) {
      markdown += '### Parameters\n\n';
      markdown += '| Name | Type | Required | Description |\n';
      markdown += '|------|------|----------|-------------|\n';

      Object.entries(api.parameters).forEach(([name, param]) => {
        markdown += `| ${name} | \`${param.type}\` | ${param.required ? 'Yes' : 'No'} | ${param.description} |\n`;
      });
      markdown += '\n';
    }

    if (api.responses && Object.keys(api.responses).length > 0) {
      markdown += '### Responses\n\n';

      Object.entries(api.responses).forEach(([code, response]) => {
        markdown += `#### ${code}\n\n`;
        markdown += `${response.description}\n\n`;
        markdown += `**Schema:** \`${response.schema}\`\n\n`;
      });
    }

    if (api.examples && api.examples.length > 0) {
      markdown += '### Examples\n\n';

      api.examples.forEach((example, index) => {
        markdown += `#### Example ${index + 1}\n\n`;
        markdown += '**Request:**\n';
        const request = example.request as { method?: string; url?: string };
        markdown += `\`\`\`http\n${request.method || 'GET'} ${request.url || api.endpoint}\n\`\`\`\n\n`;
        markdown += '**Response:**\n';
        markdown += `\`\`\`json\n${JSON.stringify(example.response, null, 2)}\n\`\`\`\n\n`;
      });
    }

    markdown += '---\n\n';
  });

  return markdown;
};

export const generateUtilityDocs = (format: 'markdown' | 'json' = 'markdown'): string => {
  if (format === 'json') {
    return JSON.stringify(utilityDocs, null, 2);
  }

  let markdown = '# Utility Documentation\n\n';

  const categories = Array.from(new Set(utilityDocs.map(doc => doc.category)));

  categories.forEach(category => {
    markdown += `## ${category}\n\n`;

    const categoryUtils = utilityDocs.filter(doc => doc.category === category);

    categoryUtils.forEach(util => {
      markdown += `### ${util.name}\n\n`;
      markdown += `${util.description}\n\n`;

      if (util.parameters && Object.keys(util.parameters).length > 0) {
        markdown += '#### Parameters\n\n';
        markdown += '| Name | Type | Required | Description |\n';
        markdown += '|------|------|----------|-------------|\n';

        Object.entries(util.parameters).forEach(([name, param]) => {
          markdown += `| ${name} | \`${param.type}\` | ${param.required ? 'Yes' : 'No'} | ${param.description} |\n`;
        });
        markdown += '\n';
      }

      markdown += '#### Returns\n\n';
      markdown += `\`${util.returns.type}\` - ${util.returns.description}\n\n`;

      if (util.examples && util.examples.length > 0) {
        markdown += '#### Examples\n\n';
        util.examples.forEach(example => {
          markdown += `\`\`\`typescript\n${example}\n\`\`\`\n\n`;
        });
      }

      markdown += `**Complexity:** ${util.complexity}\n\n`;

      if (util.testCoverage !== undefined) {
        markdown += `**Test Coverage:** ${util.testCoverage}%\n\n`;
      }

      markdown += '---\n\n';
    });
  });

  return markdown;
};

export const generateFullDocumentation = (): string => {
  let markdown = '# Synapse Frontend Documentation\n\n';
  markdown += `Generated on: ${new Date().toISOString()}\n\n`;
  markdown += '## Table of Contents\n\n';
  markdown += '- [Components](#component-documentation)\n';
  markdown += '- [API](#api-documentation)\n';
  markdown += '- [Utilities](#utility-documentation)\n\n';

  markdown += generateComponentDocs();
  markdown += '\n\n';
  markdown += generateAPIDocs();
  markdown += '\n\n';
  markdown += generateUtilityDocs();

  return markdown;
};

// Code metrics and analysis
export const analyzeCodeQuality = () => {
  const metrics = {
    components: componentDocs.length,
    apiEndpoints: apiDocs.length,
    utilities: utilityDocs.length,
    complexity: {
      low: [...componentDocs, ...utilityDocs].filter(d => d.complexity === 'low').length,
      medium: [...componentDocs, ...utilityDocs].filter(d => d.complexity === 'medium').length,
      high: [...componentDocs, ...utilityDocs].filter(d => d.complexity === 'high').length,
    },
    testCoverage: {
      average:
        utilityDocs.reduce((acc, util) => acc + (util.testCoverage || 0), 0) / utilityDocs.length,
      utilities: utilityDocs.filter(u => u.testCoverage !== undefined).length,
    },
  };

  return metrics;
};

export default {
  generateComponentDocs,
  generateAPIDocs,
  generateUtilityDocs,
  generateFullDocumentation,
  analyzeCodeQuality,
};

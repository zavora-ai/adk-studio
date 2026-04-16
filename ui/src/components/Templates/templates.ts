/**
 * Template data structure for ADK Studio v2.0
 * 
 * Provides 8-12 curated agent workflow templates covering:
 * - Agent teams
 * - Eval loops
 * - Tool-heavy workflows
 * - Realtime agents
 * - Automation workflows with action nodes
 * 
 * Requirements: 6.1, 6.2
 * 
 * Extended with n8n-inspired workflow templates for automation use cases.
 * @see .kiro/specs/action-nodes/tasks.md - Task 35
 */

import type { AgentSchema } from '../../types/project';
import type { ActionNodeConfig, ActionNodeType } from '../../types/actionNodes';
import { AUTOMATION_TEMPLATES } from './automationTemplates';

/**
 * Template category for filtering
 */
export type TemplateCategory = 'basic' | 'advanced' | 'realtime' | 'tools' | 'teams' | 'automation';

/**
 * Required environment variables for a template
 */
export interface TemplateEnvVar {
  /** Environment variable name */
  name: string;
  /** Description of what this variable is for */
  description: string;
  /** Whether this variable is required */
  required: boolean;
  /** Example value */
  example?: string;
}

/**
 * Template data structure
 */
export interface Template {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Emoji icon */
  icon: string;
  /** Short description */
  description: string;
  /** Category for filtering */
  category: TemplateCategory;
  /** Agent definitions */
  agents: Record<string, AgentSchema>;
  /** Action node definitions (for automation workflows) */
  actionNodes?: Record<string, ActionNodeConfig>;
  /** Edge connections */
  edges: Array<{ from: string; to: string; fromPort?: string; toPort?: string }>;
  /** Preview image path (optional) */
  previewImage?: string;
  /** Required action node types (for filtering) */
  requiredNodeTypes?: ActionNodeType[];
  /** Required environment variables */
  envVars?: TemplateEnvVar[];
  /** Detailed use case description */
  useCase?: string;
  /** Customization tips */
  customizationTips?: string[];
}

/**
 * Curated templates for ADK Studio
 * 
 * Includes templates for:
 * - Basic: Simple chat, research pipeline
 * - Advanced: Content refiner (loop), parallel analyzer, support router
 * - Tools: Web researcher, code assistant, data analyst
 * - Teams: Agent teams with multiple specialized agents
 * - Realtime: Voice/audio agents
 */
export const TEMPLATES: Template[] = [
  // ============================================
  // BASIC TEMPLATES
  // ============================================
  {
    id: 'simple_chat',
    name: 'Simple Chat Agent',
    icon: '💬',
    description: 'A basic conversational agent for general Q&A',
    category: 'basic',
    agents: {
      'chat_agent': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are a helpful, friendly assistant. Answer questions clearly and concisely. Be conversational but informative.',
        tools: [],
        sub_agents: [],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'chat_agent' },
      { from: 'chat_agent', to: 'END' },
    ]
  },
  {
    id: 'research_pipeline',
    name: 'Research Pipeline',
    icon: '🔍',
    description: 'Sequential workflow: Researcher → Summarizer',
    category: 'basic',
    agents: {
      'researcher': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are a research specialist. Given a topic, search for comprehensive information using Google Search. Gather key facts, statistics, recent developments, and expert opinions. Present your findings in a structured format.',
        tools: ['google_search'],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'summarizer': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are an expert summarizer. Take the research findings and create a clear, concise summary with: 1) Key takeaways (3-5 bullet points), 2) Main findings, 3) Conclusions. Make it easy to understand for a general audience.',
        tools: [],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'research_pipeline': {
        type: 'sequential',
        instruction: '',
        tools: [],
        sub_agents: ['researcher', 'summarizer'],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'research_pipeline' },
      { from: 'research_pipeline', to: 'END' },
    ]
  },

  // ============================================
  // ADVANCED TEMPLATES
  // ============================================
  {
    id: 'content_refiner',
    name: 'Content Refiner',
    icon: '✨',
    description: 'Loop agent that iteratively improves content quality',
    category: 'advanced',
    agents: {
      'improver': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are a content editor. Review the text and improve it by: fixing grammar and spelling errors, enhancing clarity and flow, improving word choice, and strengthening the overall structure. Output the improved version.',
        tools: [],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'reviewer': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are a quality reviewer. Evaluate the content for: clarity, grammar, flow, and completeness. If the content is polished and ready (score 8/10 or higher), call exit_loop. Otherwise, briefly note what still needs improvement and let the improver continue.',
        tools: ['exit_loop'],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'content_refiner': {
        type: 'loop',
        instruction: '',
        tools: [],
        sub_agents: ['improver', 'reviewer'],
        position: { x: 250, y: 150 },
        max_iterations: 3,
      }
    },
    edges: [
      { from: 'START', to: 'content_refiner' },
      { from: 'content_refiner', to: 'END' },
    ]
  },
  {
    id: 'parallel_analyzer',
    name: 'Parallel Analyzer',
    icon: '⚡',
    description: 'Run multiple analyses concurrently for speed',
    category: 'advanced',
    agents: {
      'sentiment_analyzer': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'Analyze the sentiment of the provided text. Identify: 1) Overall sentiment (positive/negative/neutral with confidence %), 2) Emotional tones present (joy, anger, sadness, etc.), 3) Key phrases that indicate sentiment. Format as a brief report.',
        tools: [],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'entity_extractor': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'Extract key entities from the text. Identify and categorize: 1) People (names, roles), 2) Organizations (companies, institutions), 3) Locations (cities, countries), 4) Dates and times, 5) Key topics/concepts. Format as a structured list.',
        tools: [],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'parallel_analyzer': {
        type: 'parallel',
        instruction: '',
        tools: [],
        sub_agents: ['sentiment_analyzer', 'entity_extractor'],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'parallel_analyzer' },
      { from: 'parallel_analyzer', to: 'END' },
    ]
  },
  {
    id: 'support_router',
    name: 'Support Router',
    icon: '🔀',
    description: 'Route requests to specialized support agents',
    category: 'advanced',
    agents: {
      'router': {
        type: 'router',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'Classify the user request into one category: "technical" for coding, bugs, API issues, or technical problems; "billing" for payments, subscriptions, refunds, or account charges; "general" for all other questions. Respond with just the category word.',
        tools: [],
        sub_agents: [],
        position: { x: 250, y: 100 },
        routes: [
          { condition: 'technical', target: 'tech_support' },
          { condition: 'billing', target: 'billing_support' },
          { condition: 'general', target: 'general_support' },
        ],
      },
      'tech_support': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are a senior technical support engineer. Help users with coding issues, bugs, API problems, and technical troubleshooting. Ask clarifying questions if needed. Provide code examples when helpful. Be patient and thorough.',
        tools: [],
        sub_agents: [],
        position: { x: 100, y: 350 },
      },
      'billing_support': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are a billing specialist. Help users with payment issues, subscription questions, refund requests, and account billing inquiries. Be empathetic and solution-oriented. Explain charges clearly.',
        tools: [],
        sub_agents: [],
        position: { x: 250, y: 350 },
      },
      'general_support': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are a friendly general support agent. Help users with general questions, product information, feature requests, and any inquiries that don\'t fit technical or billing categories. Be helpful and personable.',
        tools: [],
        sub_agents: [],
        position: { x: 400, y: 350 },
      }
    },
    edges: [
      { from: 'START', to: 'router' },
      { from: 'router', to: 'tech_support' },
      { from: 'router', to: 'billing_support' },
      { from: 'router', to: 'general_support' },
      { from: 'tech_support', to: 'END' },
      { from: 'billing_support', to: 'END' },
      { from: 'general_support', to: 'END' },
    ]
  },

  // ============================================
  // TOOL-HEAVY TEMPLATES
  // ============================================
  {
    id: 'web_researcher',
    name: 'Web Researcher',
    icon: '🌐',
    description: 'Agent with browser capabilities for web research',
    category: 'tools',
    agents: {
      'web_agent': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are a web research assistant with browser capabilities. When asked a question: 1) Navigate to relevant websites to find accurate, up-to-date information, 2) Read and extract key content from pages, 3) Synthesize findings into a clear answer with sources. Always cite your sources.',
        tools: ['browser'],
        sub_agents: [],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'web_agent' },
      { from: 'web_agent', to: 'END' },
    ]
  },
  {
    id: 'code_assistant',
    name: 'Code Assistant',
    icon: '💻',
    description: 'Programming assistant with code execution tools',
    category: 'tools',
    agents: {
      'code_agent': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are an expert programming assistant. Help users with: 1) Writing clean, efficient code, 2) Debugging issues, 3) Explaining concepts, 4) Code reviews. Use the code execution tool to test and validate code when helpful. Support multiple languages including Python, JavaScript, Rust, and more.',
        tools: ['code_execution'],
        sub_agents: [],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'code_agent' },
      { from: 'code_agent', to: 'END' },
    ]
  },
  {
    id: 'data_analyst',
    name: 'Data Analyst',
    icon: '📊',
    description: 'Analyze data with search and computation tools',
    category: 'tools',
    agents: {
      'analyst': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are a data analyst. Help users understand and analyze data by: 1) Searching for relevant datasets and statistics, 2) Performing calculations and analysis, 3) Creating clear visualizations and summaries, 4) Providing actionable insights. Use available tools to gather and process data.',
        tools: ['google_search', 'code_execution'],
        sub_agents: [],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'analyst' },
      { from: 'analyst', to: 'END' },
    ]
  },

  // ============================================
  // AGENT TEAMS TEMPLATES
  // ============================================
  {
    id: 'writing_team',
    name: 'Writing Team',
    icon: '✍️',
    description: 'Collaborative team: Writer → Editor → Fact-Checker',
    category: 'teams',
    agents: {
      'writer': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are a creative writer. Given a topic, write engaging, well-structured content. Focus on clarity, flow, and reader engagement. Include relevant examples and explanations.',
        tools: [],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'editor': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are a professional editor. Review the content for: grammar, style, clarity, and structure. Make improvements while preserving the author\'s voice. Suggest changes and explain your reasoning.',
        tools: [],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'fact_checker': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are a fact-checker. Verify all claims, statistics, and facts in the content. Use search to confirm accuracy. Flag any questionable statements and provide corrections with sources.',
        tools: ['google_search'],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'writing_team': {
        type: 'sequential',
        instruction: '',
        tools: [],
        sub_agents: ['writer', 'editor', 'fact_checker'],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'writing_team' },
      { from: 'writing_team', to: 'END' },
    ]
  },
  {
    id: 'eval_loop',
    name: 'Evaluation Loop',
    icon: '🔄',
    description: 'Generate and evaluate responses iteratively',
    category: 'teams',
    agents: {
      'generator': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are a response generator. Create high-quality, comprehensive responses to user queries. Consider multiple perspectives and provide thorough explanations.',
        tools: [],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'evaluator': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are a response evaluator. Score the response on: accuracy (1-10), completeness (1-10), clarity (1-10). If average score >= 8, call exit_loop. Otherwise, provide specific feedback for improvement.',
        tools: ['exit_loop'],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'eval_loop': {
        type: 'loop',
        instruction: '',
        tools: [],
        sub_agents: ['generator', 'evaluator'],
        position: { x: 250, y: 150 },
        max_iterations: 3,
      }
    },
    edges: [
      { from: 'START', to: 'eval_loop' },
      { from: 'eval_loop', to: 'END' },
    ]
  },

  // ============================================
  // REALTIME TEMPLATES
  // ============================================
  {
    id: 'voice_assistant',
    name: 'Voice Assistant',
    icon: '🎙️',
    description: 'Real-time voice-enabled conversational agent',
    category: 'realtime',
    agents: {
      'voice_agent': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are a voice assistant. Respond naturally and conversationally. Keep responses concise (1-2 sentences when possible) for smooth voice interaction. Be helpful, friendly, and responsive.',
        tools: [],
        sub_agents: [],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'voice_agent' },
      { from: 'voice_agent', to: 'END' },
    ]
  },
  {
    id: 'realtime_translator',
    name: 'Realtime Translator',
    icon: '🌍',
    description: 'Live translation agent for multilingual conversations',
    category: 'realtime',
    agents: {
      'translator': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: 'You are a real-time translator. Detect the input language and translate to the target language (default: English). Preserve tone, context, and nuance. For voice input, respond quickly with natural translations.',
        tools: [],
        sub_agents: [],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'translator' },
      { from: 'translator', to: 'END' },
    ]
  },

  // ============================================
  // AUTOMATION TEMPLATES (Action Nodes)
  // ============================================
  {
    id: 'email_sentiment_analysis',
    name: 'Email Sentiment Analysis',
    icon: '📧',
    description: 'Analyze email sentiment and update spreadsheet with results',
    category: 'automation',
    requiredNodeTypes: ['trigger', 'http', 'transform', 'loop', 'switch', 'set', 'merge'],
    envVars: [
      { name: 'GMAIL_TOKEN', description: 'Gmail API OAuth token', required: true, example: 'ya29.xxx' },
      { name: 'SHEET_ID', description: 'Google Sheets spreadsheet ID', required: true, example: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' },
      { name: 'SHEETS_TOKEN', description: 'Google Sheets API OAuth token', required: true, example: 'ya29.xxx' },
    ],
    useCase: 'Automatically analyze incoming emails for sentiment, categorize them by urgency, and log results to a Google Sheet for tracking and reporting.',
    customizationTips: [
      'Adjust the cron schedule to match your email checking frequency',
      'Modify sentiment thresholds in the Switch node for your use case',
      'Add additional categories beyond positive/neutral/negative',
    ],
    agents: {
      'sentiment_analyzer': {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: `You are a sentiment analysis expert. Analyze the email content provided and determine:
1. Overall sentiment: positive, negative, or neutral
2. Sentiment score: a number from -1.0 (very negative) to 1.0 (very positive)
3. Key phrases that indicate the sentiment
4. Urgency level: low, medium, or high

Output your analysis as JSON:
{
  "sentiment": "positive|negative|neutral",
  "score": 0.75,
  "keyPhrases": ["phrase1", "phrase2"],
  "urgency": "low|medium|high",
  "summary": "Brief summary of the email"
}`,
        tools: [],
        sub_agents: [],
        position: { x: 400, y: 300 },
      }
    },
    actionNodes: {
      'trigger_schedule': {
        type: 'trigger',
        id: 'trigger_schedule',
        name: 'Daily Email Check',
        description: 'Trigger workflow daily at 9 AM',
        triggerType: 'schedule',
        schedule: {
          cron: '0 9 * * *',
          timezone: 'America/New_York',
        },
        errorHandling: { mode: 'stop' },
        tracing: { enabled: true, logLevel: 'info' },
        callbacks: {},
        execution: { timeout: 30000 },
        mapping: { outputKey: 'triggerData' },
      },
      'fetch_emails': {
        type: 'http',
        id: 'fetch_emails',
        name: 'Fetch Unread Emails',
        description: 'Fetch unread emails from Gmail API',
        method: 'GET',
        url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread',
        auth: {
          type: 'bearer',
          bearer: { token: '{{GMAIL_TOKEN}}' },
        },
        headers: {},
        body: { type: 'none' },
        response: {
          type: 'json',
          jsonPath: '$.messages',
        },
        errorHandling: { mode: 'retry', retryCount: 3, retryDelay: 1000 },
        tracing: { enabled: true, logLevel: 'info' },
        callbacks: {},
        execution: { timeout: 30000 },
        mapping: { outputKey: 'emails' },
      },
      'parse_emails': {
        type: 'transform',
        id: 'parse_emails',
        name: 'Parse Email Data',
        description: 'Extract email content for analysis',
        transformType: 'javascript',
        expression: `return input.emails.map(email => ({
  id: email.id,
  subject: email.payload?.headers?.find(h => h.name === 'Subject')?.value || 'No Subject',
  from: email.payload?.headers?.find(h => h.name === 'From')?.value || 'Unknown',
  body: email.snippet || ''
}));`,
        errorHandling: { mode: 'stop' },
        tracing: { enabled: true, logLevel: 'debug' },
        callbacks: {},
        execution: { timeout: 10000 },
        mapping: { 
          inputMapping: { 'emails': 'emails' },
          outputKey: 'parsedEmails' 
        },
      },
      'process_loop': {
        type: 'loop',
        id: 'process_loop',
        name: 'Process Each Email',
        description: 'Iterate through emails for sentiment analysis',
        loopType: 'forEach',
        forEach: {
          sourceArray: 'parsedEmails',
          itemVar: 'email',
          indexVar: 'idx',
        },
        parallel: {
          enabled: true,
          batchSize: 5,
        },
        results: {
          collect: true,
          aggregationKey: 'analysisResults',
        },
        errorHandling: { mode: 'continue' },
        tracing: { enabled: true, logLevel: 'info' },
        callbacks: {},
        execution: { timeout: 120000 },
        mapping: { outputKey: 'loopResults' },
      },
      'route_sentiment': {
        type: 'switch',
        id: 'route_sentiment',
        name: 'Route by Sentiment',
        description: 'Route emails based on sentiment score',
        evaluationMode: 'first_match',
        conditions: [
          { id: 'positive', name: 'Positive', field: 'sentiment.score', operator: 'gt', value: 0.3, outputPort: 'positive' },
          { id: 'negative', name: 'Negative', field: 'sentiment.score', operator: 'lt', value: -0.3, outputPort: 'negative' },
        ],
        defaultBranch: 'neutral',
        errorHandling: { mode: 'stop' },
        tracing: { enabled: true, logLevel: 'info' },
        callbacks: {},
        execution: { timeout: 5000 },
        mapping: { outputKey: 'routeResult' },
      },
      'set_positive': {
        type: 'set',
        id: 'set_positive',
        name: 'Set Positive Category',
        description: 'Mark email as positive sentiment',
        mode: 'set',
        variables: [
          { key: 'category', value: 'Positive', valueType: 'string', isSecret: false },
          { key: 'color', value: '#22C55E', valueType: 'string', isSecret: false },
          { key: 'priority', value: 'low', valueType: 'string', isSecret: false },
        ],
        errorHandling: { mode: 'stop' },
        tracing: { enabled: false, logLevel: 'none' },
        callbacks: {},
        execution: { timeout: 5000 },
        mapping: { outputKey: 'categoryData' },
      },
      'set_neutral': {
        type: 'set',
        id: 'set_neutral',
        name: 'Set Neutral Category',
        description: 'Mark email as neutral sentiment',
        mode: 'set',
        variables: [
          { key: 'category', value: 'Neutral', valueType: 'string', isSecret: false },
          { key: 'color', value: '#6B7280', valueType: 'string', isSecret: false },
          { key: 'priority', value: 'medium', valueType: 'string', isSecret: false },
        ],
        errorHandling: { mode: 'stop' },
        tracing: { enabled: false, logLevel: 'none' },
        callbacks: {},
        execution: { timeout: 5000 },
        mapping: { outputKey: 'categoryData' },
      },
      'set_negative': {
        type: 'set',
        id: 'set_negative',
        name: 'Set Negative Category',
        description: 'Mark email as negative sentiment - requires attention',
        mode: 'set',
        variables: [
          { key: 'category', value: 'Negative', valueType: 'string', isSecret: false },
          { key: 'color', value: '#EF4444', valueType: 'string', isSecret: false },
          { key: 'priority', value: 'high', valueType: 'string', isSecret: false },
        ],
        errorHandling: { mode: 'stop' },
        tracing: { enabled: false, logLevel: 'none' },
        callbacks: {},
        execution: { timeout: 5000 },
        mapping: { outputKey: 'categoryData' },
      },
      'merge_results': {
        type: 'merge',
        id: 'merge_results',
        name: 'Merge All Results',
        description: 'Combine results from all sentiment branches',
        mode: 'wait_all',
        combineStrategy: 'array',
        timeout: {
          enabled: true,
          ms: 30000,
          behavior: 'continue',
        },
        errorHandling: { mode: 'continue' },
        tracing: { enabled: true, logLevel: 'info' },
        callbacks: {},
        execution: { timeout: 35000 },
        mapping: { outputKey: 'mergedResults' },
      },
      'update_sheet': {
        type: 'http',
        id: 'update_sheet',
        name: 'Update Google Sheet',
        description: 'Append analysis results to spreadsheet',
        method: 'POST',
        url: 'https://sheets.googleapis.com/v4/spreadsheets/{{SHEET_ID}}/values/A1:append?valueInputOption=USER_ENTERED',
        auth: {
          type: 'bearer',
          bearer: { token: '{{SHEETS_TOKEN}}' },
        },
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          type: 'json',
          content: '{"values": {{mergedResults}}}',
        },
        response: {
          type: 'json',
        },
        errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 2000 },
        tracing: { enabled: true, logLevel: 'info' },
        callbacks: {},
        execution: { timeout: 30000 },
        mapping: { outputKey: 'sheetResponse' },
      },
    },
    edges: [
      { from: 'START', to: 'trigger_schedule' },
      { from: 'trigger_schedule', to: 'fetch_emails' },
      { from: 'fetch_emails', to: 'parse_emails' },
      { from: 'parse_emails', to: 'process_loop' },
      { from: 'process_loop', to: 'sentiment_analyzer' },
      { from: 'sentiment_analyzer', to: 'route_sentiment' },
      { from: 'route_sentiment', to: 'set_positive', fromPort: 'positive' },
      { from: 'route_sentiment', to: 'set_neutral', fromPort: 'neutral' },
      { from: 'route_sentiment', to: 'set_negative', fromPort: 'negative' },
      { from: 'set_positive', to: 'merge_results' },
      { from: 'set_neutral', to: 'merge_results' },
      { from: 'set_negative', to: 'merge_results' },
      { from: 'merge_results', to: 'update_sheet' },
      { from: 'update_sheet', to: 'END' },
    ]
  },
  {
    id: 'api_data_pipeline',
    name: 'API Data Pipeline',
    icon: '🔄',
    description: 'Fetch, transform, and store data from external APIs',
    category: 'automation',
    requiredNodeTypes: ['trigger', 'http', 'transform', 'database'],
    envVars: [
      { name: 'WEBHOOK_API_KEY', description: 'API key for webhook authentication', required: true, example: 'sk-xxx' },
      { name: 'DATABASE_URL', description: 'PostgreSQL connection string', required: true, example: 'postgresql://user:pass@host:5432/db' },
    ],
    useCase: 'Create a webhook endpoint that receives data, fetches additional information from external APIs, transforms it, and stores it in a PostgreSQL database.',
    customizationTips: [
      'Modify the transform expression to match your data structure',
      'Add additional HTTP nodes for multiple API calls',
      'Change the database type to MySQL or MongoDB if needed',
    ],
    agents: {},
    actionNodes: {
      'trigger_webhook': {
        type: 'trigger',
        id: 'trigger_webhook',
        name: 'Webhook Trigger',
        description: 'Receive incoming webhook requests',
        triggerType: 'webhook',
        webhook: {
          path: '/api/webhook/data-pipeline',
          method: 'POST',
          auth: 'api_key',
          authConfig: {
            headerName: 'X-API-Key',
            tokenEnvVar: 'WEBHOOK_API_KEY',
          },
        },
        errorHandling: { mode: 'stop' },
        tracing: { enabled: true, logLevel: 'info' },
        callbacks: {},
        execution: { timeout: 30000 },
        mapping: { outputKey: 'webhookData' },
      },
      'fetch_data': {
        type: 'http',
        id: 'fetch_data',
        name: 'Fetch External Data',
        description: 'Retrieve data from external API',
        method: 'GET',
        url: '{{webhookData.apiUrl}}',
        auth: { type: 'none' },
        headers: {
          'Accept': 'application/json',
        },
        body: { type: 'none' },
        response: { type: 'json' },
        errorHandling: { mode: 'retry', retryCount: 3, retryDelay: 1000 },
        tracing: { enabled: true, logLevel: 'info' },
        callbacks: {},
        execution: { timeout: 30000 },
        mapping: { outputKey: 'rawData' },
      },
      'transform_data': {
        type: 'transform',
        id: 'transform_data',
        name: 'Transform Data',
        description: 'Clean and transform the fetched data',
        transformType: 'javascript',
        expression: `const data = input.rawData;
return {
  processed: true,
  timestamp: new Date().toISOString(),
  records: Array.isArray(data) ? data.length : 1,
  data: data
};`,
        errorHandling: { mode: 'stop' },
        tracing: { enabled: true, logLevel: 'debug' },
        callbacks: {},
        execution: { timeout: 10000 },
        mapping: { 
          inputMapping: { 'rawData': 'rawData' },
          outputKey: 'transformedData' 
        },
      },
      'store_database': {
        type: 'database',
        id: 'store_database',
        name: 'Store in Database',
        description: 'Save transformed data to PostgreSQL',
        dbType: 'postgresql',
        connection: {
          connectionString: '{{DATABASE_URL}}',
          poolSize: 5,
        },
        sql: {
          operation: 'insert',
          query: 'INSERT INTO pipeline_data (payload, processed_at) VALUES ($1, $2)',
          params: {
            '$1': '{{transformedData}}',
            '$2': '{{transformedData.timestamp}}',
          },
        },
        errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 500 },
        tracing: { enabled: true, logLevel: 'info' },
        callbacks: {},
        execution: { timeout: 15000 },
        mapping: { outputKey: 'dbResult' },
      },
    },
    edges: [
      { from: 'START', to: 'trigger_webhook' },
      { from: 'trigger_webhook', to: 'fetch_data' },
      { from: 'fetch_data', to: 'transform_data' },
      { from: 'transform_data', to: 'store_database' },
      { from: 'store_database', to: 'END' },
    ]
  },
  // Include all n8n-inspired automation templates
  ...AUTOMATION_TEMPLATES,
];

/**
 * Get templates filtered by category
 */
export function getTemplatesByCategory(category: TemplateCategory | 'all'): Template[] {
  if (category === 'all') {
    return TEMPLATES;
  }
  return TEMPLATES.filter(t => t.category === category);
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id);
}

/**
 * Get all unique categories
 */
export function getCategories(): TemplateCategory[] {
  return ['basic', 'advanced', 'tools', 'teams', 'realtime', 'automation'];
}

/**
 * Get templates filtered by required node types
 */
export function getTemplatesByNodeTypes(nodeTypes: ActionNodeType[]): Template[] {
  return TEMPLATES.filter(template => {
    if (!template.actionNodes) return false;
    const templateNodeTypes = Object.values(template.actionNodes).map(n => n.type);
    return nodeTypes.every(type => templateNodeTypes.includes(type));
  });
}

/**
 * Get templates that contain action nodes
 */
export function getAutomationTemplates(): Template[] {
  return TEMPLATES.filter(template => 
    template.actionNodes && Object.keys(template.actionNodes).length > 0
  );
}

/**
 * Extract required node types from a template
 */
export function extractRequiredNodeTypes(template: Template): ActionNodeType[] {
  if (!template.actionNodes) return [];
  const types = new Set<ActionNodeType>();
  Object.values(template.actionNodes).forEach(node => {
    types.add(node.type);
  });
  return Array.from(types);
}

/**
 * Category display names
 */
export const CATEGORY_LABELS: Record<TemplateCategory | 'all', string> = {
  all: 'All Templates',
  basic: 'Basic',
  advanced: 'Advanced',
  tools: 'Tool-Heavy',
  teams: 'Agent Teams',
  realtime: 'Realtime',
  automation: 'Automation',
};

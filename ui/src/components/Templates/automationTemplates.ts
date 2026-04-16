/**
 * n8n-Inspired Automation Workflow Templates
 * 
 * 12 curated templates demonstrating real-world automation use cases
 * combining LLM agents with action nodes.
 * 
 * @see .kiro/specs/action-nodes/tasks.md - Task 35
 * @see .kiro/specs/action-nodes/requirements.md - Use Case Validation
 */

import type { Template } from './templates';

/**
 * Template 1: AI-Powered Lead Generation
 * 
 * Workflow: Trigger (webhook) → HTTP (form) → LLM Agent (analyze) → LLM Agent (score) 
 *           → Switch (routing) → HTTP (CRM) → Notification (Slack)
 * 
 * Use Case: Automatically process incoming leads from web forms, analyze them with AI,
 * score their quality, and route them to the appropriate sales team.
 */
export const leadGenerationTemplate: Template = {
  id: 'ai_lead_generation',
  name: 'AI-Powered Lead Generation',
  icon: '🎯',
  description: 'Process leads with AI analysis, scoring, and CRM integration',
  category: 'automation',
  requiredNodeTypes: ['trigger', 'http', 'switch', 'notification'],
  envVars: [
    { name: 'WEBHOOK_SECRET', description: 'Secret for webhook authentication', required: true, example: 'whsec_xxx' },
    { name: 'CRM_API_KEY', description: 'CRM API key (HubSpot, Salesforce, etc.)', required: true, example: 'pat-xxx' },
    { name: 'CRM_BASE_URL', description: 'CRM API base URL', required: true, example: 'https://api.hubapi.com' },
    { name: 'SLACK_WEBHOOK_URL', description: 'Slack incoming webhook URL', required: true, example: 'https://hooks.slack.com/services/xxx' },
  ],
  useCase: 'Automatically process incoming leads from web forms, analyze company information and intent with AI, score lead quality, and route high-value leads to sales while updating your CRM.',
  customizationTips: [
    'Adjust the lead scoring criteria in the scoring agent prompt',
    'Modify the Switch conditions to match your lead routing rules',
    'Add additional CRM fields based on your sales process',
    'Customize Slack message format for your team preferences',
  ],
  agents: {
    'lead_analyzer': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a lead analysis expert. Analyze the incoming lead data and extract:
1. Company information (name, size, industry)
2. Contact details (name, role, seniority)
3. Intent signals (what they're looking for, urgency)
4. Potential use cases for our product
5. Any red flags or concerns

Output your analysis as JSON:
{
  "company": {
    "name": "Company Name",
    "size": "small|medium|enterprise",
    "industry": "Industry"
  },
  "contact": {
    "name": "Contact Name",
    "role": "Job Title",
    "seniority": "junior|mid|senior|executive"
  },
  "intent": {
    "description": "What they're looking for",
    "urgency": "low|medium|high",
    "useCases": ["use case 1", "use case 2"]
  },
  "concerns": ["any red flags"],
  "summary": "Brief summary of the lead"
}`,
      tools: [],
      sub_agents: [],
      position: { x: 400, y: 200 },
    },
    'lead_scorer': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a lead scoring expert. Based on the lead analysis provided, calculate a lead score from 0-100 considering:

Scoring Criteria:
- Company size: Enterprise (+30), Medium (+20), Small (+10)
- Contact seniority: Executive (+25), Senior (+20), Mid (+10), Junior (+5)
- Intent urgency: High (+25), Medium (+15), Low (+5)
- Industry fit: High fit (+20), Medium fit (+10), Low fit (+0)

Also determine the lead tier:
- Hot (80-100): Immediate follow-up required
- Warm (50-79): Follow up within 24 hours
- Cold (0-49): Add to nurture campaign

Output as JSON:
{
  "score": 85,
  "tier": "hot|warm|cold",
  "breakdown": {
    "companySize": 30,
    "seniority": 25,
    "urgency": 25,
    "industryFit": 5
  },
  "recommendation": "Recommended next action",
  "assignTo": "sales_team|nurture_campaign|disqualify"
}`,
      tools: [],
      sub_agents: [],
      position: { x: 600, y: 200 },
    },
  },
  actionNodes: {
    'webhook_trigger': {
      type: 'trigger',
      id: 'webhook_trigger',
      name: 'Lead Form Webhook',
      description: 'Receive lead submissions from web forms',
      triggerType: 'webhook',
      webhook: {
        path: '/api/webhook/leads',
        method: 'POST',
        auth: 'api_key',
        authConfig: {
          headerName: 'X-Webhook-Secret',
          tokenEnvVar: 'WEBHOOK_SECRET',
        },
      },
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'leadData' },
    },
    'enrich_lead': {
      type: 'http',
      id: 'enrich_lead',
      name: 'Enrich Lead Data',
      description: 'Fetch additional company information',
      method: 'GET',
      url: 'https://api.clearbit.com/v2/companies/find?domain={{leadData.email.split("@")[1]}}',
      auth: {
        type: 'bearer',
        bearer: { token: '{{CLEARBIT_API_KEY}}' },
      },
      headers: {},
      body: { type: 'none' },
      response: {
        type: 'json',
      },
      errorHandling: { mode: 'fallback', fallbackValue: {} },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { outputKey: 'enrichedData' },
    },
    'route_lead': {
      type: 'switch',
      id: 'route_lead',
      name: 'Route by Lead Score',
      description: 'Route leads based on their score tier',
      evaluationMode: 'first_match',
      conditions: [
        { id: 'hot', name: 'Hot Lead', field: 'leadScore.tier', operator: 'eq', value: 'hot', outputPort: 'hot' },
        { id: 'warm', name: 'Warm Lead', field: 'leadScore.tier', operator: 'eq', value: 'warm', outputPort: 'warm' },
      ],
      defaultBranch: 'cold',
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 5000 },
      mapping: { outputKey: 'routeResult' },
    },
    'create_crm_contact': {
      type: 'http',
      id: 'create_crm_contact',
      name: 'Create CRM Contact',
      description: 'Create or update contact in CRM',
      method: 'POST',
      url: '{{CRM_BASE_URL}}/crm/v3/objects/contacts',
      auth: {
        type: 'bearer',
        bearer: { token: '{{CRM_API_KEY}}' },
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        type: 'json',
        content: `{
  "properties": {
    "email": "{{leadData.email}}",
    "firstname": "{{leadAnalysis.contact.name.split(' ')[0]}}",
    "lastname": "{{leadAnalysis.contact.name.split(' ').slice(1).join(' ')}}",
    "company": "{{leadAnalysis.company.name}}",
    "jobtitle": "{{leadAnalysis.contact.role}}",
    "lead_score": "{{leadScore.score}}",
    "lead_tier": "{{leadScore.tier}}"
  }
}`,
      },
      response: { type: 'json' },
      errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 1000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 15000 },
      mapping: { outputKey: 'crmResult' },
    },
    'notify_sales': {
      type: 'notification',
      id: 'notify_sales',
      name: 'Notify Sales Team',
      description: 'Send Slack notification for hot leads',
      channel: 'slack',
      webhookUrl: '{{SLACK_WEBHOOK_URL}}',
      message: {
        text: `🔥 *New Hot Lead!*\n\n*Company:* {{leadAnalysis.company.name}}\n*Contact:* {{leadAnalysis.contact.name}} ({{leadAnalysis.contact.role}})\n*Score:* {{leadScore.score}}/100\n*Intent:* {{leadAnalysis.intent.description}}\n\n_{{leadScore.recommendation}}_`,
        format: 'markdown',
      },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { outputKey: 'notificationResult' },
    },
  },
  edges: [
    { from: 'START', to: 'webhook_trigger' },
    { from: 'webhook_trigger', to: 'enrich_lead' },
    { from: 'enrich_lead', to: 'lead_analyzer' },
    { from: 'lead_analyzer', to: 'lead_scorer' },
    { from: 'lead_scorer', to: 'route_lead' },
    { from: 'route_lead', to: 'create_crm_contact', fromPort: 'hot' },
    { from: 'route_lead', to: 'create_crm_contact', fromPort: 'warm' },
    { from: 'route_lead', to: 'create_crm_contact', fromPort: 'cold' },
    { from: 'create_crm_contact', to: 'notify_sales' },
    { from: 'notify_sales', to: 'END' },
  ],
};


/**
 * Template 2: Intelligent Email Marketing
 * 
 * Workflow: Trigger (schedule) → Database (customers) → Loop (forEach) 
 *           → LLM Agent (personalize) → Email (send) → Wait (monitor)
 * 
 * Use Case: Send personalized marketing emails to customer segments with AI-generated
 * content tailored to each recipient's profile and behavior.
 */
export const emailMarketingTemplate: Template = {
  id: 'intelligent_email_marketing',
  name: 'Intelligent Email Marketing',
  icon: '📬',
  description: 'AI-personalized email campaigns with customer segmentation',
  category: 'automation',
  requiredNodeTypes: ['trigger', 'database', 'loop', 'email', 'wait'],
  envVars: [
    { name: 'DATABASE_URL', description: 'PostgreSQL connection string for customer data', required: true, example: 'postgresql://user:pass@host:5432/db' },
    { name: 'SMTP_HOST', description: 'SMTP server host', required: true, example: 'smtp.sendgrid.net' },
    { name: 'SMTP_USER', description: 'SMTP username', required: true, example: 'apikey' },
    { name: 'SMTP_PASS', description: 'SMTP password or API key', required: true, example: 'SG.xxx' },
    { name: 'FROM_EMAIL', description: 'Sender email address', required: true, example: 'marketing@company.com' },
  ],
  useCase: 'Run scheduled email campaigns that fetch customer segments from your database, use AI to personalize each email based on customer profile and purchase history, and track engagement.',
  customizationTips: [
    'Modify the SQL query to target specific customer segments',
    'Adjust the personalization prompt for your brand voice',
    'Add A/B testing by creating multiple email variants',
    'Implement engagement tracking with webhook callbacks',
  ],
  agents: {
    'email_personalizer': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are an expert email marketing copywriter. Create a personalized email for the customer based on their profile.

Customer Data Available:
- Name: {{customer.name}}
- Purchase history: {{customer.purchases}}
- Preferences: {{customer.preferences}}
- Last interaction: {{customer.lastInteraction}}

Campaign Context:
- Campaign type: {{campaign.type}}
- Product/offer: {{campaign.product}}
- Key message: {{campaign.message}}

Write a compelling, personalized email that:
1. Uses the customer's name naturally
2. References their past purchases or interests
3. Presents the offer in a relevant way
4. Has a clear call-to-action
5. Maintains a friendly, professional tone

Output as JSON:
{
  "subject": "Personalized subject line",
  "preheader": "Email preview text",
  "greeting": "Personalized greeting",
  "body": "Main email content (HTML allowed)",
  "cta": {
    "text": "Button text",
    "url": "https://..."
  },
  "signature": "Closing and signature"
}`,
      tools: [],
      sub_agents: [],
      position: { x: 500, y: 300 },
    },
  },
  actionNodes: {
    'schedule_trigger': {
      type: 'trigger',
      id: 'schedule_trigger',
      name: 'Campaign Schedule',
      description: 'Run campaign every Tuesday at 10 AM',
      triggerType: 'schedule',
      schedule: {
        cron: '0 10 * * 2',
        timezone: 'America/New_York',
      },
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'scheduleData' },
    },
    'fetch_customers': {
      type: 'database',
      id: 'fetch_customers',
      name: 'Fetch Customer Segment',
      description: 'Get customers for this campaign',
      dbType: 'postgresql',
      connection: {
        connectionString: '{{DATABASE_URL}}',
        poolSize: 5,
      },
      sql: {
        operation: 'query',
        query: `SELECT 
          c.id, c.email, c.name, c.preferences,
          c.last_interaction, c.segment,
          json_agg(p.*) as purchases
        FROM customers c
        LEFT JOIN purchases p ON p.customer_id = c.id
        WHERE c.email_opt_in = true
          AND c.segment = 'active'
          AND c.last_email_sent < NOW() - INTERVAL '7 days'
        GROUP BY c.id
        LIMIT 100`,
      },
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'customers' },
    },
    'set_campaign': {
      type: 'set',
      id: 'set_campaign',
      name: 'Set Campaign Details',
      description: 'Configure campaign parameters',
      mode: 'set',
      variables: [
        { key: 'campaign.type', value: 'promotional', valueType: 'string', isSecret: false },
        { key: 'campaign.product', value: 'Summer Collection 2024', valueType: 'string', isSecret: false },
        { key: 'campaign.message', value: 'Exclusive 20% off for valued customers', valueType: 'string', isSecret: false },
        { key: 'campaign.trackingId', value: 'summer2024-promo', valueType: 'string', isSecret: false },
      ],
      errorHandling: { mode: 'stop' },
      tracing: { enabled: false, logLevel: 'none' },
      callbacks: {},
      execution: { timeout: 5000 },
      mapping: { outputKey: 'campaign' },
    },
    'process_customers': {
      type: 'loop',
      id: 'process_customers',
      name: 'Process Each Customer',
      description: 'Iterate through customers for personalization',
      loopType: 'forEach',
      forEach: {
        sourceArray: 'customers',
        itemVar: 'customer',
        indexVar: 'idx',
      },
      parallel: {
        enabled: true,
        batchSize: 10,
        delayBetween: 1000,
      },
      results: {
        collect: true,
        aggregationKey: 'emailResults',
      },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 300000 },
      mapping: { outputKey: 'loopResults' },
    },
    'send_email': {
      type: 'email',
      id: 'send_email',
      name: 'Send Personalized Email',
      description: 'Send the AI-generated email',
      mode: 'send',
      smtp: {
        host: '{{SMTP_HOST}}',
        port: 587,
        secure: false,
        username: '{{SMTP_USER}}',
        password: '{{SMTP_PASS}}',
        fromEmail: '{{FROM_EMAIL}}',
        fromName: 'Your Company',
      },
      recipients: {
        to: '{{customer.email}}',
      },
      content: {
        subject: '{{personalizedEmail.subject}}',
        bodyType: 'html',
        body: `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>{{personalizedEmail.greeting}}</p>
  <div>{{personalizedEmail.body}}</div>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{personalizedEmail.cta.url}}?utm_campaign={{campaign.trackingId}}&utm_source=email" 
       style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
      {{personalizedEmail.cta.text}}
    </a>
  </p>
  <p>{{personalizedEmail.signature}}</p>
</body>
</html>`,
      },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'emailSent' },
    },
    'update_customer': {
      type: 'database',
      id: 'update_customer',
      name: 'Update Customer Record',
      description: 'Mark email as sent',
      dbType: 'postgresql',
      connection: {
        connectionString: '{{DATABASE_URL}}',
        poolSize: 5,
      },
      sql: {
        operation: 'update',
        query: `UPDATE customers 
                SET last_email_sent = NOW(), 
                    email_count = email_count + 1 
                WHERE id = $1`,
        params: { '$1': '{{customer.id}}' },
      },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: false, logLevel: 'none' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { outputKey: 'updateResult' },
    },
    'wait_for_engagement': {
      type: 'wait',
      id: 'wait_for_engagement',
      name: 'Wait for Engagement',
      description: 'Wait 24 hours to collect engagement data',
      waitType: 'fixed',
      fixed: {
        duration: 24,
        unit: 'h',
      },
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 90000000 },
      mapping: { outputKey: 'waitComplete' },
    },
  },
  edges: [
    { from: 'START', to: 'schedule_trigger' },
    { from: 'schedule_trigger', to: 'fetch_customers' },
    { from: 'fetch_customers', to: 'set_campaign' },
    { from: 'set_campaign', to: 'process_customers' },
    { from: 'process_customers', to: 'email_personalizer' },
    { from: 'email_personalizer', to: 'send_email' },
    { from: 'send_email', to: 'update_customer' },
    { from: 'update_customer', to: 'wait_for_engagement' },
    { from: 'wait_for_engagement', to: 'END' },
  ],
};


/**
 * Template 3: Social Media AI Content Creator
 * 
 * Workflow: Trigger (RSS/webhook) → Transform (extract) → Loop (platforms) 
 *           → LLM Agent (adapt) → HTTP (post APIs)
 * 
 * Use Case: Automatically create and post platform-specific content from a single
 * source (blog post, news article, etc.) to multiple social media platforms.
 */
export const socialMediaContentTemplate: Template = {
  id: 'social_media_content_creator',
  name: 'Social Media AI Content Creator',
  icon: '📱',
  description: 'Auto-generate platform-specific posts from content sources',
  category: 'automation',
  requiredNodeTypes: ['trigger', 'rss', 'transform', 'loop', 'http'],
  envVars: [
    { name: 'TWITTER_BEARER_TOKEN', description: 'Twitter API Bearer token', required: false, example: 'AAAAAxx' },
    { name: 'LINKEDIN_ACCESS_TOKEN', description: 'LinkedIn API access token', required: false, example: 'AQVxx' },
    { name: 'FACEBOOK_PAGE_TOKEN', description: 'Facebook Page access token', required: false, example: 'EAAxx' },
    { name: 'FACEBOOK_PAGE_ID', description: 'Facebook Page ID', required: false, example: '123456789' },
  ],
  useCase: 'Monitor your blog RSS feed or receive webhooks for new content, then use AI to adapt the content for each social media platform (Twitter, LinkedIn, Facebook) with appropriate tone, length, and hashtags.',
  customizationTips: [
    'Add or remove platforms in the platforms array',
    'Customize the AI prompts for your brand voice',
    'Add image generation for visual content',
    'Schedule posts for optimal engagement times',
  ],
  agents: {
    'content_adapter': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a social media content expert. Adapt the given content for the specified platform.

Source Content:
- Title: {{content.title}}
- Summary: {{content.summary}}
- URL: {{content.url}}
- Key points: {{content.keyPoints}}

Target Platform: {{platform.name}}

Platform Guidelines:
- Twitter: Max 280 chars, use hashtags, engaging hook, include link
- LinkedIn: Professional tone, 1-3 paragraphs, industry hashtags, thought leadership angle
- Facebook: Conversational, can be longer, encourage engagement, use emojis sparingly

Create content that:
1. Captures attention in the first line
2. Conveys the key message
3. Includes appropriate hashtags (3-5)
4. Has a clear call-to-action
5. Fits the platform's character/style limits

Output as JSON:
{
  "platform": "twitter|linkedin|facebook",
  "content": "The post content",
  "hashtags": ["hashtag1", "hashtag2"],
  "characterCount": 150,
  "mediaRecommendation": "Description of ideal accompanying image",
  "bestPostTime": "Recommended posting time"
}`,
      tools: [],
      sub_agents: [],
      position: { x: 500, y: 300 },
    },
  },
  actionNodes: {
    'rss_trigger': {
      type: 'rss',
      id: 'rss_trigger',
      name: 'Blog RSS Feed',
      description: 'Monitor blog for new posts',
      feedUrl: 'https://your-blog.com/feed.xml',
      pollInterval: 3600000,
      filters: {
        keywords: [],
      },
      seenTracking: {
        enabled: true,
        stateKey: 'seenPosts',
        maxItems: 100,
      },
      maxEntries: 5,
      includeContent: true,
      parseMedia: true,
      errorHandling: { mode: 'retry', retryCount: 3, retryDelay: 60000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'feedEntries' },
    },
    'extract_content': {
      type: 'transform',
      id: 'extract_content',
      name: 'Extract Content',
      description: 'Parse and structure the content',
      transformType: 'javascript',
      expression: `const entry = input.feedEntries[0];
return {
  title: entry.title,
  summary: entry.description?.substring(0, 500) || '',
  url: entry.link,
  publishDate: entry.pubDate,
  keyPoints: entry.description?.split('.').slice(0, 3).join('.') || '',
  author: entry.author || 'Unknown',
  categories: entry.categories || []
};`,
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'debug' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { 
        inputMapping: { 'feedEntries': 'feedEntries' },
        outputKey: 'content' 
      },
    },
    'set_platforms': {
      type: 'set',
      id: 'set_platforms',
      name: 'Configure Platforms',
      description: 'Define target social media platforms',
      mode: 'set',
      variables: [
        { 
          key: 'platforms', 
          value: [
            { name: 'twitter', enabled: true, apiUrl: 'https://api.twitter.com/2/tweets' },
            { name: 'linkedin', enabled: true, apiUrl: 'https://api.linkedin.com/v2/ugcPosts' },
            { name: 'facebook', enabled: true, apiUrl: 'https://graph.facebook.com/v18.0/{{FACEBOOK_PAGE_ID}}/feed' }
          ], 
          valueType: 'json', 
          isSecret: false 
        },
      ],
      errorHandling: { mode: 'stop' },
      tracing: { enabled: false, logLevel: 'none' },
      callbacks: {},
      execution: { timeout: 5000 },
      mapping: { outputKey: 'platformConfig' },
    },
    'loop_platforms': {
      type: 'loop',
      id: 'loop_platforms',
      name: 'Process Each Platform',
      description: 'Create content for each platform',
      loopType: 'forEach',
      forEach: {
        sourceArray: 'platforms',
        itemVar: 'platform',
        indexVar: 'platformIdx',
      },
      parallel: {
        enabled: false,
      },
      results: {
        collect: true,
        aggregationKey: 'postResults',
      },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 120000 },
      mapping: { outputKey: 'loopResults' },
    },
    'post_twitter': {
      type: 'http',
      id: 'post_twitter',
      name: 'Post to Twitter',
      description: 'Publish tweet via Twitter API',
      method: 'POST',
      url: 'https://api.twitter.com/2/tweets',
      auth: {
        type: 'bearer',
        bearer: { token: '{{TWITTER_BEARER_TOKEN}}' },
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        type: 'json',
        content: '{"text": "{{adaptedContent.content}}"}',
      },
      response: { type: 'json' },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 15000 },
      mapping: { outputKey: 'twitterResult' },
    },
    'post_linkedin': {
      type: 'http',
      id: 'post_linkedin',
      name: 'Post to LinkedIn',
      description: 'Publish post via LinkedIn API',
      method: 'POST',
      url: 'https://api.linkedin.com/v2/ugcPosts',
      auth: {
        type: 'bearer',
        bearer: { token: '{{LINKEDIN_ACCESS_TOKEN}}' },
      },
      headers: {
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: {
        type: 'json',
        content: `{
  "author": "urn:li:person:{{LINKEDIN_PERSON_ID}}",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {"text": "{{adaptedContent.content}}"},
      "shareMediaCategory": "ARTICLE",
      "media": [{
        "status": "READY",
        "originalUrl": "{{content.url}}"
      }]
    }
  },
  "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
}`,
      },
      response: { type: 'json' },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 15000 },
      mapping: { outputKey: 'linkedinResult' },
    },
  },
  edges: [
    { from: 'START', to: 'rss_trigger' },
    { from: 'rss_trigger', to: 'extract_content' },
    { from: 'extract_content', to: 'set_platforms' },
    { from: 'set_platforms', to: 'loop_platforms' },
    { from: 'loop_platforms', to: 'content_adapter' },
    { from: 'content_adapter', to: 'post_twitter' },
    { from: 'post_twitter', to: 'post_linkedin' },
    { from: 'post_linkedin', to: 'END' },
  ],
};


/**
 * Template 4: AI Customer Support
 * 
 * Workflow: Trigger (webhook) → LLM Agent (classify) → Vector Search (KB) 
 *           → LLM Agent (respond) → Switch (confidence) → Email/Notification
 * 
 * Use Case: Automatically handle customer support tickets by classifying issues,
 * searching a knowledge base, and generating responses with confidence-based routing.
 */
export const customerSupportTemplate: Template = {
  id: 'ai_customer_support',
  name: 'AI Customer Support',
  icon: '🎧',
  description: 'Intelligent ticket handling with knowledge base integration',
  category: 'automation',
  requiredNodeTypes: ['trigger', 'switch', 'http', 'email', 'notification'],
  envVars: [
    { name: 'PINECONE_API_KEY', description: 'Pinecone vector database API key', required: true, example: 'pc-xxx' },
    { name: 'PINECONE_INDEX', description: 'Pinecone index name', required: true, example: 'support-kb' },
    { name: 'SMTP_HOST', description: 'SMTP server for sending responses', required: true, example: 'smtp.sendgrid.net' },
    { name: 'SMTP_USER', description: 'SMTP username', required: true },
    { name: 'SMTP_PASS', description: 'SMTP password', required: true },
    { name: 'SLACK_WEBHOOK_URL', description: 'Slack webhook for escalations', required: true },
  ],
  useCase: 'Receive support tickets via webhook, classify the issue type, search your knowledge base for relevant articles, generate a helpful response, and either auto-reply or escalate to human agents based on confidence.',
  customizationTips: [
    'Adjust confidence thresholds for auto-reply vs escalation',
    'Add more issue categories in the classifier prompt',
    'Customize the response tone for your brand',
    'Integrate with your ticketing system (Zendesk, Freshdesk, etc.)',
  ],
  agents: {
    'ticket_classifier': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a customer support ticket classifier. Analyze the incoming ticket and categorize it.

Ticket Content:
- Subject: {{ticket.subject}}
- Body: {{ticket.body}}
- Customer: {{ticket.customerEmail}}

Classify into one of these categories:
- billing: Payment issues, refunds, subscription questions
- technical: Bugs, errors, how-to questions, integrations
- account: Login issues, password reset, account settings
- feature: Feature requests, suggestions
- general: General inquiries, feedback

Also assess:
- Urgency: low, medium, high, critical
- Sentiment: positive, neutral, negative, angry
- Complexity: simple (FAQ), moderate, complex (needs human)

Output as JSON:
{
  "category": "technical",
  "subcategory": "integration",
  "urgency": "medium",
  "sentiment": "neutral",
  "complexity": "moderate",
  "keywords": ["api", "webhook", "error"],
  "summary": "Brief summary of the issue"
}`,
      tools: [],
      sub_agents: [],
      position: { x: 300, y: 200 },
    },
    'response_generator': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a helpful customer support agent. Generate a response to the customer's ticket using the knowledge base articles provided.

Ticket:
- Subject: {{ticket.subject}}
- Body: {{ticket.body}}
- Category: {{classification.category}}

Relevant Knowledge Base Articles:
{{kbArticles}}

Guidelines:
1. Be empathetic and acknowledge the customer's issue
2. Provide a clear, step-by-step solution if available
3. Reference specific KB articles when helpful
4. If you can't fully resolve, explain what you can help with
5. End with a clear next step or offer for further assistance

Output as JSON:
{
  "greeting": "Personalized greeting",
  "acknowledgment": "Acknowledge their issue",
  "solution": "Main response with solution/information",
  "nextSteps": ["Step 1", "Step 2"],
  "closing": "Friendly closing",
  "confidence": 0.85,
  "kbArticlesUsed": ["article-id-1", "article-id-2"],
  "needsHumanReview": false,
  "suggestedEscalationReason": null
}`,
      tools: [],
      sub_agents: [],
      position: { x: 700, y: 200 },
    },
  },
  actionNodes: {
    'ticket_webhook': {
      type: 'trigger',
      id: 'ticket_webhook',
      name: 'Support Ticket Webhook',
      description: 'Receive incoming support tickets',
      triggerType: 'webhook',
      webhook: {
        path: '/api/webhook/support-ticket',
        method: 'POST',
        auth: 'api_key',
        authConfig: {
          headerName: 'X-Support-Key',
          tokenEnvVar: 'SUPPORT_WEBHOOK_KEY',
        },
      },
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'ticket' },
    },
    'search_kb': {
      type: 'http',
      id: 'search_kb',
      name: 'Search Knowledge Base',
      description: 'Vector search for relevant articles',
      method: 'POST',
      url: 'https://{{PINECONE_INDEX}}-xxx.svc.pinecone.io/query',
      auth: {
        type: 'api_key',
        apiKey: { headerName: 'Api-Key', value: '{{PINECONE_API_KEY}}' },
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        type: 'json',
        content: `{
  "vector": "{{ticketEmbedding}}",
  "topK": 5,
  "includeMetadata": true,
  "filter": {
    "category": {"$eq": "{{classification.category}}"}
  }
}`,
      },
      response: { 
        type: 'json',
        jsonPath: '$.matches',
      },
      errorHandling: { mode: 'fallback', fallbackValue: [] },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { outputKey: 'kbArticles' },
    },
    'route_confidence': {
      type: 'switch',
      id: 'route_confidence',
      name: 'Route by Confidence',
      description: 'Route based on response confidence',
      evaluationMode: 'first_match',
      conditions: [
        { id: 'high_conf', name: 'High Confidence', field: 'response.confidence', operator: 'gte', value: 0.8, outputPort: 'auto_reply' },
        { id: 'med_conf', name: 'Medium Confidence', field: 'response.confidence', operator: 'gte', value: 0.5, outputPort: 'review' },
      ],
      defaultBranch: 'escalate',
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 5000 },
      mapping: { outputKey: 'routeResult' },
    },
    'send_auto_reply': {
      type: 'email',
      id: 'send_auto_reply',
      name: 'Send Auto Reply',
      description: 'Send automated response to customer',
      mode: 'send',
      smtp: {
        host: '{{SMTP_HOST}}',
        port: 587,
        secure: false,
        username: '{{SMTP_USER}}',
        password: '{{SMTP_PASS}}',
        fromEmail: 'support@company.com',
        fromName: 'Customer Support',
      },
      recipients: {
        to: '{{ticket.customerEmail}}',
      },
      content: {
        subject: 'Re: {{ticket.subject}}',
        bodyType: 'html',
        body: `<p>{{response.greeting}}</p>
<p>{{response.acknowledgment}}</p>
<p>{{response.solution}}</p>
<h4>Next Steps:</h4>
<ul>
{{#each response.nextSteps}}<li>{{this}}</li>{{/each}}
</ul>
<p>{{response.closing}}</p>
<hr>
<p style="color: #666; font-size: 12px;">Ticket ID: {{ticket.id}}</p>`,
      },
      errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 1000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'emailResult' },
    },
    'escalate_notification': {
      type: 'notification',
      id: 'escalate_notification',
      name: 'Escalate to Human',
      description: 'Notify support team for manual handling',
      channel: 'slack',
      webhookUrl: '{{SLACK_WEBHOOK_URL}}',
      message: {
        text: `🚨 *Support Ticket Escalation*\n\n*Ticket:* {{ticket.subject}}\n*Customer:* {{ticket.customerEmail}}\n*Category:* {{classification.category}}\n*Urgency:* {{classification.urgency}}\n*Sentiment:* {{classification.sentiment}}\n\n*Summary:* {{classification.summary}}\n\n*Reason:* {{response.suggestedEscalationReason || "Low confidence response"}}\n*AI Confidence:* {{response.confidence}}`,
        format: 'markdown',
      },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { outputKey: 'escalationResult' },
    },
  },
  edges: [
    { from: 'START', to: 'ticket_webhook' },
    { from: 'ticket_webhook', to: 'ticket_classifier' },
    { from: 'ticket_classifier', to: 'search_kb' },
    { from: 'search_kb', to: 'response_generator' },
    { from: 'response_generator', to: 'route_confidence' },
    { from: 'route_confidence', to: 'send_auto_reply', fromPort: 'auto_reply' },
    { from: 'route_confidence', to: 'send_auto_reply', fromPort: 'review' },
    { from: 'route_confidence', to: 'escalate_notification', fromPort: 'escalate' },
    { from: 'send_auto_reply', to: 'END' },
    { from: 'escalate_notification', to: 'END' },
  ],
};


/**
 * Template 5: Intelligent Data Analysis & Reporting
 * 
 * Workflow: Trigger (schedule) → Database (extract) → Transform (clean) 
 *           → LLM Agent (analyze) → LLM Agent (report) → File (save) → Email (distribute)
 * 
 * Use Case: Automatically generate weekly business intelligence reports by extracting
 * data from your database, analyzing trends with AI, and distributing reports.
 */
export const dataAnalysisTemplate: Template = {
  id: 'intelligent_data_analysis',
  name: 'Intelligent Data Analysis & Reporting',
  icon: '📊',
  description: 'Automated BI reports with AI-powered insights',
  category: 'automation',
  requiredNodeTypes: ['trigger', 'database', 'transform', 'file', 'email'],
  envVars: [
    { name: 'DATABASE_URL', description: 'Database connection string', required: true, example: 'postgresql://user:pass@host:5432/analytics' },
    { name: 'S3_BUCKET', description: 'S3 bucket for report storage', required: true, example: 'company-reports' },
    { name: 'AWS_ACCESS_KEY_ID', description: 'AWS access key', required: true },
    { name: 'AWS_SECRET_ACCESS_KEY', description: 'AWS secret key', required: true },
    { name: 'SMTP_HOST', description: 'SMTP server', required: true },
    { name: 'SMTP_USER', description: 'SMTP username', required: true },
    { name: 'SMTP_PASS', description: 'SMTP password', required: true },
  ],
  useCase: 'Run weekly automated reports that extract sales, user, and performance data from your database, use AI to identify trends and anomalies, generate executive summaries, and distribute to stakeholders.',
  customizationTips: [
    'Modify SQL queries for your specific metrics',
    'Adjust the analysis prompt for your business context',
    'Add visualizations using a charting library',
    'Create different report types for different audiences',
  ],
  agents: {
    'data_analyst': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a senior data analyst. Analyze the provided business data and identify key insights.

Data Summary:
{{dataSummary}}

Time Period: {{reportPeriod}}

Analyze:
1. Key Performance Indicators (KPIs) and their trends
2. Notable changes from previous period (week-over-week, month-over-month)
3. Anomalies or outliers that need attention
4. Correlations between different metrics
5. Potential causes for significant changes

Output as JSON:
{
  "kpis": [
    {"name": "Revenue", "value": 125000, "change": 12.5, "trend": "up"},
    {"name": "Active Users", "value": 5420, "change": -3.2, "trend": "down"}
  ],
  "insights": [
    {"type": "trend", "title": "Revenue Growth", "description": "...", "importance": "high"},
    {"type": "anomaly", "title": "Spike in Errors", "description": "...", "importance": "critical"}
  ],
  "correlations": [
    {"metrics": ["marketing_spend", "signups"], "correlation": 0.85, "insight": "..."}
  ],
  "recommendations": [
    {"action": "Investigate error spike", "priority": "high", "rationale": "..."}
  ]
}`,
      tools: [],
      sub_agents: [],
      position: { x: 500, y: 200 },
    },
    'report_writer': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a business report writer. Create an executive summary report from the analysis.

Analysis Results:
{{analysis}}

Report Period: {{reportPeriod}}

Create a professional report with:
1. Executive Summary (2-3 sentences)
2. Key Highlights (bullet points)
3. Detailed Findings (organized by category)
4. Recommendations
5. Next Steps

Format the report in clean HTML suitable for email and PDF.

Output as JSON:
{
  "title": "Weekly Business Intelligence Report",
  "subtitle": "Week of {{reportPeriod}}",
  "executiveSummary": "HTML content...",
  "highlights": ["Highlight 1", "Highlight 2"],
  "sections": [
    {"title": "Revenue Performance", "content": "HTML content..."},
    {"title": "User Metrics", "content": "HTML content..."}
  ],
  "recommendations": "HTML content...",
  "nextSteps": ["Step 1", "Step 2"],
  "generatedAt": "ISO timestamp"
}`,
      tools: [],
      sub_agents: [],
      position: { x: 700, y: 200 },
    },
  },
  actionNodes: {
    'weekly_schedule': {
      type: 'trigger',
      id: 'weekly_schedule',
      name: 'Weekly Report Schedule',
      description: 'Run every Monday at 6 AM',
      triggerType: 'schedule',
      schedule: {
        cron: '0 6 * * 1',
        timezone: 'America/New_York',
      },
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'scheduleData' },
    },
    'extract_sales_data': {
      type: 'database',
      id: 'extract_sales_data',
      name: 'Extract Sales Data',
      description: 'Query sales metrics from database',
      dbType: 'postgresql',
      connection: {
        connectionString: '{{DATABASE_URL}}',
        poolSize: 5,
      },
      sql: {
        operation: 'query',
        query: `WITH current_week AS (
  SELECT 
    DATE_TRUNC('week', NOW()) as week_start,
    DATE_TRUNC('week', NOW()) + INTERVAL '6 days' as week_end
),
metrics AS (
  SELECT
    COUNT(*) as total_orders,
    SUM(amount) as revenue,
    AVG(amount) as avg_order_value,
    COUNT(DISTINCT customer_id) as unique_customers
  FROM orders
  WHERE created_at >= (SELECT week_start FROM current_week)
    AND created_at <= (SELECT week_end FROM current_week)
),
previous_week AS (
  SELECT
    COUNT(*) as total_orders,
    SUM(amount) as revenue,
    AVG(amount) as avg_order_value,
    COUNT(DISTINCT customer_id) as unique_customers
  FROM orders
  WHERE created_at >= (SELECT week_start FROM current_week) - INTERVAL '7 days'
    AND created_at < (SELECT week_start FROM current_week)
)
SELECT 
  m.*,
  p.total_orders as prev_orders,
  p.revenue as prev_revenue,
  p.avg_order_value as prev_aov,
  p.unique_customers as prev_customers
FROM metrics m, previous_week p`,
      },
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 60000 },
      mapping: { outputKey: 'salesData' },
    },
    'extract_user_data': {
      type: 'database',
      id: 'extract_user_data',
      name: 'Extract User Metrics',
      description: 'Query user engagement data',
      dbType: 'postgresql',
      connection: {
        connectionString: '{{DATABASE_URL}}',
        poolSize: 5,
      },
      sql: {
        operation: 'query',
        query: `SELECT
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_signups,
  COUNT(*) FILTER (WHERE last_active >= NOW() - INTERVAL '7 days') as active_users,
  COUNT(*) FILTER (WHERE last_active < NOW() - INTERVAL '30 days') as churned_users,
  AVG(EXTRACT(EPOCH FROM (last_active - created_at))/86400) as avg_lifetime_days
FROM users`,
      },
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 60000 },
      mapping: { outputKey: 'userData' },
    },
    'transform_data': {
      type: 'transform',
      id: 'transform_data',
      name: 'Combine & Clean Data',
      description: 'Merge all data sources',
      transformType: 'javascript',
      expression: `const sales = input.salesData[0] || {};
const users = input.userData[0] || {};

return {
  reportPeriod: new Date().toISOString().split('T')[0],
  dataSummary: {
    sales: {
      revenue: sales.revenue || 0,
      orders: sales.total_orders || 0,
      avgOrderValue: sales.avg_order_value || 0,
      uniqueCustomers: sales.unique_customers || 0,
      revenueChange: sales.prev_revenue ? ((sales.revenue - sales.prev_revenue) / sales.prev_revenue * 100).toFixed(1) : 0
    },
    users: {
      newSignups: users.new_signups || 0,
      activeUsers: users.active_users || 0,
      churnedUsers: users.churned_users || 0,
      avgLifetimeDays: Math.round(users.avg_lifetime_days || 0)
    }
  }
};`,
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'debug' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { 
        inputMapping: { 'salesData': 'salesData', 'userData': 'userData' },
        outputKey: 'combinedData' 
      },
    },
    'save_report': {
      type: 'file',
      id: 'save_report',
      name: 'Save Report to S3',
      description: 'Store report in cloud storage',
      operation: 'write',
      cloud: {
        provider: 's3',
        bucket: '{{S3_BUCKET}}',
        key: 'reports/weekly/{{combinedData.reportPeriod}}-report.html',
        credentials: 'AWS_CREDENTIALS',
        region: 'us-east-1',
        presignedUrl: true,
        presignedExpiry: 604800,
      },
      write: {
        content: '{{reportHtml}}',
        createDirs: true,
      },
      errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 1000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'savedReport' },
    },
    'send_report': {
      type: 'email',
      id: 'send_report',
      name: 'Distribute Report',
      description: 'Email report to stakeholders',
      mode: 'send',
      smtp: {
        host: '{{SMTP_HOST}}',
        port: 587,
        secure: false,
        username: '{{SMTP_USER}}',
        password: '{{SMTP_PASS}}',
        fromEmail: 'reports@company.com',
        fromName: 'Business Intelligence',
      },
      recipients: {
        to: 'executives@company.com',
        cc: 'analytics-team@company.com',
      },
      content: {
        subject: '📊 Weekly Business Report - {{combinedData.reportPeriod}}',
        bodyType: 'html',
        body: `{{report.executiveSummary}}
<h3>Key Highlights</h3>
<ul>{{#each report.highlights}}<li>{{this}}</li>{{/each}}</ul>
<p><a href="{{savedReport.presignedUrl}}">View Full Report</a></p>`,
      },
      errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 2000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'emailResult' },
    },
  },
  edges: [
    { from: 'START', to: 'weekly_schedule' },
    { from: 'weekly_schedule', to: 'extract_sales_data' },
    { from: 'extract_sales_data', to: 'extract_user_data' },
    { from: 'extract_user_data', to: 'transform_data' },
    { from: 'transform_data', to: 'data_analyst' },
    { from: 'data_analyst', to: 'report_writer' },
    { from: 'report_writer', to: 'save_report' },
    { from: 'save_report', to: 'send_report' },
    { from: 'send_report', to: 'END' },
  ],
};


/**
 * Template 6: AI Invoice Processing
 * 
 * Workflow: Email (monitor) → Document Parser (OCR) → LLM Agent (categorize) 
 *           → Switch (approval) → Database (accounting) → Email (confirm)
 * 
 * Use Case: Automatically process incoming invoices from email, extract data using OCR,
 * categorize expenses, and route for approval based on amount thresholds.
 */
export const invoiceProcessingTemplate: Template = {
  id: 'ai_invoice_processing',
  name: 'AI Invoice Processing',
  icon: '🧾',
  description: 'Automated invoice extraction, categorization, and approval routing',
  category: 'automation',
  requiredNodeTypes: ['email', 'http', 'switch', 'database'],
  envVars: [
    { name: 'IMAP_HOST', description: 'IMAP server for invoice emails', required: true, example: 'imap.gmail.com' },
    { name: 'IMAP_USER', description: 'Email account username', required: true },
    { name: 'IMAP_PASS', description: 'Email account password/app password', required: true },
    { name: 'OCR_API_KEY', description: 'Document AI/OCR service API key', required: true },
    { name: 'DATABASE_URL', description: 'Accounting database connection', required: true },
    { name: 'SMTP_HOST', description: 'SMTP server for confirmations', required: true },
    { name: 'SMTP_USER', description: 'SMTP username', required: true },
    { name: 'SMTP_PASS', description: 'SMTP password', required: true },
  ],
  useCase: 'Monitor an invoices email inbox, automatically extract invoice data using OCR, use AI to categorize expenses and validate data, route high-value invoices for approval, and record in your accounting system.',
  customizationTips: [
    'Adjust approval thresholds for your organization',
    'Add integration with your accounting software (QuickBooks, Xero)',
    'Customize expense categories for your chart of accounts',
    'Add duplicate detection logic',
  ],
  agents: {
    'invoice_extractor': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are an invoice processing expert. Analyze the OCR-extracted text and structure the invoice data.

OCR Text:
{{ocrText}}

Extract and validate:
1. Vendor information (name, address, tax ID)
2. Invoice details (number, date, due date)
3. Line items (description, quantity, unit price, total)
4. Totals (subtotal, tax, total amount)
5. Payment terms and bank details

Also:
- Categorize the expense (office supplies, software, services, travel, etc.)
- Flag any potential issues (missing data, unusual amounts)
- Calculate confidence score for extraction accuracy

Output as JSON:
{
  "vendor": {
    "name": "Vendor Name",
    "address": "Full address",
    "taxId": "Tax ID if present",
    "email": "vendor@email.com"
  },
  "invoice": {
    "number": "INV-001",
    "date": "2024-01-15",
    "dueDate": "2024-02-15",
    "currency": "USD"
  },
  "lineItems": [
    {"description": "Item", "quantity": 1, "unitPrice": 100, "total": 100}
  ],
  "totals": {
    "subtotal": 100,
    "tax": 10,
    "total": 110
  },
  "category": "software",
  "paymentTerms": "Net 30",
  "bankDetails": "If present",
  "confidence": 0.95,
  "flags": ["Missing PO number"],
  "needsReview": false
}`,
      tools: [],
      sub_agents: [],
      position: { x: 500, y: 200 },
    },
  },
  actionNodes: {
    'monitor_inbox': {
      type: 'email',
      id: 'monitor_inbox',
      name: 'Monitor Invoice Inbox',
      description: 'Watch for incoming invoices',
      mode: 'monitor',
      imap: {
        host: '{{IMAP_HOST}}',
        port: 993,
        secure: true,
        username: '{{IMAP_USER}}',
        password: '{{IMAP_PASS}}',
        folder: 'INBOX',
        markAsRead: true,
      },
      filters: {
        subject: '*invoice*',
        unreadOnly: true,
      },
      errorHandling: { mode: 'retry', retryCount: 3, retryDelay: 60000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 60000 },
      mapping: { outputKey: 'incomingEmail' },
    },
    'extract_attachment': {
      type: 'transform',
      id: 'extract_attachment',
      name: 'Extract PDF Attachment',
      description: 'Get invoice PDF from email',
      transformType: 'javascript',
      expression: `const attachments = input.incomingEmail.attachments || [];
const pdfAttachment = attachments.find(a => 
  a.filename.toLowerCase().endsWith('.pdf') || 
  a.mimeType === 'application/pdf'
);
if (!pdfAttachment) {
  throw new Error('No PDF attachment found');
}
return {
  filename: pdfAttachment.filename,
  content: pdfAttachment.content,
  mimeType: pdfAttachment.mimeType,
  senderEmail: input.incomingEmail.from,
  receivedAt: input.incomingEmail.date
};`,
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'debug' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { 
        inputMapping: { 'incomingEmail': 'incomingEmail' },
        outputKey: 'pdfData' 
      },
    },
    'ocr_document': {
      type: 'http',
      id: 'ocr_document',
      name: 'OCR Invoice',
      description: 'Extract text from PDF using Document AI',
      method: 'POST',
      url: 'https://documentai.googleapis.com/v1/projects/{{PROJECT_ID}}/locations/us/processors/{{PROCESSOR_ID}}:process',
      auth: {
        type: 'bearer',
        bearer: { token: '{{OCR_API_KEY}}' },
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        type: 'json',
        content: `{
  "rawDocument": {
    "content": "{{pdfData.content}}",
    "mimeType": "application/pdf"
  }
}`,
      },
      response: { 
        type: 'json',
        jsonPath: '$.document.text',
      },
      errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 2000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 60000 },
      mapping: { outputKey: 'ocrText' },
    },
    'route_approval': {
      type: 'switch',
      id: 'route_approval',
      name: 'Route for Approval',
      description: 'Route based on invoice amount',
      evaluationMode: 'first_match',
      conditions: [
        { id: 'high_value', name: 'High Value (>$5000)', field: 'invoiceData.totals.total', operator: 'gt', value: 5000, outputPort: 'manager_approval' },
        { id: 'medium_value', name: 'Medium Value (>$1000)', field: 'invoiceData.totals.total', operator: 'gt', value: 1000, outputPort: 'team_lead_approval' },
        { id: 'needs_review', name: 'Needs Review', field: 'invoiceData.needsReview', operator: 'eq', value: true, outputPort: 'manual_review' },
      ],
      defaultBranch: 'auto_approve',
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 5000 },
      mapping: { outputKey: 'approvalRoute' },
    },
    'save_to_accounting': {
      type: 'database',
      id: 'save_to_accounting',
      name: 'Save to Accounting',
      description: 'Record invoice in database',
      dbType: 'postgresql',
      connection: {
        connectionString: '{{DATABASE_URL}}',
        poolSize: 5,
      },
      sql: {
        operation: 'insert',
        query: `INSERT INTO invoices (
          vendor_name, vendor_email, invoice_number, invoice_date, due_date,
          subtotal, tax, total, currency, category, status, 
          line_items, raw_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        RETURNING id`,
        params: {
          '$1': '{{invoiceData.vendor.name}}',
          '$2': '{{invoiceData.vendor.email}}',
          '$3': '{{invoiceData.invoice.number}}',
          '$4': '{{invoiceData.invoice.date}}',
          '$5': '{{invoiceData.invoice.dueDate}}',
          '$6': '{{invoiceData.totals.subtotal}}',
          '$7': '{{invoiceData.totals.tax}}',
          '$8': '{{invoiceData.totals.total}}',
          '$9': '{{invoiceData.invoice.currency}}',
          '$10': '{{invoiceData.category}}',
          '$11': '{{approvalRoute}}',
          '$12': '{{invoiceData.lineItems}}',
          '$13': '{{invoiceData}}',
        },
      },
      errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 1000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 15000 },
      mapping: { outputKey: 'savedInvoice' },
    },
    'send_confirmation': {
      type: 'email',
      id: 'send_confirmation',
      name: 'Send Confirmation',
      description: 'Confirm invoice receipt to vendor',
      mode: 'send',
      smtp: {
        host: '{{SMTP_HOST}}',
        port: 587,
        secure: false,
        username: '{{SMTP_USER}}',
        password: '{{SMTP_PASS}}',
        fromEmail: 'ap@company.com',
        fromName: 'Accounts Payable',
      },
      recipients: {
        to: '{{invoiceData.vendor.email}}',
      },
      content: {
        subject: 'Invoice {{invoiceData.invoice.number}} Received',
        bodyType: 'html',
        body: `<p>Dear {{invoiceData.vendor.name}},</p>
<p>We have received your invoice <strong>{{invoiceData.invoice.number}}</strong> dated {{invoiceData.invoice.date}}.</p>
<p><strong>Amount:</strong> {{invoiceData.invoice.currency}} {{invoiceData.totals.total}}</p>
<p><strong>Due Date:</strong> {{invoiceData.invoice.dueDate}}</p>
<p><strong>Status:</strong> {{approvalRoute}}</p>
<p>You will receive payment confirmation once processed.</p>
<p>Best regards,<br>Accounts Payable Team</p>`,
      },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'confirmationSent' },
    },
  },
  edges: [
    { from: 'START', to: 'monitor_inbox' },
    { from: 'monitor_inbox', to: 'extract_attachment' },
    { from: 'extract_attachment', to: 'ocr_document' },
    { from: 'ocr_document', to: 'invoice_extractor' },
    { from: 'invoice_extractor', to: 'route_approval' },
    { from: 'route_approval', to: 'save_to_accounting', fromPort: 'auto_approve' },
    { from: 'route_approval', to: 'save_to_accounting', fromPort: 'team_lead_approval' },
    { from: 'route_approval', to: 'save_to_accounting', fromPort: 'manager_approval' },
    { from: 'route_approval', to: 'save_to_accounting', fromPort: 'manual_review' },
    { from: 'save_to_accounting', to: 'send_confirmation' },
    { from: 'send_confirmation', to: 'END' },
  ],
};


/**
 * Template 7: AI Job Application Bot
 * 
 * Workflow: RSS (job postings) → LLM Agent (analyze) → LLM Agent (match score) 
 *           → Switch (filter) → LLM Agent (proposal) → HTTP (submit) → Database (track)
 * 
 * Use Case: Monitor job boards for relevant positions, analyze requirements,
 * score match against your profile, and generate tailored applications.
 */
export const jobApplicationBotTemplate: Template = {
  id: 'ai_job_application_bot',
  name: 'AI Job Application Bot',
  icon: '💼',
  description: 'Automated job hunting with AI-powered applications',
  category: 'automation',
  requiredNodeTypes: ['rss', 'switch', 'http', 'database'],
  envVars: [
    { name: 'DATABASE_URL', description: 'Database for tracking applications', required: true },
    { name: 'LINKEDIN_API_KEY', description: 'LinkedIn API key (optional)', required: false },
    { name: 'RESUME_URL', description: 'URL to your resume PDF', required: true },
  ],
  useCase: 'Automatically monitor job boards and RSS feeds for relevant positions, use AI to analyze job requirements and score match against your profile, generate tailored cover letters, and track all applications.',
  customizationTips: [
    'Update your profile data in the Set node',
    'Adjust match score thresholds for your preferences',
    'Customize cover letter tone and style',
    'Add more job board RSS feeds',
  ],
  agents: {
    'job_analyzer': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a job posting analyst. Analyze the job posting and extract key information.

Job Posting:
{{jobPosting}}

Extract:
1. Job title and level (junior, mid, senior, lead)
2. Company information
3. Required skills (must-have vs nice-to-have)
4. Experience requirements
5. Location and remote policy
6. Salary range if mentioned
7. Key responsibilities
8. Red flags or concerns

Output as JSON:
{
  "title": "Job Title",
  "level": "senior",
  "company": {
    "name": "Company Name",
    "industry": "Tech",
    "size": "startup|mid|enterprise"
  },
  "skills": {
    "required": ["skill1", "skill2"],
    "preferred": ["skill3", "skill4"]
  },
  "experience": {
    "years": 5,
    "type": "relevant field experience"
  },
  "location": {
    "type": "remote|hybrid|onsite",
    "city": "City if applicable"
  },
  "salary": {
    "min": 100000,
    "max": 150000,
    "currency": "USD"
  },
  "responsibilities": ["resp1", "resp2"],
  "redFlags": [],
  "applicationUrl": "URL to apply",
  "deadline": "if mentioned"
}`,
      tools: [],
      sub_agents: [],
      position: { x: 300, y: 200 },
    },
    'match_scorer': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a job match evaluator. Score how well the candidate matches the job requirements.

Job Analysis:
{{jobAnalysis}}

Candidate Profile:
{{candidateProfile}}

Evaluate match on:
1. Skills match (required and preferred)
2. Experience level alignment
3. Industry/domain fit
4. Location compatibility
5. Salary expectations alignment
6. Career trajectory fit

Calculate scores (0-100) for each category and overall.

Output as JSON:
{
  "overallScore": 85,
  "breakdown": {
    "skills": {"score": 90, "matched": ["skill1"], "missing": ["skill2"]},
    "experience": {"score": 80, "notes": "Slightly under required years"},
    "industry": {"score": 95, "notes": "Strong domain match"},
    "location": {"score": 100, "notes": "Remote compatible"},
    "salary": {"score": 75, "notes": "At lower end of range"},
    "trajectory": {"score": 85, "notes": "Good growth opportunity"}
  },
  "recommendation": "strong_apply|apply|maybe|skip",
  "strengths": ["strength1", "strength2"],
  "gaps": ["gap1"],
  "talkingPoints": ["point1", "point2"]
}`,
      tools: [],
      sub_agents: [],
      position: { x: 500, y: 200 },
    },
    'proposal_writer': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are an expert cover letter writer. Create a compelling, personalized cover letter.

Job Analysis:
{{jobAnalysis}}

Match Analysis:
{{matchAnalysis}}

Candidate Profile:
{{candidateProfile}}

Write a cover letter that:
1. Opens with a compelling hook related to the company/role
2. Highlights 2-3 most relevant experiences
3. Addresses any potential gaps proactively
4. Shows genuine interest in the company
5. Ends with a clear call to action
6. Keeps it under 400 words

Output as JSON:
{
  "subject": "Application for [Position] - [Your Name]",
  "greeting": "Dear Hiring Manager,",
  "opening": "Opening paragraph...",
  "body": "Main content paragraphs...",
  "closing": "Closing paragraph...",
  "signature": "Best regards,\\n[Name]",
  "fullText": "Complete cover letter text",
  "wordCount": 350,
  "customizations": ["Mentioned specific project", "Referenced company value"]
}`,
      tools: [],
      sub_agents: [],
      position: { x: 700, y: 200 },
    },
  },
  actionNodes: {
    'job_feed': {
      type: 'rss',
      id: 'job_feed',
      name: 'Job Board RSS',
      description: 'Monitor job postings',
      feedUrl: 'https://stackoverflow.com/jobs/feed?q=senior+engineer&r=true',
      pollInterval: 3600000,
      filters: {
        keywords: ['senior', 'engineer', 'developer'],
      },
      seenTracking: {
        enabled: true,
        stateKey: 'seenJobs',
        maxItems: 500,
      },
      maxEntries: 10,
      includeContent: true,
      parseMedia: false,
      errorHandling: { mode: 'retry', retryCount: 3, retryDelay: 60000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'jobPostings' },
    },
    'set_profile': {
      type: 'set',
      id: 'set_profile',
      name: 'Set Candidate Profile',
      description: 'Configure your profile data',
      mode: 'set',
      variables: [
        { 
          key: 'candidateProfile', 
          value: {
            name: 'Your Name',
            title: 'Senior Software Engineer',
            yearsExperience: 7,
            skills: ['TypeScript', 'React', 'Node.js', 'Python', 'AWS', 'PostgreSQL'],
            industries: ['SaaS', 'FinTech', 'E-commerce'],
            preferredLocation: 'remote',
            salaryExpectation: { min: 150000, max: 200000, currency: 'USD' },
            highlights: [
              'Led team of 5 engineers on $2M project',
              'Reduced API latency by 60%',
              'Built ML pipeline processing 1M events/day'
            ]
          }, 
          valueType: 'json', 
          isSecret: false 
        },
      ],
      errorHandling: { mode: 'stop' },
      tracing: { enabled: false, logLevel: 'none' },
      callbacks: {},
      execution: { timeout: 5000 },
      mapping: { outputKey: 'profile' },
    },
    'loop_jobs': {
      type: 'loop',
      id: 'loop_jobs',
      name: 'Process Each Job',
      description: 'Analyze each job posting',
      loopType: 'forEach',
      forEach: {
        sourceArray: 'jobPostings',
        itemVar: 'jobPosting',
        indexVar: 'jobIdx',
      },
      parallel: {
        enabled: false,
      },
      results: {
        collect: true,
        aggregationKey: 'processedJobs',
      },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 300000 },
      mapping: { outputKey: 'loopResults' },
    },
    'filter_match': {
      type: 'switch',
      id: 'filter_match',
      name: 'Filter by Match Score',
      description: 'Only apply to good matches',
      evaluationMode: 'first_match',
      conditions: [
        { id: 'strong', name: 'Strong Match (80+)', field: 'matchAnalysis.overallScore', operator: 'gte', value: 80, outputPort: 'apply' },
        { id: 'good', name: 'Good Match (60+)', field: 'matchAnalysis.overallScore', operator: 'gte', value: 60, outputPort: 'maybe' },
      ],
      defaultBranch: 'skip',
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 5000 },
      mapping: { outputKey: 'filterResult' },
    },
    'track_application': {
      type: 'database',
      id: 'track_application',
      name: 'Track Application',
      description: 'Save application to database',
      dbType: 'postgresql',
      connection: {
        connectionString: '{{DATABASE_URL}}',
        poolSize: 5,
      },
      sql: {
        operation: 'insert',
        query: `INSERT INTO job_applications (
          job_title, company, job_url, match_score, 
          status, cover_letter, applied_at, job_data, match_data
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)
        RETURNING id`,
        params: {
          '$1': '{{jobAnalysis.title}}',
          '$2': '{{jobAnalysis.company.name}}',
          '$3': '{{jobAnalysis.applicationUrl}}',
          '$4': '{{matchAnalysis.overallScore}}',
          '$5': '{{filterResult}}',
          '$6': '{{coverLetter.fullText}}',
          '$7': '{{jobAnalysis}}',
          '$8': '{{matchAnalysis}}',
        },
      },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 15000 },
      mapping: { outputKey: 'trackedApplication' },
    },
  },
  edges: [
    { from: 'START', to: 'job_feed' },
    { from: 'job_feed', to: 'set_profile' },
    { from: 'set_profile', to: 'loop_jobs' },
    { from: 'loop_jobs', to: 'job_analyzer' },
    { from: 'job_analyzer', to: 'match_scorer' },
    { from: 'match_scorer', to: 'filter_match' },
    { from: 'filter_match', to: 'proposal_writer', fromPort: 'apply' },
    { from: 'filter_match', to: 'track_application', fromPort: 'maybe' },
    { from: 'filter_match', to: 'track_application', fromPort: 'skip' },
    { from: 'proposal_writer', to: 'track_application' },
    { from: 'track_application', to: 'END' },
  ],
};


/**
 * Template 8: AI Newsletter Digest Creator
 * 
 * Workflow: Email (fetch) → Loop (newsletters) → LLM Agent (summarize) 
 *           → Transform (cluster) → LLM Agent (digest) → Email (send)
 * 
 * Use Case: Automatically collect newsletters from your inbox, summarize each one,
 * cluster by topic, and create a single digest email with all the highlights.
 */
export const newsletterDigestTemplate: Template = {
  id: 'ai_newsletter_digest',
  name: 'AI Newsletter Digest Creator',
  icon: '📰',
  description: 'Consolidate multiple newsletters into one AI-curated digest',
  category: 'automation',
  requiredNodeTypes: ['email', 'loop', 'transform'],
  envVars: [
    { name: 'IMAP_HOST', description: 'IMAP server', required: true, example: 'imap.gmail.com' },
    { name: 'IMAP_USER', description: 'Email username', required: true },
    { name: 'IMAP_PASS', description: 'Email password', required: true },
    { name: 'SMTP_HOST', description: 'SMTP server', required: true },
    { name: 'SMTP_USER', description: 'SMTP username', required: true },
    { name: 'SMTP_PASS', description: 'SMTP password', required: true },
    { name: 'DIGEST_RECIPIENT', description: 'Email to send digest to', required: true },
  ],
  useCase: 'Tired of reading 20+ newsletters? This workflow fetches all newsletters from the past week, uses AI to summarize each one, groups them by topic, and sends you a single curated digest with the most important insights.',
  customizationTips: [
    'Adjust the email filter to match your newsletter senders',
    'Customize the digest format and sections',
    'Add priority scoring for different newsletters',
    'Include links to original newsletters',
  ],
  agents: {
    'newsletter_summarizer': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a newsletter summarization expert. Create a concise summary of the newsletter.

Newsletter:
- From: {{newsletter.from}}
- Subject: {{newsletter.subject}}
- Content: {{newsletter.body}}

Create a summary that:
1. Captures the 2-3 most important points
2. Identifies any actionable insights
3. Notes any time-sensitive information
4. Extracts key links or resources mentioned

Output as JSON:
{
  "source": "Newsletter Name",
  "subject": "Original subject",
  "summary": "2-3 sentence summary",
  "keyPoints": [
    {"point": "Key insight 1", "importance": "high|medium|low"},
    {"point": "Key insight 2", "importance": "high|medium|low"}
  ],
  "actionItems": ["Action 1 if any"],
  "links": [{"title": "Link title", "url": "URL"}],
  "topics": ["topic1", "topic2"],
  "timeSensitive": false,
  "readTime": "2 min"
}`,
      tools: [],
      sub_agents: [],
      position: { x: 400, y: 200 },
    },
    'digest_creator': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a content curator. Create a weekly digest from the newsletter summaries.

Summaries by Topic:
{{groupedSummaries}}

Date Range: {{dateRange}}

Create a digest that:
1. Opens with a brief overview of the week's themes
2. Groups content by topic with clear headers
3. Highlights the most important insights across all newsletters
4. Includes a "Quick Hits" section for minor updates
5. Ends with recommended reading priorities

Format as a clean, scannable email.

Output as JSON:
{
  "title": "Your Weekly Digest - {{dateRange}}",
  "overview": "This week's key themes...",
  "sections": [
    {
      "topic": "AI & Technology",
      "highlights": ["highlight1", "highlight2"],
      "sources": ["Newsletter 1", "Newsletter 2"]
    }
  ],
  "quickHits": ["Quick update 1", "Quick update 2"],
  "mustRead": [
    {"title": "Article title", "source": "Newsletter", "reason": "Why it's important"}
  ],
  "htmlContent": "Full HTML email content"
}`,
      tools: [],
      sub_agents: [],
      position: { x: 700, y: 200 },
    },
  },
  actionNodes: {
    'fetch_newsletters': {
      type: 'email',
      id: 'fetch_newsletters',
      name: 'Fetch Newsletters',
      description: 'Get newsletters from past week',
      mode: 'monitor',
      imap: {
        host: '{{IMAP_HOST}}',
        port: 993,
        secure: true,
        username: '{{IMAP_USER}}',
        password: '{{IMAP_PASS}}',
        folder: 'Newsletters',
        markAsRead: false,
      },
      filters: {
        dateFrom: '{{sevenDaysAgo}}',
        unreadOnly: false,
      },
      errorHandling: { mode: 'retry', retryCount: 3, retryDelay: 5000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 60000 },
      mapping: { outputKey: 'newsletters' },
    },
    'set_date_range': {
      type: 'set',
      id: 'set_date_range',
      name: 'Set Date Range',
      description: 'Configure digest date range',
      mode: 'set',
      variables: [
        { 
          key: 'dateRange', 
          value: `${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} - ${new Date().toLocaleDateString()}`, 
          valueType: 'expression', 
          isSecret: false 
        },
        { 
          key: 'sevenDaysAgo', 
          value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), 
          valueType: 'expression', 
          isSecret: false 
        },
      ],
      errorHandling: { mode: 'stop' },
      tracing: { enabled: false, logLevel: 'none' },
      callbacks: {},
      execution: { timeout: 5000 },
      mapping: { outputKey: 'dateConfig' },
    },
    'process_newsletters': {
      type: 'loop',
      id: 'process_newsletters',
      name: 'Process Each Newsletter',
      description: 'Summarize each newsletter',
      loopType: 'forEach',
      forEach: {
        sourceArray: 'newsletters',
        itemVar: 'newsletter',
        indexVar: 'idx',
      },
      parallel: {
        enabled: true,
        batchSize: 5,
      },
      results: {
        collect: true,
        aggregationKey: 'summaries',
      },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 180000 },
      mapping: { outputKey: 'loopResults' },
    },
    'group_by_topic': {
      type: 'transform',
      id: 'group_by_topic',
      name: 'Group by Topic',
      description: 'Cluster summaries by topic',
      transformType: 'javascript',
      expression: `const summaries = input.summaries || [];
const grouped = {};

summaries.forEach(summary => {
  (summary.topics || ['General']).forEach(topic => {
    if (!grouped[topic]) {
      grouped[topic] = [];
    }
    grouped[topic].push(summary);
  });
});

// Sort topics by number of items
const sortedTopics = Object.entries(grouped)
  .sort((a, b) => b[1].length - a[1].length)
  .reduce((acc, [topic, items]) => {
    acc[topic] = items;
    return acc;
  }, {});

return {
  groupedSummaries: sortedTopics,
  totalNewsletters: summaries.length,
  topicCount: Object.keys(sortedTopics).length
};`,
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'debug' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { 
        inputMapping: { 'summaries': 'summaries' },
        outputKey: 'clusteredData' 
      },
    },
    'send_digest': {
      type: 'email',
      id: 'send_digest',
      name: 'Send Digest',
      description: 'Email the curated digest',
      mode: 'send',
      smtp: {
        host: '{{SMTP_HOST}}',
        port: 587,
        secure: false,
        username: '{{SMTP_USER}}',
        password: '{{SMTP_PASS}}',
        fromEmail: 'digest@yourdomain.com',
        fromName: 'Newsletter Digest',
      },
      recipients: {
        to: '{{DIGEST_RECIPIENT}}',
      },
      content: {
        subject: '📰 {{digest.title}}',
        bodyType: 'html',
        body: '{{digest.htmlContent}}',
      },
      errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 2000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'digestSent' },
    },
  },
  edges: [
    { from: 'START', to: 'set_date_range' },
    { from: 'set_date_range', to: 'fetch_newsletters' },
    { from: 'fetch_newsletters', to: 'process_newsletters' },
    { from: 'process_newsletters', to: 'newsletter_summarizer' },
    { from: 'newsletter_summarizer', to: 'group_by_topic' },
    { from: 'group_by_topic', to: 'digest_creator' },
    { from: 'digest_creator', to: 'send_digest' },
    { from: 'send_digest', to: 'END' },
  ],
};


/**
 * Template 9: E-commerce AI Order Intelligence
 * 
 * Workflow: Trigger (webhook) → LLM Agent (fraud check) → Database (inventory) 
 *           → HTTP (shipping) → LLM Agent (personalize) → Email/Notification
 * 
 * Use Case: Process incoming orders with AI-powered fraud detection, inventory checks,
 * shipping coordination, and personalized customer communications.
 */
export const ecommerceOrderTemplate: Template = {
  id: 'ecommerce_order_intelligence',
  name: 'E-commerce AI Order Intelligence',
  icon: '🛒',
  description: 'Smart order processing with fraud detection and personalization',
  category: 'automation',
  requiredNodeTypes: ['trigger', 'database', 'http', 'email', 'notification', 'switch'],
  envVars: [
    { name: 'DATABASE_URL', description: 'E-commerce database connection', required: true },
    { name: 'SHIPPING_API_KEY', description: 'Shipping provider API key', required: true },
    { name: 'SMTP_HOST', description: 'SMTP server', required: true },
    { name: 'SMTP_USER', description: 'SMTP username', required: true },
    { name: 'SMTP_PASS', description: 'SMTP password', required: true },
    { name: 'SLACK_WEBHOOK_URL', description: 'Slack webhook for alerts', required: true },
  ],
  useCase: 'Automatically process new orders with AI fraud detection, check inventory availability, create shipping labels, generate personalized order confirmations, and alert the team to any issues.',
  customizationTips: [
    'Adjust fraud detection thresholds for your risk tolerance',
    'Integrate with your specific shipping provider',
    'Customize email templates for your brand',
    'Add upsell recommendations based on order contents',
  ],
  agents: {
    'fraud_detector': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a fraud detection expert. Analyze the order for potential fraud indicators.

Order Data:
{{order}}

Customer History:
{{customerHistory}}

Analyze for:
1. Unusual order patterns (high value, unusual items)
2. Shipping/billing address mismatches
3. New customer with high-value order
4. Multiple failed payment attempts
5. Velocity checks (many orders in short time)
6. Known fraud patterns

Output as JSON:
{
  "riskScore": 25,
  "riskLevel": "low|medium|high|critical",
  "flags": [
    {"type": "address_mismatch", "severity": "medium", "details": "..."}
  ],
  "recommendation": "approve|review|reject",
  "confidence": 0.92,
  "reasoning": "Brief explanation",
  "suggestedActions": ["Verify phone number", "Request ID"]
}`,
      tools: [],
      sub_agents: [],
      position: { x: 300, y: 200 },
    },
    'message_personalizer': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a customer communication expert. Create a personalized order confirmation.

Order Details:
{{order}}

Customer Profile:
{{customer}}

Shipping Info:
{{shipping}}

Create a warm, personalized message that:
1. Thanks them by name
2. Confirms their order details
3. Provides shipping timeline
4. Suggests complementary products based on their order
5. Includes any loyalty rewards earned

Output as JSON:
{
  "subject": "Thanks {{customer.firstName}}! Your order #{{order.id}} is confirmed 🎉",
  "greeting": "Personalized greeting",
  "orderSummary": "HTML formatted order summary",
  "shippingInfo": "Shipping details and timeline",
  "recommendations": [
    {"product": "Product name", "reason": "Why they might like it", "url": "..."}
  ],
  "loyaltyMessage": "Points earned or tier status",
  "closing": "Warm closing message",
  "htmlEmail": "Complete HTML email"
}`,
      tools: [],
      sub_agents: [],
      position: { x: 700, y: 200 },
    },
  },
  actionNodes: {
    'order_webhook': {
      type: 'trigger',
      id: 'order_webhook',
      name: 'New Order Webhook',
      description: 'Receive new orders from storefront',
      triggerType: 'webhook',
      webhook: {
        path: '/api/webhook/orders',
        method: 'POST',
        auth: 'api_key',
        authConfig: {
          headerName: 'X-Shop-Webhook-Key',
          tokenEnvVar: 'SHOP_WEBHOOK_KEY',
        },
      },
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'order' },
    },
    'get_customer_history': {
      type: 'database',
      id: 'get_customer_history',
      name: 'Get Customer History',
      description: 'Fetch customer order history',
      dbType: 'postgresql',
      connection: {
        connectionString: '{{DATABASE_URL}}',
        poolSize: 5,
      },
      sql: {
        operation: 'query',
        query: `SELECT 
          c.*,
          COUNT(o.id) as total_orders,
          SUM(o.total) as lifetime_value,
          MAX(o.created_at) as last_order_date,
          AVG(o.total) as avg_order_value
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
        WHERE c.email = $1
        GROUP BY c.id`,
        params: { '$1': '{{order.customer.email}}' },
      },
      errorHandling: { mode: 'fallback', fallbackValue: { newCustomer: true } },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { outputKey: 'customerHistory' },
    },
    'route_fraud': {
      type: 'switch',
      id: 'route_fraud',
      name: 'Route by Fraud Risk',
      description: 'Route based on fraud assessment',
      evaluationMode: 'first_match',
      conditions: [
        { id: 'reject', name: 'Reject Order', field: 'fraudCheck.recommendation', operator: 'eq', value: 'reject', outputPort: 'reject' },
        { id: 'review', name: 'Manual Review', field: 'fraudCheck.recommendation', operator: 'eq', value: 'review', outputPort: 'review' },
      ],
      defaultBranch: 'approve',
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 5000 },
      mapping: { outputKey: 'fraudRoute' },
    },
    'check_inventory': {
      type: 'database',
      id: 'check_inventory',
      name: 'Check Inventory',
      description: 'Verify stock availability',
      dbType: 'postgresql',
      connection: {
        connectionString: '{{DATABASE_URL}}',
        poolSize: 5,
      },
      sql: {
        operation: 'query',
        query: `SELECT 
          p.id, p.sku, p.name, 
          i.quantity as available,
          $2::int as requested,
          CASE WHEN i.quantity >= $2::int THEN true ELSE false END as in_stock
        FROM products p
        JOIN inventory i ON i.product_id = p.id
        WHERE p.id = ANY($1::int[])`,
        params: { 
          '$1': '{{order.items.map(i => i.productId)}}',
          '$2': '{{order.items[0].quantity}}'
        },
      },
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { outputKey: 'inventoryCheck' },
    },
    'create_shipment': {
      type: 'http',
      id: 'create_shipment',
      name: 'Create Shipment',
      description: 'Generate shipping label',
      method: 'POST',
      url: 'https://api.shippo.com/shipments',
      auth: {
        type: 'bearer',
        bearer: { token: '{{SHIPPING_API_KEY}}' },
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        type: 'json',
        content: `{
  "address_from": {
    "name": "{{WAREHOUSE_NAME}}",
    "street1": "{{WAREHOUSE_ADDRESS}}",
    "city": "{{WAREHOUSE_CITY}}",
    "state": "{{WAREHOUSE_STATE}}",
    "zip": "{{WAREHOUSE_ZIP}}",
    "country": "US"
  },
  "address_to": {
    "name": "{{order.shipping.name}}",
    "street1": "{{order.shipping.address1}}",
    "city": "{{order.shipping.city}}",
    "state": "{{order.shipping.state}}",
    "zip": "{{order.shipping.zip}}",
    "country": "{{order.shipping.country}}"
  },
  "parcels": [{
    "length": "10",
    "width": "8",
    "height": "4",
    "distance_unit": "in",
    "weight": "{{order.totalWeight}}",
    "mass_unit": "lb"
  }]
}`,
      },
      response: { type: 'json' },
      errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 2000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'shipping' },
    },
    'update_order': {
      type: 'database',
      id: 'update_order',
      name: 'Update Order Status',
      description: 'Save order with shipping info',
      dbType: 'postgresql',
      connection: {
        connectionString: '{{DATABASE_URL}}',
        poolSize: 5,
      },
      sql: {
        operation: 'update',
        query: `UPDATE orders SET 
          status = 'processing',
          fraud_score = $2,
          tracking_number = $3,
          shipping_label_url = $4,
          updated_at = NOW()
        WHERE id = $1`,
        params: {
          '$1': '{{order.id}}',
          '$2': '{{fraudCheck.riskScore}}',
          '$3': '{{shipping.tracking_number}}',
          '$4': '{{shipping.label_url}}',
        },
      },
      errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 1000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { outputKey: 'orderUpdated' },
    },
    'send_confirmation': {
      type: 'email',
      id: 'send_confirmation',
      name: 'Send Order Confirmation',
      description: 'Email personalized confirmation',
      mode: 'send',
      smtp: {
        host: '{{SMTP_HOST}}',
        port: 587,
        secure: false,
        username: '{{SMTP_USER}}',
        password: '{{SMTP_PASS}}',
        fromEmail: 'orders@store.com',
        fromName: 'Your Store',
      },
      recipients: {
        to: '{{order.customer.email}}',
      },
      content: {
        subject: '{{personalizedMessage.subject}}',
        bodyType: 'html',
        body: '{{personalizedMessage.htmlEmail}}',
      },
      errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 2000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'confirmationSent' },
    },
    'alert_fraud': {
      type: 'notification',
      id: 'alert_fraud',
      name: 'Alert Fraud Team',
      description: 'Notify team of suspicious order',
      channel: 'slack',
      webhookUrl: '{{SLACK_WEBHOOK_URL}}',
      message: {
        text: '🚨 *Fraud Alert - Order #{{order.id}}*\n\n*Risk Score:* {{fraudCheck.riskScore}}/100\n*Risk Level:* {{fraudCheck.riskLevel}}\n*Customer:* {{order.customer.email}}\n*Order Total:* ${{order.total}}\n\n*Flags:*\n{{#each fraudCheck.flags}}- {{flag.type}}: {{flag.details}}\n{{/each}}\n\n*Recommendation:* {{fraudCheck.recommendation}}\n*Reasoning:* {{fraudCheck.reasoning}}',
        format: 'markdown',
      },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { outputKey: 'fraudAlert' },
    },
  },
  edges: [
    { from: 'START', to: 'order_webhook' },
    { from: 'order_webhook', to: 'get_customer_history' },
    { from: 'get_customer_history', to: 'fraud_detector' },
    { from: 'fraud_detector', to: 'route_fraud' },
    { from: 'route_fraud', to: 'check_inventory', fromPort: 'approve' },
    { from: 'route_fraud', to: 'alert_fraud', fromPort: 'review' },
    { from: 'route_fraud', to: 'alert_fraud', fromPort: 'reject' },
    { from: 'check_inventory', to: 'create_shipment' },
    { from: 'create_shipment', to: 'update_order' },
    { from: 'update_order', to: 'message_personalizer' },
    { from: 'message_personalizer', to: 'send_confirmation' },
    { from: 'send_confirmation', to: 'END' },
    { from: 'alert_fraud', to: 'END' },
  ],
};


/**
 * Template 10: AI-Powered Incident Response
 * 
 * Workflow: Trigger (webhook) → LLM Agent (analyze logs) → Vector Search (past incidents) 
 *           → LLM Agent (summary) → Switch (severity) → Notification (PagerDuty) → LLM Agent (runbook)
 * 
 * Use Case: Automatically analyze incoming alerts, correlate with past incidents,
 * generate summaries, and route to appropriate responders with AI-generated runbooks.
 */
export const incidentResponseTemplate: Template = {
  id: 'ai_incident_response',
  name: 'AI-Powered Incident Response',
  icon: '🚨',
  description: 'Intelligent alert analysis with automated runbook generation',
  category: 'automation',
  requiredNodeTypes: ['trigger', 'http', 'switch', 'notification'],
  envVars: [
    { name: 'PAGERDUTY_API_KEY', description: 'PagerDuty API key', required: true },
    { name: 'PAGERDUTY_SERVICE_ID', description: 'PagerDuty service ID', required: true },
    { name: 'PINECONE_API_KEY', description: 'Pinecone API key for incident history', required: true },
    { name: 'PINECONE_INDEX', description: 'Pinecone index name', required: true },
    { name: 'SLACK_WEBHOOK_URL', description: 'Slack webhook for incident channel', required: true },
  ],
  useCase: 'Receive alerts from monitoring systems, use AI to analyze logs and identify root causes, search past incidents for similar issues, generate incident summaries and runbooks, and route to the right team based on severity.',
  customizationTips: [
    'Integrate with your monitoring stack (Datadog, New Relic, etc.)',
    'Customize severity thresholds for your SLAs',
    'Add your own runbook templates',
    'Connect to your incident management system',
  ],
  agents: {
    'log_analyzer': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a senior SRE analyzing an incident. Examine the alert and logs to identify the issue.

Alert Data:
{{alert}}

Recent Logs:
{{logs}}

Metrics:
{{metrics}}

Analyze:
1. What is the immediate symptom?
2. What service/component is affected?
3. What is the likely root cause?
4. What is the blast radius (affected users/services)?
5. Is this a known issue pattern?

Output as JSON:
{
  "symptom": "Brief description of the symptom",
  "affectedService": "service-name",
  "affectedComponents": ["component1", "component2"],
  "likelyRootCause": "Analysis of probable cause",
  "confidence": 0.85,
  "blastRadius": {
    "users": "estimated affected users",
    "services": ["downstream services"],
    "severity": "critical|high|medium|low"
  },
  "keyLogEntries": ["relevant log line 1", "relevant log line 2"],
  "metrics": {
    "errorRate": "current error rate",
    "latency": "current latency"
  },
  "hypothesis": ["Hypothesis 1", "Hypothesis 2"],
  "immediateActions": ["Action 1", "Action 2"]
}`,
      tools: [],
      sub_agents: [],
      position: { x: 300, y: 200 },
    },
    'incident_summarizer': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are creating an incident summary for the on-call team.

Analysis:
{{analysis}}

Similar Past Incidents:
{{pastIncidents}}

Create a clear, actionable incident summary that:
1. Describes the issue in plain language
2. Shows impact and severity
3. References similar past incidents and their resolutions
4. Provides recommended next steps

Output as JSON:
{
  "title": "Incident title",
  "summary": "2-3 sentence summary",
  "severity": "SEV1|SEV2|SEV3|SEV4",
  "impact": {
    "description": "User-facing impact",
    "affectedUsers": "estimate",
    "affectedRegions": ["region1"]
  },
  "timeline": [
    {"time": "timestamp", "event": "What happened"}
  ],
  "similarIncidents": [
    {"id": "INC-123", "similarity": 0.85, "resolution": "How it was fixed"}
  ],
  "recommendedActions": [
    {"action": "What to do", "priority": "immediate|soon|later", "owner": "team"}
  ],
  "escalationPath": ["Team 1", "Team 2"],
  "slackMessage": "Formatted message for Slack"
}`,
      tools: [],
      sub_agents: [],
      position: { x: 600, y: 200 },
    },
    'runbook_generator': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are generating a runbook for incident responders.

Incident Summary:
{{incidentSummary}}

Analysis:
{{analysis}}

Past Incident Resolutions:
{{pastResolutions}}

Create a step-by-step runbook that:
1. Starts with immediate triage steps
2. Includes diagnostic commands
3. Provides mitigation options
4. Lists rollback procedures if applicable
5. Includes escalation criteria

Output as JSON:
{
  "title": "Runbook: {{incidentSummary.title}}",
  "lastUpdated": "timestamp",
  "sections": [
    {
      "name": "Immediate Triage",
      "steps": [
        {"step": 1, "action": "What to do", "command": "command if applicable", "expectedResult": "What you should see"}
      ]
    },
    {
      "name": "Diagnosis",
      "steps": [...]
    },
    {
      "name": "Mitigation",
      "steps": [...]
    },
    {
      "name": "Rollback",
      "steps": [...]
    }
  ],
  "escalationCriteria": ["When to escalate"],
  "usefulLinks": [{"name": "Dashboard", "url": "..."}],
  "contacts": [{"team": "Team name", "slack": "#channel"}]
}`,
      tools: [],
      sub_agents: [],
      position: { x: 800, y: 200 },
    },
  },
  actionNodes: {
    'alert_webhook': {
      type: 'trigger',
      id: 'alert_webhook',
      name: 'Alert Webhook',
      description: 'Receive alerts from monitoring',
      triggerType: 'webhook',
      webhook: {
        path: '/api/webhook/alerts',
        method: 'POST',
        auth: 'api_key',
        authConfig: {
          headerName: 'X-Alert-Key',
          tokenEnvVar: 'ALERT_WEBHOOK_KEY',
        },
      },
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'alert' },
    },
    'fetch_logs': {
      type: 'http',
      id: 'fetch_logs',
      name: 'Fetch Recent Logs',
      description: 'Get logs around alert time',
      method: 'POST',
      url: 'https://api.datadoghq.com/api/v2/logs/events/search',
      auth: {
        type: 'api_key',
        apiKey: { headerName: 'DD-API-KEY', value: '{{DATADOG_API_KEY}}' },
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        type: 'json',
        content: `{
  "filter": {
    "query": "service:{{alert.service}} status:error",
    "from": "{{alert.timestamp - 300000}}",
    "to": "{{alert.timestamp}}"
  },
  "sort": "timestamp",
  "page": {"limit": 100}
}`,
      },
      response: { 
        type: 'json',
        jsonPath: '$.data',
      },
      errorHandling: { mode: 'fallback', fallbackValue: [] },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 15000 },
      mapping: { outputKey: 'logs' },
    },
    'search_past_incidents': {
      type: 'http',
      id: 'search_past_incidents',
      name: 'Search Past Incidents',
      description: 'Find similar historical incidents',
      method: 'POST',
      url: 'https://{{PINECONE_INDEX}}-xxx.svc.pinecone.io/query',
      auth: {
        type: 'api_key',
        apiKey: { headerName: 'Api-Key', value: '{{PINECONE_API_KEY}}' },
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        type: 'json',
        content: `{
  "vector": "{{analysisEmbedding}}",
  "topK": 5,
  "includeMetadata": true,
  "filter": {
    "service": {"$eq": "{{alert.service}}"}
  }
}`,
      },
      response: { 
        type: 'json',
        jsonPath: '$.matches',
      },
      errorHandling: { mode: 'fallback', fallbackValue: [] },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { outputKey: 'pastIncidents' },
    },
    'route_severity': {
      type: 'switch',
      id: 'route_severity',
      name: 'Route by Severity',
      description: 'Route based on incident severity',
      evaluationMode: 'first_match',
      conditions: [
        { id: 'sev1', name: 'SEV1 - Critical', field: 'incidentSummary.severity', operator: 'eq', value: 'SEV1', outputPort: 'critical' },
        { id: 'sev2', name: 'SEV2 - High', field: 'incidentSummary.severity', operator: 'eq', value: 'SEV2', outputPort: 'high' },
      ],
      defaultBranch: 'normal',
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 5000 },
      mapping: { outputKey: 'severityRoute' },
    },
    'page_oncall': {
      type: 'http',
      id: 'page_oncall',
      name: 'Page On-Call',
      description: 'Create PagerDuty incident',
      method: 'POST',
      url: 'https://api.pagerduty.com/incidents',
      auth: {
        type: 'bearer',
        bearer: { token: '{{PAGERDUTY_API_KEY}}' },
      },
      headers: {
        'Content-Type': 'application/json',
        'From': 'incident-bot@company.com',
      },
      body: {
        type: 'json',
        content: `{
  "incident": {
    "type": "incident",
    "title": "{{incidentSummary.title}}",
    "service": {
      "id": "{{PAGERDUTY_SERVICE_ID}}",
      "type": "service_reference"
    },
    "urgency": "{{incidentSummary.severity === 'SEV1' ? 'high' : 'low'}}",
    "body": {
      "type": "incident_body",
      "details": "{{incidentSummary.summary}}\\n\\nImpact: {{incidentSummary.impact.description}}\\n\\nRecommended Actions:\\n{{incidentSummary.recommendedActions.map(a => '- ' + a.action).join('\\n')}}"
    }
  }
}`,
      },
      response: { type: 'json' },
      errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 1000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 15000 },
      mapping: { outputKey: 'pagerdutyIncident' },
    },
    'notify_slack': {
      type: 'notification',
      id: 'notify_slack',
      name: 'Notify Incident Channel',
      description: 'Post to Slack incident channel',
      channel: 'slack',
      webhookUrl: '{{SLACK_WEBHOOK_URL}}',
      message: {
        text: `{{incidentSummary.slackMessage}}`,
        format: 'markdown',
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '🚨 {{incidentSummary.title}}' }
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: '*Severity:* {{incidentSummary.severity}}\n*Impact:* {{incidentSummary.impact.description}}' }
          }
        ],
      },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { outputKey: 'slackNotification' },
    },
    'save_incident': {
      type: 'database',
      id: 'save_incident',
      name: 'Save Incident Record',
      description: 'Store incident for future reference',
      dbType: 'postgresql',
      connection: {
        connectionString: '{{DATABASE_URL}}',
        poolSize: 5,
      },
      sql: {
        operation: 'insert',
        query: `INSERT INTO incidents (
          title, severity, service, summary, analysis,
          runbook, pagerduty_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id`,
        params: {
          '$1': '{{incidentSummary.title}}',
          '$2': '{{incidentSummary.severity}}',
          '$3': '{{alert.service}}',
          '$4': '{{incidentSummary}}',
          '$5': '{{analysis}}',
          '$6': '{{runbook}}',
          '$7': '{{pagerdutyIncident.incident.id}}',
        },
      },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { outputKey: 'savedIncident' },
    },
  },
  edges: [
    { from: 'START', to: 'alert_webhook' },
    { from: 'alert_webhook', to: 'fetch_logs' },
    { from: 'fetch_logs', to: 'log_analyzer' },
    { from: 'log_analyzer', to: 'search_past_incidents' },
    { from: 'search_past_incidents', to: 'incident_summarizer' },
    { from: 'incident_summarizer', to: 'route_severity' },
    { from: 'route_severity', to: 'page_oncall', fromPort: 'critical' },
    { from: 'route_severity', to: 'page_oncall', fromPort: 'high' },
    { from: 'route_severity', to: 'notify_slack', fromPort: 'normal' },
    { from: 'page_oncall', to: 'runbook_generator' },
    { from: 'runbook_generator', to: 'notify_slack' },
    { from: 'notify_slack', to: 'save_incident' },
    { from: 'save_incident', to: 'END' },
  ],
};


/**
 * Template 11: AI Code Review & QA
 * 
 * Workflow: Trigger (webhook) → HTTP (fetch diff) → LLM Agent (review) 
 *           → LLM Agent (security scan) → LLM Agent (suggest tests) → HTTP (post comments) → Notification
 * 
 * Use Case: Automatically review pull requests with AI-powered code analysis,
 * security scanning, and test suggestions.
 */
export const codeReviewTemplate: Template = {
  id: 'ai_code_review',
  name: 'AI Code Review & QA',
  icon: '🔍',
  description: 'Automated PR review with security scanning and test suggestions',
  category: 'automation',
  requiredNodeTypes: ['trigger', 'http', 'notification'],
  envVars: [
    { name: 'GITHUB_TOKEN', description: 'GitHub personal access token', required: true },
    { name: 'SLACK_WEBHOOK_URL', description: 'Slack webhook for notifications', required: true },
  ],
  useCase: 'Automatically review pull requests when opened, analyze code quality and style, scan for security vulnerabilities, suggest missing tests, and post detailed review comments directly on the PR.',
  customizationTips: [
    'Customize code style rules for your team',
    'Add language-specific security checks',
    'Integrate with your CI/CD pipeline',
    'Adjust review strictness levels',
  ],
  agents: {
    'code_reviewer': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a senior code reviewer. Analyze the pull request diff and provide constructive feedback.

PR Information:
- Title: {{pr.title}}
- Description: {{pr.body}}
- Author: {{pr.author}}
- Base branch: {{pr.base}}

Diff:
{{diff}}

Review for:
1. Code quality and readability
2. Logic errors or bugs
3. Performance issues
4. Code style consistency
5. Documentation completeness
6. Error handling
7. Edge cases

Output as JSON:
{
  "overallAssessment": "approve|request_changes|comment",
  "summary": "Brief summary of the review",
  "score": {
    "quality": 8,
    "readability": 7,
    "performance": 9,
    "documentation": 6
  },
  "comments": [
    {
      "file": "path/to/file.ts",
      "line": 42,
      "type": "suggestion|issue|praise",
      "severity": "critical|major|minor|info",
      "message": "Review comment",
      "suggestion": "Suggested code change if applicable"
    }
  ],
  "highlights": ["What's done well"],
  "concerns": ["Main concerns"],
  "questionsForAuthor": ["Clarifying questions"]
}`,
      tools: [],
      sub_agents: [],
      position: { x: 400, y: 150 },
    },
    'security_scanner': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a security expert. Scan the code changes for security vulnerabilities.

Diff:
{{diff}}

Language: {{pr.language}}

Check for:
1. SQL injection vulnerabilities
2. XSS vulnerabilities
3. Authentication/authorization issues
4. Sensitive data exposure
5. Insecure dependencies
6. Hardcoded secrets
7. Input validation issues
8. CSRF vulnerabilities
9. Insecure cryptography
10. Path traversal

Output as JSON:
{
  "securityScore": 85,
  "vulnerabilities": [
    {
      "type": "SQL_INJECTION",
      "severity": "critical|high|medium|low",
      "file": "path/to/file.ts",
      "line": 42,
      "description": "Description of the vulnerability",
      "recommendation": "How to fix it",
      "cweId": "CWE-89",
      "owaspCategory": "A03:2021"
    }
  ],
  "securityPractices": {
    "inputValidation": "pass|fail|partial",
    "authentication": "pass|fail|partial|na",
    "dataProtection": "pass|fail|partial"
  },
  "recommendations": ["General security recommendations"],
  "passedChecks": ["Checks that passed"]
}`,
      tools: [],
      sub_agents: [],
      position: { x: 400, y: 300 },
    },
    'test_suggester': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a QA engineer. Analyze the code changes and suggest tests that should be written.

Diff:
{{diff}}

Existing Tests:
{{existingTests}}

Code Review:
{{codeReview}}

Suggest:
1. Unit tests for new functions/methods
2. Integration tests for new features
3. Edge case tests
4. Error handling tests
5. Regression tests if fixing bugs

Output as JSON:
{
  "testCoverage": {
    "estimated": 75,
    "recommendation": "Target coverage recommendation"
  },
  "suggestedTests": [
    {
      "type": "unit|integration|e2e",
      "name": "test_function_name",
      "description": "What this test should verify",
      "file": "suggested/test/file.test.ts",
      "priority": "high|medium|low",
      "testCode": "// Suggested test implementation\\ndescribe('...', () => {\\n  it('should...', () => {\\n    // test code\\n  });\\n});"
    }
  ],
  "missingCoverage": [
    {"function": "functionName", "reason": "Why it needs tests"}
  ],
  "testingNotes": ["Additional testing recommendations"]
}`,
      tools: [],
      sub_agents: [],
      position: { x: 400, y: 450 },
    },
  },
  actionNodes: {
    'pr_webhook': {
      type: 'trigger',
      id: 'pr_webhook',
      name: 'PR Webhook',
      description: 'Receive PR events from GitHub',
      triggerType: 'webhook',
      webhook: {
        path: '/api/webhook/github/pr',
        method: 'POST',
        auth: 'api_key',
        authConfig: {
          headerName: 'X-Hub-Signature-256',
          tokenEnvVar: 'GITHUB_WEBHOOK_SECRET',
        },
      },
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'pr' },
    },
    'fetch_diff': {
      type: 'http',
      id: 'fetch_diff',
      name: 'Fetch PR Diff',
      description: 'Get the PR diff from GitHub',
      method: 'GET',
      url: 'https://api.github.com/repos/{{pr.repository.full_name}}/pulls/{{pr.number}}',
      auth: {
        type: 'bearer',
        bearer: { token: '{{GITHUB_TOKEN}}' },
      },
      headers: {
        'Accept': 'application/vnd.github.v3.diff',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: { type: 'none' },
      response: { type: 'text' },
      errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 1000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'diff' },
    },
    'fetch_existing_tests': {
      type: 'http',
      id: 'fetch_existing_tests',
      name: 'Fetch Existing Tests',
      description: 'Get list of test files in the repo',
      method: 'GET',
      url: 'https://api.github.com/repos/{{pr.repository.full_name}}/git/trees/{{pr.head.sha}}?recursive=1',
      auth: {
        type: 'bearer',
        bearer: { token: '{{GITHUB_TOKEN}}' },
      },
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: { type: 'none' },
      response: { 
        type: 'json',
        jsonPath: '$.tree[?(@.path.match(/test|spec/))]',
      },
      errorHandling: { mode: 'fallback', fallbackValue: [] },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 15000 },
      mapping: { outputKey: 'existingTests' },
    },
    'post_review': {
      type: 'http',
      id: 'post_review',
      name: 'Post Review Comments',
      description: 'Submit review to GitHub',
      method: 'POST',
      url: 'https://api.github.com/repos/{{pr.repository.full_name}}/pulls/{{pr.number}}/reviews',
      auth: {
        type: 'bearer',
        bearer: { token: '{{GITHUB_TOKEN}}' },
      },
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: {
        type: 'json',
        content: '{"body": "## 🤖 AI Code Review\\n\\n{{codeReview.summary}}\\n\\n### Scores\\n- Quality: {{codeReview.score.quality}}/10\\n- Readability: {{codeReview.score.readability}}/10\\n- Performance: {{codeReview.score.performance}}/10\\n- Documentation: {{codeReview.score.documentation}}/10\\n\\n### Security\\n{{#if securityScan.vulnerabilities.length}}⚠️ Found {{securityScan.vulnerabilities.length}} security issue(s){{else}}✅ No security issues found{{/if}}\\n\\n### Test Suggestions\\n{{testSuggestions.suggestedTests.length}} test(s) suggested", "event": "{{codeReview.overallAssessment}}", "comments": []}',
      },
      response: { type: 'json' },
      errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 2000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'reviewPosted' },
    },
    'notify_team': {
      type: 'notification',
      id: 'notify_team',
      name: 'Notify Team',
      description: 'Send review summary to Slack',
      channel: 'slack',
      webhookUrl: '{{SLACK_WEBHOOK_URL}}',
      message: {
        text: `🔍 *AI Code Review Complete*\n\n*PR:* <{{pr.html_url}}|{{pr.title}}>\n*Author:* {{pr.author}}\n*Verdict:* {{codeReview.overallAssessment}}\n\n*Quality Score:* {{codeReview.score.quality}}/10\n*Security Score:* {{securityScan.securityScore}}/100\n\n{{#if securityScan.vulnerabilities.length}}⚠️ *Security Issues:* {{securityScan.vulnerabilities.length}}{{/if}}\n{{#if testSuggestions.suggestedTests.length}}📝 *Suggested Tests:* {{testSuggestions.suggestedTests.length}}{{/if}}`,
        format: 'markdown',
      },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { outputKey: 'slackNotification' },
    },
  },
  edges: [
    { from: 'START', to: 'pr_webhook' },
    { from: 'pr_webhook', to: 'fetch_diff' },
    { from: 'fetch_diff', to: 'fetch_existing_tests' },
    { from: 'fetch_existing_tests', to: 'code_reviewer' },
    { from: 'code_reviewer', to: 'security_scanner' },
    { from: 'security_scanner', to: 'test_suggester' },
    { from: 'test_suggester', to: 'post_review' },
    { from: 'post_review', to: 'notify_team' },
    { from: 'notify_team', to: 'END' },
  ],
};


/**
 * Template 12: AI Customer Onboarding Journey
 * 
 * Workflow: Trigger (webhook) → LLM Agent (predict needs) → Database (profile) 
 *           → Loop (email sequence) → LLM Agent (personalize) → Email (send) 
 *           → Wait (monitor) → Switch (engagement) → LLM Agent (intervention)
 * 
 * Use Case: Create personalized onboarding journeys that adapt based on customer
 * behavior and engagement, with AI-powered content personalization.
 */
export const customerOnboardingTemplate: Template = {
  id: 'ai_customer_onboarding',
  name: 'AI Customer Onboarding Journey',
  icon: '🎓',
  description: 'Adaptive onboarding with AI personalization and engagement tracking',
  category: 'automation',
  requiredNodeTypes: ['trigger', 'database', 'loop', 'email', 'wait', 'switch'],
  envVars: [
    { name: 'DATABASE_URL', description: 'Customer database connection', required: true },
    { name: 'SMTP_HOST', description: 'SMTP server', required: true },
    { name: 'SMTP_USER', description: 'SMTP username', required: true },
    { name: 'SMTP_PASS', description: 'SMTP password', required: true },
    { name: 'ANALYTICS_API_KEY', description: 'Analytics API key for engagement tracking', required: false },
  ],
  useCase: 'When a new customer signs up, predict their needs based on their profile, create a personalized onboarding sequence, send adaptive emails, monitor engagement, and trigger interventions for at-risk customers.',
  customizationTips: [
    'Customize the onboarding email sequence for your product',
    'Adjust engagement thresholds based on your metrics',
    'Add product-specific milestones to track',
    'Integrate with your product analytics',
  ],
  agents: {
    'needs_predictor': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a customer success expert. Analyze the new customer's profile and predict their needs.

Customer Profile:
{{customer}}

Signup Source:
{{signupSource}}

Analyze:
1. What are their likely goals with our product?
2. What features will they need most?
3. What challenges might they face?
4. What's their technical sophistication level?
5. What onboarding path suits them best?

Output as JSON:
{
  "predictedGoals": ["goal1", "goal2"],
  "recommendedFeatures": ["feature1", "feature2"],
  "anticipatedChallenges": ["challenge1"],
  "technicalLevel": "beginner|intermediate|advanced",
  "onboardingPath": "quick_start|guided|self_serve",
  "priorityMilestones": [
    {"milestone": "First project created", "targetDays": 1},
    {"milestone": "Team member invited", "targetDays": 3}
  ],
  "personalizationNotes": "Key things to emphasize",
  "riskFactors": ["Potential churn indicators"],
  "successPrediction": {
    "score": 75,
    "factors": ["positive factor 1", "concern 1"]
  }
}`,
      tools: [],
      sub_agents: [],
      position: { x: 300, y: 150 },
    },
    'email_personalizer': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are an onboarding email specialist. Personalize the email for this customer.

Customer:
{{customer}}

Predicted Needs:
{{predictedNeeds}}

Email Template:
{{emailTemplate}}

Current Step: {{currentStep}} of {{totalSteps}}

Customer Progress:
{{customerProgress}}

Personalize the email to:
1. Address them by name
2. Reference their specific goals
3. Highlight relevant features
4. Provide actionable next steps
5. Match their technical level

Output as JSON:
{
  "subject": "Personalized subject line",
  "preheader": "Email preview text",
  "greeting": "Personalized greeting",
  "body": "Main email content (HTML)",
  "cta": {
    "text": "Button text",
    "url": "https://...",
    "trackingParams": "utm_source=onboarding&utm_campaign=step{{currentStep}}"
  },
  "tips": ["Relevant tip based on their level"],
  "nextMilestone": "What they should do next",
  "supportLink": "Link to relevant help article"
}`,
      tools: [],
      sub_agents: [],
      position: { x: 500, y: 300 },
    },
    'intervention_creator': {
      type: 'llm',
      model: 'gemini-3.1-flash-lite-preview',
      instruction: `You are a customer success manager. Create an intervention for an at-risk customer.

Customer:
{{customer}}

Engagement Data:
{{engagementData}}

Predicted Needs:
{{predictedNeeds}}

Risk Indicators:
{{riskIndicators}}

Create an intervention that:
1. Acknowledges their situation empathetically
2. Offers specific help based on their blockers
3. Provides easy next steps
4. Offers human support if needed

Output as JSON:
{
  "interventionType": "email|call|in_app",
  "urgency": "high|medium|low",
  "subject": "We're here to help",
  "message": "Personalized intervention message",
  "offeredHelp": [
    {"type": "1:1 call", "description": "Schedule a call with our team"},
    {"type": "tutorial", "description": "Relevant tutorial link"}
  ],
  "incentive": "Special offer if applicable",
  "escalateTo": "human support if needed",
  "followUpDays": 2
}`,
      tools: [],
      sub_agents: [],
      position: { x: 700, y: 450 },
    },
  },
  actionNodes: {
    'signup_webhook': {
      type: 'trigger',
      id: 'signup_webhook',
      name: 'New Signup Webhook',
      description: 'Receive new customer signups',
      triggerType: 'webhook',
      webhook: {
        path: '/api/webhook/signups',
        method: 'POST',
        auth: 'api_key',
        authConfig: {
          headerName: 'X-Signup-Key',
          tokenEnvVar: 'SIGNUP_WEBHOOK_KEY',
        },
      },
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'customer' },
    },
    'create_profile': {
      type: 'database',
      id: 'create_profile',
      name: 'Create Customer Profile',
      description: 'Store customer with predicted needs',
      dbType: 'postgresql',
      connection: {
        connectionString: '{{DATABASE_URL}}',
        poolSize: 5,
      },
      sql: {
        operation: 'insert',
        query: `INSERT INTO customer_profiles (
          customer_id, email, name, company, 
          predicted_needs, onboarding_path, 
          success_score, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id`,
        params: {
          '$1': '{{customer.id}}',
          '$2': '{{customer.email}}',
          '$3': '{{customer.name}}',
          '$4': '{{customer.company}}',
          '$5': '{{predictedNeeds}}',
          '$6': '{{predictedNeeds.onboardingPath}}',
          '$7': '{{predictedNeeds.successPrediction.score}}',
        },
      },
      errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 1000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { outputKey: 'customerProfile' },
    },
    'set_email_sequence': {
      type: 'set',
      id: 'set_email_sequence',
      name: 'Set Email Sequence',
      description: 'Configure onboarding email sequence',
      mode: 'set',
      variables: [
        { 
          key: 'emailSequence', 
          value: [
            { step: 1, delay: 0, template: 'welcome', subject: 'Welcome to {{productName}}!' },
            { step: 2, delay: 1, template: 'getting_started', subject: 'Get started in 5 minutes' },
            { step: 3, delay: 3, template: 'first_milestone', subject: 'Ready for your first {{milestone}}?' },
            { step: 4, delay: 7, template: 'tips_tricks', subject: 'Pro tips from power users' },
            { step: 5, delay: 14, template: 'check_in', subject: 'How\'s it going, {{firstName}}?' },
          ], 
          valueType: 'json', 
          isSecret: false 
        },
        { key: 'productName', value: 'Your Product', valueType: 'string', isSecret: false },
      ],
      errorHandling: { mode: 'stop' },
      tracing: { enabled: false, logLevel: 'none' },
      callbacks: {},
      execution: { timeout: 5000 },
      mapping: { outputKey: 'sequenceConfig' },
    },
    'process_sequence': {
      type: 'loop',
      id: 'process_sequence',
      name: 'Process Email Sequence',
      description: 'Send each onboarding email',
      loopType: 'forEach',
      forEach: {
        sourceArray: 'emailSequence',
        itemVar: 'emailTemplate',
        indexVar: 'stepIdx',
      },
      parallel: {
        enabled: false,
      },
      results: {
        collect: true,
        aggregationKey: 'emailResults',
      },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 1800000 },
      mapping: { outputKey: 'loopResults' },
    },
    'send_onboarding_email': {
      type: 'email',
      id: 'send_onboarding_email',
      name: 'Send Onboarding Email',
      description: 'Send personalized onboarding email',
      mode: 'send',
      smtp: {
        host: '{{SMTP_HOST}}',
        port: 587,
        secure: false,
        username: '{{SMTP_USER}}',
        password: '{{SMTP_PASS}}',
        fromEmail: 'onboarding@company.com',
        fromName: 'Your Product Team',
      },
      recipients: {
        to: '{{customer.email}}',
      },
      content: {
        subject: '{{personalizedEmail.subject}}',
        bodyType: 'html',
        body: `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>{{personalizedEmail.greeting}}</p>
  <div>{{personalizedEmail.body}}</div>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{personalizedEmail.cta.url}}?{{personalizedEmail.cta.trackingParams}}" 
       style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
      {{personalizedEmail.cta.text}}
    </a>
  </p>
  {{#if personalizedEmail.tips}}
  <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
    <strong>💡 Tip:</strong> {{personalizedEmail.tips[0]}}
  </div>
  {{/if}}
  <p style="color: #666; font-size: 14px;">
    Need help? <a href="{{personalizedEmail.supportLink}}">Check our guides</a> or reply to this email.
  </p>
</body>
</html>`,
      },
      errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 2000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'emailSent' },
    },
    'wait_for_engagement': {
      type: 'wait',
      id: 'wait_for_engagement',
      name: 'Wait for Engagement',
      description: 'Wait before checking engagement',
      waitType: 'fixed',
      fixed: {
        duration: 24,
        unit: 'h',
      },
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 90000000 },
      mapping: { outputKey: 'waitComplete' },
    },
    'check_engagement': {
      type: 'database',
      id: 'check_engagement',
      name: 'Check Engagement',
      description: 'Get customer engagement metrics',
      dbType: 'postgresql',
      connection: {
        connectionString: '{{DATABASE_URL}}',
        poolSize: 5,
      },
      sql: {
        operation: 'query',
        query: `SELECT 
          cp.*,
          COUNT(DISTINCT e.id) as email_opens,
          COUNT(DISTINCT c.id) as clicks,
          COUNT(DISTINCT l.id) as logins,
          COUNT(DISTINCT a.id) as actions_taken,
          MAX(l.created_at) as last_login
        FROM customer_profiles cp
        LEFT JOIN email_events e ON e.customer_id = cp.customer_id AND e.event = 'open'
        LEFT JOIN email_events c ON c.customer_id = cp.customer_id AND c.event = 'click'
        LEFT JOIN user_logins l ON l.customer_id = cp.customer_id
        LEFT JOIN user_actions a ON a.customer_id = cp.customer_id
        WHERE cp.customer_id = $1
        GROUP BY cp.id`,
        params: { '$1': '{{customer.id}}' },
      },
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { outputKey: 'engagementData' },
    },
    'route_engagement': {
      type: 'switch',
      id: 'route_engagement',
      name: 'Route by Engagement',
      description: 'Route based on engagement level',
      evaluationMode: 'first_match',
      conditions: [
        { id: 'highly_engaged', name: 'Highly Engaged', field: 'engagementData.logins', operator: 'gte', value: 5, outputPort: 'engaged' },
        { id: 'some_engagement', name: 'Some Engagement', field: 'engagementData.logins', operator: 'gte', value: 2, outputPort: 'moderate' },
      ],
      defaultBranch: 'at_risk',
      errorHandling: { mode: 'stop' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 5000 },
      mapping: { outputKey: 'engagementRoute' },
    },
    'send_intervention': {
      type: 'email',
      id: 'send_intervention',
      name: 'Send Intervention',
      description: 'Send intervention email to at-risk customer',
      mode: 'send',
      smtp: {
        host: '{{SMTP_HOST}}',
        port: 587,
        secure: false,
        username: '{{SMTP_USER}}',
        password: '{{SMTP_PASS}}',
        fromEmail: 'success@company.com',
        fromName: 'Customer Success',
      },
      recipients: {
        to: '{{customer.email}}',
      },
      content: {
        subject: '{{intervention.subject}}',
        bodyType: 'html',
        body: '<p>Hi {{customer.firstName}},</p>' +
          '<p>{{intervention.message}}</p>' +
          '<h4>We can help:</h4>' +
          '<ul>' +
          '{{#each intervention.offeredHelp}}' +
          '<li><strong>{{help.type}}:</strong> {{help.description}}</li>' +
          '{{/each}}' +
          '</ul>' +
          '{{#if intervention.incentive}}' +
          '<p style="background: #e8f5e9; padding: 15px; border-radius: 4px;">' +
          '🎁 <strong>Special offer:</strong> {{intervention.incentive}}' +
          '</p>' +
          '{{/if}}' +
          '<p>Just reply to this email or <a href="https://calendly.com/success-team">book a call</a>.</p>' +
          '<p>We\'re here to help you succeed!</p>',
      },
      errorHandling: { mode: 'retry', retryCount: 2, retryDelay: 2000 },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 30000 },
      mapping: { outputKey: 'interventionSent' },
    },
    'update_status': {
      type: 'database',
      id: 'update_status',
      name: 'Update Onboarding Status',
      description: 'Update customer onboarding progress',
      dbType: 'postgresql',
      connection: {
        connectionString: '{{DATABASE_URL}}',
        poolSize: 5,
      },
      sql: {
        operation: 'update',
        query: `UPDATE customer_profiles SET 
          onboarding_status = $2,
          engagement_score = $3,
          last_email_step = $4,
          intervention_sent = $5,
          updated_at = NOW()
        WHERE customer_id = $1`,
        params: {
          '$1': '{{customer.id}}',
          '$2': '{{engagementRoute}}',
          '$3': '{{engagementData.logins + engagementData.actions_taken}}',
          '$4': '{{stepIdx}}',
          '$5': '{{engagementRoute === "at_risk"}}',
        },
      },
      errorHandling: { mode: 'continue' },
      tracing: { enabled: true, logLevel: 'info' },
      callbacks: {},
      execution: { timeout: 10000 },
      mapping: { outputKey: 'statusUpdated' },
    },
  },
  edges: [
    { from: 'START', to: 'signup_webhook' },
    { from: 'signup_webhook', to: 'needs_predictor' },
    { from: 'needs_predictor', to: 'create_profile' },
    { from: 'create_profile', to: 'set_email_sequence' },
    { from: 'set_email_sequence', to: 'process_sequence' },
    { from: 'process_sequence', to: 'email_personalizer' },
    { from: 'email_personalizer', to: 'send_onboarding_email' },
    { from: 'send_onboarding_email', to: 'wait_for_engagement' },
    { from: 'wait_for_engagement', to: 'check_engagement' },
    { from: 'check_engagement', to: 'route_engagement' },
    { from: 'route_engagement', to: 'update_status', fromPort: 'engaged' },
    { from: 'route_engagement', to: 'update_status', fromPort: 'moderate' },
    { from: 'route_engagement', to: 'intervention_creator', fromPort: 'at_risk' },
    { from: 'intervention_creator', to: 'send_intervention' },
    { from: 'send_intervention', to: 'update_status' },
    { from: 'update_status', to: 'END' },
  ],
};

/**
 * Export all automation templates
 */
export const AUTOMATION_TEMPLATES: Template[] = [
  leadGenerationTemplate,
  emailMarketingTemplate,
  socialMediaContentTemplate,
  customerSupportTemplate,
  dataAnalysisTemplate,
  invoiceProcessingTemplate,
  jobApplicationBotTemplate,
  newsletterDigestTemplate,
  ecommerceOrderTemplate,
  incidentResponseTemplate,
  codeReviewTemplate,
  customerOnboardingTemplate,
];

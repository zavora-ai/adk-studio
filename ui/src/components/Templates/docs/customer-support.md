# AI Customer Support

🎧 Intelligent ticket handling with knowledge base integration

## Overview

Receive support tickets via webhook, classify the issue type, search your knowledge base for relevant articles, generate a helpful response, and either auto-reply or escalate to human agents based on confidence.

## Workflow

```
Webhook → AI Classify → Search KB → AI Respond → Route by Confidence → Auto-Reply / Escalate → Notify
```

## Required Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `PINECONE_API_KEY` | Pinecone vector database API key | Yes | `pc-xxx` |
| `PINECONE_INDEX` | Pinecone index name | Yes | `support-kb` |
| `SMTP_HOST` | SMTP server for responses | Yes | `smtp.sendgrid.net` |
| `SMTP_USER` | SMTP username | Yes | `apikey` |
| `SMTP_PASS` | SMTP password | Yes | `SG.xxx` |
| `SLACK_WEBHOOK_URL` | Slack webhook for escalations | Yes | `https://hooks.slack.com/...` |

## Action Nodes Used

- **Trigger (Webhook)**: Receives incoming support tickets
- **HTTP**: Searches vector database for KB articles
- **Switch**: Routes based on response confidence
- **Email**: Sends auto-replies to customers
- **Notification**: Alerts support team for escalations

## LLM Agents

### Ticket Classifier
Categorizes tickets into:
- **billing**: Payments, refunds, subscriptions
- **technical**: Bugs, errors, how-to questions
- **account**: Login issues, password reset
- **feature**: Feature requests, suggestions
- **general**: General inquiries, feedback

Also assesses urgency, sentiment, and complexity.

### Response Generator
Creates helpful responses using KB articles:
- Empathetic acknowledgment
- Step-by-step solutions
- KB article references
- Clear next steps
- Confidence score for routing

## Knowledge Base Setup

### Pinecone Index Structure
```json
{
  "id": "kb-article-001",
  "values": [0.1, 0.2, ...],
  "metadata": {
    "title": "How to Reset Your Password",
    "category": "account",
    "content": "Step 1: Click 'Forgot Password'...",
    "url": "https://help.example.com/password-reset"
  }
}
```

### Embedding Your KB
1. Export your help articles
2. Generate embeddings using OpenAI/Cohere
3. Upload to Pinecone with metadata

## Customization Tips

1. **Confidence Thresholds**: Adjust auto-reply vs escalation cutoffs
2. **Category Routing**: Add specialized agents per category
3. **Response Tone**: Customize AI prompts for brand voice
4. **Escalation Rules**: Add urgency-based routing
5. **Multi-language**: Add translation for international support

## Setup Instructions

1. **Set Up Knowledge Base**
   - Create Pinecone index
   - Embed and upload your help articles
   - Test similarity search

2. **Configure Webhook**
   - Deploy workflow
   - Integrate with your ticketing system (Zendesk, Freshdesk, etc.)

3. **Set Up Email**
   - Configure SMTP for auto-replies
   - Create email templates

4. **Configure Escalation**
   - Set up Slack channel for escalations
   - Define confidence thresholds

5. **Test End-to-End**
   - Submit test tickets
   - Verify classification accuracy
   - Check auto-reply quality

## Example Ticket Payload

```json
{
  "ticketId": "TKT-12345",
  "subject": "Can't login to my account",
  "body": "I've been trying to login for the past hour but keep getting an error message saying 'Invalid credentials'. I'm sure my password is correct.",
  "customerEmail": "customer@example.com",
  "customerName": "John Smith",
  "priority": "normal",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## Response Routing Logic

| Confidence | Action | Notification |
|------------|--------|--------------|
| 85-100% | Auto-reply immediately | None |
| 60-84% | Auto-reply + flag for review | Slack (low priority) |
| 0-59% | Escalate to human | Slack (high priority) |

## Troubleshooting

### Poor classification accuracy
- Review and expand training categories
- Add more context to classifier prompt
- Check for ambiguous ticket patterns

### KB search returning irrelevant results
- Improve article embeddings
- Add more metadata filters
- Tune similarity threshold

### Auto-replies too generic
- Enrich KB with more specific articles
- Add customer context to prompts
- Implement follow-up questions

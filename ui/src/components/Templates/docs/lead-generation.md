# AI-Powered Lead Generation

🎯 Process leads with AI analysis, scoring, and CRM integration

## Overview

This template automatically processes incoming leads from web forms, analyzes company information and intent with AI, scores lead quality, and routes high-value leads to sales while updating your CRM.

## Workflow

```
Webhook → Enrich Lead → AI Analyze → AI Score → Route by Score → Create CRM Contact → Notify Sales
```

## Required Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `WEBHOOK_SECRET` | Secret for webhook authentication | Yes | `whsec_xxx` |
| `CRM_API_KEY` | CRM API key (HubSpot, Salesforce, etc.) | Yes | `pat-xxx` |
| `CRM_BASE_URL` | CRM API base URL | Yes | `https://api.hubapi.com` |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL | Yes | `https://hooks.slack.com/services/xxx` |
| `CLEARBIT_API_KEY` | Clearbit API key for lead enrichment | No | `sk_xxx` |

## Action Nodes Used

- **Trigger (Webhook)**: Receives lead form submissions
- **HTTP**: Enriches lead data and creates CRM contacts
- **Switch**: Routes leads based on score tier (hot/warm/cold)
- **Notification**: Sends Slack alerts for hot leads

## LLM Agents

### Lead Analyzer
Analyzes incoming lead data to extract:
- Company information (name, size, industry)
- Contact details (name, role, seniority)
- Intent signals (what they're looking for, urgency)
- Potential use cases

### Lead Scorer
Calculates a lead score (0-100) based on:
- Company size: Enterprise (+30), Medium (+20), Small (+10)
- Contact seniority: Executive (+25), Senior (+20), Mid (+10), Junior (+5)
- Intent urgency: High (+25), Medium (+15), Low (+5)
- Industry fit: High fit (+20), Medium fit (+10), Low fit (+0)

## Customization Tips

1. **Adjust Scoring Criteria**: Modify the lead scorer prompt to match your ideal customer profile
2. **Add More CRM Fields**: Extend the CRM contact creation with custom fields
3. **Multiple Notification Channels**: Add email or SMS notifications alongside Slack
4. **Lead Enrichment**: Add more enrichment sources (LinkedIn, ZoomInfo, etc.)

## Setup Instructions

1. **Configure Webhook**
   - Deploy the workflow
   - Copy the webhook URL: `/api/webhook/leads`
   - Add the URL to your web form's submission handler

2. **Set Up CRM Integration**
   - Get your CRM API key from HubSpot/Salesforce settings
   - Configure the `CRM_BASE_URL` for your CRM provider

3. **Configure Slack Notifications**
   - Create an incoming webhook in Slack
   - Add the webhook URL to `SLACK_WEBHOOK_URL`

4. **Test the Workflow**
   - Submit a test lead through your form
   - Verify the lead appears in your CRM
   - Check Slack for hot lead notifications

## Example Webhook Payload

```json
{
  "email": "john.doe@enterprise.com",
  "name": "John Doe",
  "company": "Enterprise Corp",
  "phone": "+1-555-0123",
  "message": "Looking for an enterprise solution for our team of 500+",
  "source": "website_contact_form"
}
```

## Troubleshooting

### Leads not appearing in CRM
- Verify `CRM_API_KEY` is valid and has write permissions
- Check the CRM API response in the workflow logs

### Slack notifications not sending
- Verify `SLACK_WEBHOOK_URL` is correct
- Check if the Slack app has posting permissions

### Lead enrichment failing
- Enrichment is optional; workflow continues without it
- Verify `CLEARBIT_API_KEY` if using enrichment

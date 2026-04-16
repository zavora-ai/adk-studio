# AI Newsletter Digest Creator

📰 Automated newsletter summarization and digest creation

## Overview

Fetch newsletters from your inbox, use AI to summarize each one, cluster related topics, generate a comprehensive digest, and send it to yourself or your team.

## Workflow

```
Email Fetch → Loop Newsletters → AI Summarize → Cluster Topics → AI Create Digest → Send Digest Email
```

## Required Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `IMAP_HOST` | Email server host | Yes | `imap.gmail.com` |
| `IMAP_USER` | Email username | Yes | `user@gmail.com` |
| `IMAP_PASS` | Email password/app password | Yes | `xxxx xxxx xxxx xxxx` |
| `NEWSLETTER_FOLDER` | Email folder to monitor | No | `Newsletters` |
| `SMTP_HOST` | SMTP server for digest | Yes | `smtp.gmail.com` |
| `DIGEST_RECIPIENTS` | Comma-separated emails | Yes | `me@example.com` |

## Action Nodes Used

- **Email (Fetch)**: Retrieves newsletters from inbox
- **Loop**: Processes each newsletter
- **Transform**: Clusters topics and formats
- **Email (Send)**: Delivers the digest

## LLM Agents

### Newsletter Summarizer
For each newsletter, extracts:
- Main topics covered
- Key insights and takeaways
- Notable quotes or statistics
- Action items or recommendations
- Links to full articles

### Digest Creator
Combines summaries into:
- Executive overview
- Topic-based sections
- Trending themes across newsletters
- Must-read highlights
- Quick links section

## Email Filtering

Configure filters to identify newsletters:

```javascript
{
  "filters": {
    "from": ["newsletter@", "digest@", "weekly@"],
    "subject": ["Newsletter", "Weekly", "Digest", "Roundup"],
    "labels": ["Newsletters"],
    "unreadOnly": true,
    "maxAge": "7d"
  }
}
```

## Customization Tips

1. **Topic Categories**: Define categories for clustering
2. **Priority Sources**: Weight certain newsletters higher
3. **Digest Frequency**: Daily, weekly, or on-demand
4. **Format Options**: HTML, plain text, or Markdown
5. **Archive**: Save digests to Notion or Google Docs

## Setup Instructions

1. **Organize Your Inbox**
   - Create a "Newsletters" folder/label
   - Set up filters to auto-sort newsletters
   - Unsubscribe from low-value newsletters

2. **Configure Email Access**
   - Enable IMAP on your email
   - Generate app password (Gmail)
   - Test connection

3. **Set Digest Schedule**
   - Choose frequency (daily recommended)
   - Set delivery time (morning works best)

4. **Customize Categories**
   - Define topic categories for your interests
   - Tech, Business, Industry, etc.

5. **Test with Few Newsletters**
   - Start with 3-5 newsletters
   - Review summary quality
   - Adjust prompts as needed

## Example Newsletter Summary

```json
{
  "source": "TechCrunch Daily",
  "date": "2024-01-15",
  "topics": ["AI", "Startups", "Funding"],
  "summary": "Today's edition covers the latest AI startup funding rounds, with three companies raising over $100M. Key highlight: OpenAI competitor raises $500M at $5B valuation.",
  "keyInsights": [
    "AI infrastructure spending up 40% YoY",
    "Enterprise AI adoption accelerating",
    "New regulations proposed in EU"
  ],
  "mustRead": {
    "title": "The Rise of AI Agents",
    "url": "https://techcrunch.com/ai-agents",
    "why": "Comprehensive overview of agent architectures"
  },
  "actionItems": [
    "Review AI agent frameworks for Q2 project"
  ]
}
```

## Example Digest Output

```markdown
# Your Weekly Newsletter Digest
**Week of January 15, 2024** | 12 newsletters summarized

## 🔥 Top Stories This Week

### AI & Technology
The AI landscape continues to evolve rapidly with three major 
funding announcements totaling over $1B. Key trend: enterprise 
adoption is accelerating faster than consumer applications.

**Must Read:** [The Rise of AI Agents](https://...) - TechCrunch

### Business & Startups
Q4 funding data shows resilience in B2B SaaS despite market 
conditions. Notable: vertical SaaS companies outperforming 
horizontal plays.

### Industry News
New EU AI regulations proposed, potentially affecting...

## 📊 By the Numbers
- $1.2B raised across AI startups this week
- 3 major acquisitions announced
- 15% increase in remote job postings

## 🔗 Quick Links
- [Full TechCrunch Article](https://...)
- [Funding Database](https://...)
- [EU Regulation Summary](https://...)

## 📬 Sources
- TechCrunch Daily (3 editions)
- Morning Brew (5 editions)
- The Information (2 editions)
- Stratechery (2 editions)
```

## Troubleshooting

### Missing newsletters
- Check email folder configuration
- Verify filter criteria
- Ensure newsletters aren't in spam

### Poor summary quality
- Provide more context in prompts
- Filter out promotional content
- Focus on editorial newsletters

### Digest too long
- Limit number of newsletters
- Increase summarization compression
- Add "top 5" filtering

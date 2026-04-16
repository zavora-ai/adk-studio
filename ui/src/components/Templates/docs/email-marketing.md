# Intelligent Email Marketing

📬 AI-personalized email campaigns with customer segmentation

## Overview

Run scheduled email campaigns that fetch customer segments from your database, use AI to personalize each email based on customer profile and purchase history, and track engagement.

## Workflow

```
Schedule → Fetch Customers → Set Campaign → Loop Customers → AI Personalize → Send Email → Update Record → Wait for Engagement
```

## Required Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@host:5432/db` |
| `SMTP_HOST` | SMTP server host | Yes | `smtp.sendgrid.net` |
| `SMTP_USER` | SMTP username | Yes | `apikey` |
| `SMTP_PASS` | SMTP password or API key | Yes | `SG.xxx` |
| `FROM_EMAIL` | Sender email address | Yes | `marketing@company.com` |

## Action Nodes Used

- **Trigger (Schedule)**: Runs campaign every Tuesday at 10 AM
- **Database**: Fetches customer segments and updates records
- **Set**: Configures campaign parameters
- **Loop**: Processes each customer for personalization
- **Email**: Sends personalized emails via SMTP
- **Wait**: Waits 24 hours for engagement tracking

## LLM Agents

### Email Personalizer
Creates personalized email content based on:
- Customer name and preferences
- Purchase history
- Campaign type and product
- Key message and offer

Outputs:
- Personalized subject line
- Email preheader
- Greeting and body content
- Call-to-action with URL
- Signature

## Database Schema Requirements

```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  preferences JSONB,
  last_interaction TIMESTAMP,
  segment VARCHAR(50),
  email_opt_in BOOLEAN DEFAULT true,
  last_email_sent TIMESTAMP,
  email_count INTEGER DEFAULT 0
);

CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  product_name VARCHAR(255),
  amount DECIMAL(10,2),
  purchased_at TIMESTAMP
);
```

## Customization Tips

1. **Modify SQL Query**: Target specific customer segments
2. **Adjust Schedule**: Change the cron expression for different timing
3. **A/B Testing**: Create multiple email variants and track performance
4. **Add Engagement Tracking**: Implement webhook callbacks for opens/clicks

## Setup Instructions

1. **Prepare Database**
   - Create the required tables
   - Populate with customer data
   - Ensure `email_opt_in` is set correctly

2. **Configure SMTP**
   - Set up SendGrid, Mailgun, or your SMTP provider
   - Verify sender domain for deliverability

3. **Set Campaign Details**
   - Modify the Set node with your campaign info
   - Update product name, message, and tracking ID

4. **Test with Small Segment**
   - Modify SQL to limit to test customers
   - Run manually to verify emails

## Example Customer Data

```json
{
  "id": 1,
  "email": "customer@example.com",
  "name": "Jane Smith",
  "preferences": {
    "categories": ["electronics", "home"],
    "communication": "weekly"
  },
  "segment": "active",
  "purchases": [
    {"product_name": "Wireless Headphones", "amount": 149.99}
  ]
}
```

## Troubleshooting

### Emails not sending
- Verify SMTP credentials
- Check sender domain verification
- Review SMTP server logs

### Database connection failing
- Verify `DATABASE_URL` format
- Check network access to database
- Ensure SSL settings match

### Personalization issues
- Check customer data completeness
- Review AI prompt for edge cases
- Add fallback content for missing data

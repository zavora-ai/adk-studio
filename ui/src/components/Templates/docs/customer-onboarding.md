# AI Customer Onboarding Journey

🎉 Personalized onboarding sequences with engagement tracking

## Overview

Receive new customer signups, use AI to predict their needs based on profile data, create personalized onboarding email sequences, track engagement, and trigger interventions for at-risk customers.

## Workflow

```
Webhook → AI Predict Needs → Create Profile → Set Email Sequence → Loop Emails → AI Personalize → Send Email → Wait → Check Engagement → Route by Engagement → AI Intervention
```

## Required Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `WEBHOOK_SECRET` | Signup webhook authentication | Yes | `whsec_xxx` |
| `DATABASE_URL` | Customer database connection | Yes | `postgresql://...` |
| `SMTP_HOST` | Email server host | Yes | `smtp.sendgrid.net` |
| `SMTP_USER` | SMTP username | Yes | `apikey` |
| `SMTP_PASS` | SMTP password | Yes | `SG.xxx` |
| `FROM_EMAIL` | Sender email address | Yes | `onboarding@company.com` |
| `ANALYTICS_API_KEY` | Product analytics API | No | `xxx` |

## Action Nodes Used

- **Trigger (Webhook)**: Receives new signups
- **Database**: Stores customer profiles and tracks progress
- **Set**: Configures email sequences
- **Loop**: Processes email sequence
- **Email**: Sends personalized emails
- **Wait**: Pauses between emails
- **Switch**: Routes based on engagement

## LLM Agents

### Needs Predictor
Analyzes signup data to predict:
- Primary use case
- Feature interests
- Potential challenges
- Success metrics
- Recommended path

### Email Personalizer
Creates personalized emails:
- Custom greeting
- Relevant feature highlights
- Use case examples
- Next step guidance
- Resource links

### Intervention Creator
For at-risk customers:
- Re-engagement message
- Special offer
- Direct support invitation
- Alternative resources
- Feedback request

## Onboarding Sequence

| Day | Email | Goal |
|-----|-------|------|
| 0 | Welcome | Confirm signup, set expectations |
| 1 | Quick Start | First value moment |
| 3 | Feature Deep Dive | Core feature education |
| 7 | Success Story | Social proof, inspiration |
| 14 | Check-in | Engagement assessment |
| 21 | Advanced Tips | Power user features |
| 30 | Feedback | NPS survey, testimonial request |

## Engagement Scoring

| Signal | Points | Description |
|--------|--------|-------------|
| Email opened | +5 | Basic engagement |
| Link clicked | +10 | Active interest |
| Feature used | +20 | Product engagement |
| Session > 5 min | +15 | Deep engagement |
| Support ticket | +5 | Seeking help (positive) |
| No activity 7d | -20 | Disengagement risk |

**Engagement Tiers:**
- Engaged (70+): Continue sequence
- Moderate (40-69): Add touchpoint
- At-Risk (0-39): Trigger intervention

## Customization Tips

1. **Sequence Length**: Adjust for your product complexity
2. **Timing**: Optimize wait periods based on data
3. **Segments**: Create different paths for user types
4. **Milestones**: Add product-specific success events
5. **A/B Testing**: Test different email variants

## Setup Instructions

1. **Configure Signup Webhook**
   - Add webhook to your signup flow
   - Include user profile data
   - Add authentication

2. **Set Up Database**
   ```sql
   CREATE TABLE onboarding_profiles (
     id SERIAL PRIMARY KEY,
     user_id VARCHAR(100) UNIQUE,
     email VARCHAR(255),
     name VARCHAR(255),
     company VARCHAR(255),
     predicted_use_case VARCHAR(100),
     engagement_score INTEGER DEFAULT 0,
     current_step INTEGER DEFAULT 0,
     status VARCHAR(50) DEFAULT 'active',
     created_at TIMESTAMP DEFAULT NOW(),
     last_activity TIMESTAMP
   );
   
   CREATE TABLE onboarding_events (
     id SERIAL PRIMARY KEY,
     user_id VARCHAR(100),
     event_type VARCHAR(50),
     event_data JSONB,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **Configure Email Templates**
   - Create base templates for each email
   - Add personalization placeholders
   - Set up tracking pixels

4. **Set Up Analytics Integration**
   - Connect to your product analytics
   - Define engagement events
   - Set up score calculation

5. **Test Full Journey**
   - Create test signup
   - Verify email delivery
   - Check engagement tracking

## Example Signup Payload

```json
{
  "userId": "usr_12345",
  "email": "newuser@company.com",
  "name": "Sarah Johnson",
  "company": "TechStartup Inc",
  "companySize": "11-50",
  "role": "Product Manager",
  "signupSource": "google_ads",
  "referrer": "product_hunt",
  "interests": ["automation", "analytics"],
  "trialType": "14_day",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

## Needs Prediction Output

```json
{
  "userId": "usr_12345",
  "predictedNeeds": {
    "primaryUseCase": "workflow_automation",
    "secondaryUseCases": ["reporting", "integrations"],
    "featurePriority": [
      "visual_builder",
      "api_connections",
      "scheduled_runs"
    ],
    "potentialChallenges": [
      "technical_complexity",
      "team_adoption"
    ],
    "successMetrics": [
      "time_saved",
      "processes_automated"
    ]
  },
  "recommendedPath": "automation_focused",
  "estimatedTimeToValue": "3_days",
  "churnRisk": "low",
  "upsellPotential": "high"
}
```

## Personalized Email Example

```markdown
Subject: Sarah, automate your first workflow in 5 minutes ⚡

Hi Sarah,

Welcome to [Product]! Based on your role as a Product Manager at TechStartup Inc, I think you'll love our workflow automation features.

**Your Quick Start Challenge:**
Create your first automated workflow in under 5 minutes:

1. Click "New Workflow" in your dashboard
2. Choose the "Product Launch Checklist" template
3. Connect your Slack workspace
4. Hit "Activate" 🎉

**Why this matters for you:**
Product managers at similar companies save an average of 5 hours/week by automating repetitive tasks like:
- Sprint notifications
- Release announcements  
- Stakeholder updates

[Start Your First Workflow →]

Need help? Reply to this email or book a 15-min onboarding call.

Cheers,
Alex from [Product]

P.S. Check out how [Similar Company] automated their entire release process →
```

## Intervention Email Example

```markdown
Subject: Sarah, we noticed you haven't logged in lately 👋

Hi Sarah,

I noticed you haven't had a chance to explore [Product] since signing up. No worries – getting started with new tools can be overwhelming!

**Here's what I can offer:**

🎯 **15-min personalized demo** - I'll show you exactly how to automate your specific workflows
📚 **Quick start guide** - A 3-step guide tailored for Product Managers
💬 **Direct support** - Reply to this email with any questions

**Or if now isn't the right time:**
- Pause your trial (we'll save your spot)
- Get a trial extension
- Share feedback on what's holding you back

[Book a Quick Call] | [Extend My Trial] | [Share Feedback]

Here to help,
Alex
```

## Troubleshooting

### Emails not sending
- Verify SMTP credentials
- Check email deliverability
- Review bounce logs

### Engagement not tracking
- Verify analytics integration
- Check event firing
- Review tracking pixel setup

### Wrong sequence triggered
- Check needs prediction accuracy
- Review segment criteria
- Verify profile data completeness

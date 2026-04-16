# AI Job Application Bot

💼 Automated job matching, proposal generation, and tracking

## Overview

Monitor job posting feeds, analyze opportunities with AI to match against your profile, generate personalized proposals/cover letters, submit applications, and track your pipeline.

## Workflow

```
RSS Feed → AI Analyze → AI Match Score → Filter Jobs → AI Generate Proposal → Submit Application → Track in Database
```

## Required Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `JOB_FEED_URL` | RSS feed URL for job postings | Yes | `https://jobs.example.com/feed` |
| `PROFILE_PATH` | Path to your profile JSON | Yes | `/config/profile.json` |
| `MIN_MATCH_SCORE` | Minimum score to apply (0-100) | No | `70` |
| `DATABASE_URL` | PostgreSQL for tracking | Yes | `postgresql://...` |
| `APPLICATION_API_KEY` | API key for job platform | No | `xxx` |

## Action Nodes Used

- **RSS**: Monitors job posting feeds
- **Transform**: Extracts job requirements
- **Switch**: Filters by match score
- **HTTP**: Submits applications via API
- **Database**: Tracks application status

## LLM Agents

### Job Analyzer
Extracts from job postings:
- Required skills and experience
- Nice-to-have qualifications
- Company culture indicators
- Salary range (if available)
- Remote/location requirements
- Red flags or concerns

### Match Scorer
Calculates fit score based on:
- Skills match (40%)
- Experience level (25%)
- Industry alignment (15%)
- Location/remote fit (10%)
- Salary expectations (10%)

### Proposal Generator
Creates personalized applications:
- Tailored cover letter
- Highlighted relevant experience
- Specific examples for requirements
- Company-specific customization
- Professional tone matching

## Profile Configuration

Create a profile JSON file:

```json
{
  "name": "Jane Developer",
  "title": "Senior Software Engineer",
  "experience_years": 8,
  "skills": {
    "primary": ["Python", "TypeScript", "React", "AWS"],
    "secondary": ["Go", "Kubernetes", "PostgreSQL"],
    "soft": ["Leadership", "Communication", "Mentoring"]
  },
  "experience": [
    {
      "company": "Tech Corp",
      "role": "Senior Engineer",
      "years": 3,
      "highlights": [
        "Led team of 5 engineers",
        "Reduced deployment time by 60%"
      ]
    }
  ],
  "preferences": {
    "remote": true,
    "salary_min": 150000,
    "industries": ["SaaS", "FinTech", "HealthTech"],
    "company_size": ["startup", "mid-size"]
  },
  "education": {
    "degree": "BS Computer Science",
    "university": "State University"
  }
}
```

## Customization Tips

1. **Multiple Feeds**: Add RSS nodes for different job boards
2. **Score Weights**: Adjust matching criteria importance
3. **Application Templates**: Create role-specific templates
4. **Follow-up Automation**: Add scheduled follow-up emails
5. **Interview Prep**: Generate interview prep based on job

## Setup Instructions

1. **Configure Job Feeds**
   - Find RSS feeds for target job boards
   - LinkedIn, Indeed, and niche boards often have feeds
   - Consider using job aggregator APIs

2. **Create Your Profile**
   - Fill out profile JSON completely
   - Be specific about skills and experience
   - Set realistic preferences

3. **Set Up Tracking Database**
   ```sql
   CREATE TABLE applications (
     id SERIAL PRIMARY KEY,
     job_title VARCHAR(255),
     company VARCHAR(255),
     job_url TEXT,
     match_score INTEGER,
     status VARCHAR(50) DEFAULT 'applied',
     applied_at TIMESTAMP DEFAULT NOW(),
     proposal TEXT,
     notes TEXT,
     follow_up_date DATE
   );
   ```

4. **Test with Low Threshold**
   - Set MIN_MATCH_SCORE to 50 initially
   - Review generated proposals
   - Adjust prompts for quality

## Example Job Analysis

```json
{
  "title": "Senior Full Stack Engineer",
  "company": "TechStartup Inc",
  "requirements": {
    "must_have": ["React", "Node.js", "5+ years experience"],
    "nice_to_have": ["TypeScript", "AWS", "Team lead experience"]
  },
  "match_analysis": {
    "skills_match": 90,
    "experience_match": 85,
    "industry_match": 80,
    "location_match": 100,
    "salary_match": 75,
    "overall_score": 86
  },
  "recommendation": "Strong match - apply with emphasis on React expertise and team leadership"
}
```

## Application Tracking

| Status | Description |
|--------|-------------|
| `applied` | Application submitted |
| `viewed` | Application viewed by recruiter |
| `screening` | Phone screen scheduled |
| `interview` | Interview stage |
| `offer` | Offer received |
| `rejected` | Application rejected |
| `withdrawn` | Withdrew application |

## Troubleshooting

### Low match scores
- Review and update your profile
- Check skill keyword matching
- Adjust scoring weights

### Poor proposal quality
- Add more experience details to profile
- Customize prompts for your industry
- Include specific achievements

### RSS feed issues
- Verify feed URL is valid
- Check for rate limiting
- Try alternative job board feeds

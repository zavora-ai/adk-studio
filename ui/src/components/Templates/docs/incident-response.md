# AI-Powered Incident Response

🚨 Automated incident analysis, classification, and escalation

## Overview

Receive alerts from monitoring systems, analyze logs with AI to identify root causes, search past incidents for solutions, classify severity, and escalate to the appropriate on-call team with AI-generated runbooks.

## Workflow

```
Webhook → AI Analyze Logs → Search Past Incidents → AI Summarize → Route by Severity → Notify PagerDuty → AI Generate Runbook
```

## Required Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `WEBHOOK_SECRET` | Alert webhook authentication | Yes | `whsec_xxx` |
| `ELASTICSEARCH_URL` | Log storage endpoint | Yes | `https://es.example.com` |
| `ELASTICSEARCH_API_KEY` | ES API key | Yes | `xxx` |
| `PINECONE_API_KEY` | Vector DB for past incidents | Yes | `pc-xxx` |
| `PINECONE_INDEX` | Incident history index | Yes | `incidents` |
| `PAGERDUTY_API_KEY` | PagerDuty integration key | Yes | `pd_xxx` |
| `SLACK_WEBHOOK_URL` | Incident channel webhook | Yes | `https://hooks.slack.com/...` |

## Action Nodes Used

- **Trigger (Webhook)**: Receives monitoring alerts
- **HTTP**: Fetches logs and creates PagerDuty incidents
- **Switch**: Routes by severity level
- **Notification**: Alerts on-call teams

## LLM Agents

### Log Analyzer
Analyzes logs and metrics to identify:
- Error patterns and frequencies
- Affected services and dependencies
- Timeline of events
- Potential root causes
- Impact assessment

### Incident Summarizer
Creates incident summary with:
- One-line description
- Affected systems
- User impact
- Timeline
- Similar past incidents

### Runbook Generator
Generates response runbook:
- Immediate actions
- Diagnostic commands
- Rollback procedures
- Escalation criteria
- Communication templates

## Severity Classification

| Level | Criteria | Response Time | Notification |
|-------|----------|---------------|--------------|
| P1 - Critical | Service down, data loss | Immediate | PagerDuty + Slack + Phone |
| P2 - High | Major feature broken | 15 min | PagerDuty + Slack |
| P3 - Medium | Degraded performance | 1 hour | Slack only |
| P4 - Low | Minor issue | Next business day | Email |

## Customization Tips

1. **Alert Sources**: Add Datadog, New Relic, CloudWatch
2. **Severity Rules**: Customize classification criteria
3. **Escalation Paths**: Define team-specific routing
4. **Runbook Templates**: Pre-define common procedures
5. **Post-mortem**: Auto-generate incident reports

## Setup Instructions

1. **Configure Alert Webhook**
   - Set up webhook in monitoring tool
   - Include alert details and context
   - Add authentication header

2. **Set Up Log Access**
   - Configure Elasticsearch connection
   - Ensure read access to relevant indices
   - Set up log retention policy

3. **Initialize Incident Database**
   - Create Pinecone index for past incidents
   - Embed historical incident reports
   - Include resolution details

4. **Configure PagerDuty**
   - Create service integration
   - Set up escalation policies
   - Define on-call schedules

5. **Test Alert Flow**
   - Trigger test alert
   - Verify classification
   - Check notification delivery

## Example Alert Payload

```json
{
  "alertId": "ALT-12345",
  "source": "datadog",
  "timestamp": "2024-01-15T10:30:00Z",
  "title": "High Error Rate on API Gateway",
  "description": "Error rate exceeded 5% threshold",
  "metrics": {
    "error_rate": 8.5,
    "latency_p99": 2500,
    "requests_per_second": 1000
  },
  "tags": {
    "service": "api-gateway",
    "environment": "production",
    "region": "us-east-1"
  },
  "links": {
    "dashboard": "https://app.datadoghq.com/...",
    "logs": "https://app.datadoghq.com/logs/..."
  }
}
```

## Log Analysis Output

```json
{
  "incidentId": "INC-2024-0115-001",
  "severity": "P2",
  "title": "API Gateway 5xx Errors - Database Connection Pool Exhaustion",
  "summary": "High error rate caused by database connection pool exhaustion following traffic spike at 10:25 UTC.",
  "timeline": [
    {"time": "10:25:00", "event": "Traffic spike detected (+150%)"},
    {"time": "10:27:30", "event": "Connection pool warnings in logs"},
    {"time": "10:28:45", "event": "First 5xx errors observed"},
    {"time": "10:30:00", "event": "Alert triggered"}
  ],
  "rootCause": {
    "primary": "Database connection pool exhaustion",
    "contributing": ["Traffic spike", "Undersized pool configuration"]
  },
  "impact": {
    "users_affected": "~5000",
    "requests_failed": "~2500",
    "duration": "ongoing"
  },
  "similarIncidents": [
    {"id": "INC-2023-1201-003", "similarity": 0.89, "resolution": "Increased pool size"}
  ]
}
```

## Generated Runbook Example

```markdown
# Incident Runbook: Database Connection Pool Exhaustion

## Immediate Actions (Do First)
1. Scale up API gateway instances
   ```bash
   kubectl scale deployment api-gateway --replicas=10
   ```

2. Increase connection pool size
   ```bash
   kubectl set env deployment/api-gateway DB_POOL_SIZE=50
   ```

3. Enable connection pool metrics
   ```bash
   curl -X POST http://api-gateway:8080/admin/metrics/enable
   ```

## Diagnostic Commands
```bash
# Check current connections
psql -c "SELECT count(*) FROM pg_stat_activity;"

# View pool status
curl http://api-gateway:8080/admin/pool/status

# Check recent errors
kubectl logs -l app=api-gateway --since=10m | grep ERROR
```

## Rollback Procedure
If scaling doesn't help:
1. Enable circuit breaker
2. Route traffic to backup region
3. Notify customers via status page

## Escalation
- If not resolved in 15 min → Page database team
- If data integrity concerns → Page security team
```

## Troubleshooting

### Alerts not triggering workflow
- Verify webhook URL and authentication
- Check alert payload format
- Review webhook logs

### Log analysis incomplete
- Ensure Elasticsearch access
- Check time range configuration
- Verify index patterns

### PagerDuty not receiving incidents
- Verify API key permissions
- Check service integration
- Review PagerDuty logs

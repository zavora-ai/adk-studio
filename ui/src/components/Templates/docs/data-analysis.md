# Intelligent Data Analysis & Reporting

📊 Automated data extraction, analysis, and report generation

## Overview

Schedule automated data extraction from your database, clean and transform the data, use AI to analyze trends and generate insights, create formatted reports, and distribute them via email.

## Workflow

```
Schedule → Extract Data → Transform → AI Analyze → AI Report → Save File → Email Distribution
```

## Required Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@host:5432/db` |
| `REPORT_STORAGE_PATH` | Path for saving reports | Yes | `/reports` |
| `SMTP_HOST` | SMTP server host | Yes | `smtp.sendgrid.net` |
| `SMTP_USER` | SMTP username | Yes | `apikey` |
| `SMTP_PASS` | SMTP password | Yes | `SG.xxx` |
| `FROM_EMAIL` | Sender email | Yes | `reports@company.com` |
| `REPORT_RECIPIENTS` | Comma-separated emails | Yes | `team@company.com` |

## Action Nodes Used

- **Trigger (Schedule)**: Runs weekly on Monday at 8 AM
- **Database**: Extracts data with SQL queries
- **Transform**: Cleans and aggregates data
- **File**: Saves reports to storage
- **Email**: Distributes reports to stakeholders

## LLM Agents

### Data Analyzer
Analyzes extracted data to identify:
- Key trends and patterns
- Anomalies and outliers
- Period-over-period comparisons
- Statistical summaries
- Actionable insights

### Report Generator
Creates executive-friendly reports with:
- Executive summary
- Key metrics dashboard
- Trend visualizations (described)
- Detailed findings
- Recommendations

## Sample SQL Queries

### Sales Performance
```sql
SELECT 
  DATE_TRUNC('week', order_date) as week,
  COUNT(*) as order_count,
  SUM(total_amount) as revenue,
  AVG(total_amount) as avg_order_value,
  COUNT(DISTINCT customer_id) as unique_customers
FROM orders
WHERE order_date >= NOW() - INTERVAL '4 weeks'
GROUP BY DATE_TRUNC('week', order_date)
ORDER BY week DESC;
```

### Customer Metrics
```sql
SELECT 
  segment,
  COUNT(*) as customer_count,
  AVG(lifetime_value) as avg_ltv,
  AVG(orders_count) as avg_orders
FROM customers
GROUP BY segment;
```

## Customization Tips

1. **Custom Queries**: Modify SQL for your data model
2. **Report Frequency**: Adjust cron schedule (daily, weekly, monthly)
3. **Multiple Reports**: Add parallel branches for different reports
4. **Visualization**: Integrate with charting APIs
5. **Storage Options**: Use S3, Google Drive, or local storage

## Setup Instructions

1. **Configure Database**
   - Ensure read access to required tables
   - Test SQL queries manually first

2. **Set Up Storage**
   - Create reports directory
   - Configure appropriate permissions

3. **Configure Email**
   - Set up SMTP credentials
   - Add recipient list

4. **Customize Analysis**
   - Modify AI prompts for your metrics
   - Define key KPIs to track

5. **Test Report Generation**
   - Run manually first
   - Verify report quality and formatting

## Example Report Output

```markdown
# Weekly Sales Report
**Period:** Jan 8-14, 2024
**Generated:** Jan 15, 2024 08:00 AM

## Executive Summary
Revenue increased 12% week-over-week, driven primarily by 
the new product launch. Customer acquisition remained stable 
while average order value improved by 8%.

## Key Metrics
| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| Revenue | $125,000 | $111,600 | +12% |
| Orders | 1,250 | 1,180 | +6% |
| AOV | $100 | $94.58 | +8% |
| New Customers | 320 | 315 | +2% |

## Insights
1. **Product Launch Success**: New product accounted for 25% of revenue
2. **Returning Customers**: 40% of orders from repeat buyers
3. **Peak Hours**: 2-4 PM showed highest conversion rates

## Recommendations
1. Increase inventory for top-selling new product
2. Launch retargeting campaign for cart abandoners
3. Consider extending peak-hour promotions
```

## Troubleshooting

### Database query timeout
- Add query timeout limits
- Optimize SQL with indexes
- Consider data sampling for large datasets

### Report file not saving
- Check storage path permissions
- Verify disk space availability
- Check file naming conflicts

### Email delivery issues
- Verify SMTP credentials
- Check recipient email validity
- Review spam folder settings

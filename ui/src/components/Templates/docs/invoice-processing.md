# AI Invoice Processing

🧾 Automated invoice extraction, categorization, and approval

## Overview

Monitor email for incoming invoices, extract data using document parsing, use AI to categorize expenses and validate amounts, route through approval workflows, and update your accounting system.

## Workflow

```
Email Monitor → Parse Document → AI Categorize → AI Validate → Route Approval → Update Database → Send Confirmation
```

## Required Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `IMAP_HOST` | Email server host | Yes | `imap.gmail.com` |
| `IMAP_USER` | Email username | Yes | `invoices@company.com` |
| `IMAP_PASS` | Email password/app password | Yes | `xxxx xxxx xxxx xxxx` |
| `DATABASE_URL` | Accounting database connection | Yes | `postgresql://...` |
| `APPROVAL_THRESHOLD` | Amount requiring approval | No | `1000` |
| `SMTP_HOST` | SMTP for confirmations | Yes | `smtp.gmail.com` |

## Action Nodes Used

- **Email (Monitor)**: Watches inbox for invoice attachments
- **Transform**: Parses and extracts invoice data
- **Switch**: Routes based on amount and category
- **Database**: Updates accounting records
- **Email (Send)**: Sends confirmation/approval requests

## LLM Agents

### Invoice Categorizer
Analyzes invoice content to determine:
- Expense category (software, hardware, services, etc.)
- Cost center allocation
- Tax classification
- Recurring vs one-time
- Budget line item

### Invoice Validator
Validates invoice data:
- Vendor verification
- Amount reasonableness
- Duplicate detection
- Policy compliance
- Approval requirements

## Document Parsing

The template uses document parsing to extract:
- Vendor name and address
- Invoice number and date
- Line items with descriptions
- Subtotal, tax, and total
- Payment terms and due date

### Supported Formats
- PDF invoices
- Image attachments (JPG, PNG)
- Email body invoices

## Customization Tips

1. **Approval Thresholds**: Set different limits by category
2. **Multi-level Approval**: Add sequential approvers
3. **Vendor Whitelist**: Auto-approve known vendors
4. **Budget Checking**: Integrate with budget system
5. **ERP Integration**: Connect to QuickBooks, Xero, etc.

## Setup Instructions

1. **Configure Email Monitoring**
   - Create dedicated invoices email
   - Enable IMAP access
   - Generate app password if using Gmail

2. **Set Up Database**
   ```sql
   CREATE TABLE invoices (
     id SERIAL PRIMARY KEY,
     vendor_name VARCHAR(255),
     invoice_number VARCHAR(100),
     invoice_date DATE,
     due_date DATE,
     amount DECIMAL(10,2),
     tax DECIMAL(10,2),
     total DECIMAL(10,2),
     category VARCHAR(100),
     status VARCHAR(50) DEFAULT 'pending',
     approved_by VARCHAR(255),
     approved_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **Configure Approval Workflow**
   - Set approval thresholds
   - Define approver email addresses
   - Set up approval notification templates

4. **Test with Sample Invoice**
   - Forward a test invoice
   - Verify extraction accuracy
   - Check categorization

## Example Invoice Data

```json
{
  "vendor": {
    "name": "Cloud Services Inc",
    "address": "123 Tech Street, San Francisco, CA",
    "taxId": "12-3456789"
  },
  "invoice": {
    "number": "INV-2024-001",
    "date": "2024-01-15",
    "dueDate": "2024-02-15"
  },
  "lineItems": [
    {
      "description": "Monthly SaaS Subscription",
      "quantity": 1,
      "unitPrice": 499.00,
      "total": 499.00
    }
  ],
  "subtotal": 499.00,
  "tax": 44.91,
  "total": 543.91
}
```

## Approval Routing Logic

| Amount | Category | Action |
|--------|----------|--------|
| < $500 | Any | Auto-approve |
| $500-$5000 | Software | Manager approval |
| $500-$5000 | Hardware | Finance approval |
| > $5000 | Any | Director approval |

## Troubleshooting

### Emails not being detected
- Verify IMAP credentials
- Check email folder (INBOX vs subfolder)
- Ensure attachments are present

### Poor extraction accuracy
- Check document quality
- Verify supported formats
- Add vendor-specific parsing rules

### Duplicate invoices
- Enable duplicate detection
- Check invoice number matching
- Review vendor + amount combinations

# E-commerce AI Order Intelligence

🛒 Order fraud detection, inventory check, and personalization

## Overview

Process incoming orders with AI-powered fraud detection, verify inventory availability, calculate shipping options, generate personalized order confirmations, and notify relevant teams.

## Workflow

```
Webhook → AI Fraud Check → Check Inventory → Calculate Shipping → AI Personalize → Send Confirmation → Notify Fulfillment
```

## Required Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `WEBHOOK_SECRET` | Order webhook authentication | Yes | `whsec_xxx` |
| `DATABASE_URL` | Inventory database connection | Yes | `postgresql://...` |
| `SHIPPING_API_KEY` | Shipping provider API key | Yes | `ship_xxx` |
| `SHIPPING_API_URL` | Shipping API endpoint | Yes | `https://api.shippo.com` |
| `SMTP_HOST` | Email server | Yes | `smtp.sendgrid.net` |
| `SLACK_WEBHOOK_URL` | Fulfillment team notifications | Yes | `https://hooks.slack.com/...` |

## Action Nodes Used

- **Trigger (Webhook)**: Receives order events
- **HTTP**: Checks shipping rates and submits labels
- **Database**: Verifies and updates inventory
- **Email**: Sends order confirmations
- **Notification**: Alerts fulfillment team

## LLM Agents

### Fraud Analyzer
Evaluates orders for fraud signals:
- Shipping/billing address mismatch
- High-value first-time orders
- Unusual quantity patterns
- Known fraud indicators
- Velocity checks (multiple orders)

Outputs risk score (0-100) and recommendation.

### Order Personalizer
Creates personalized communications:
- Custom greeting based on customer history
- Product recommendations
- Loyalty program updates
- Delivery expectations
- Support contact info

## Fraud Detection Criteria

| Signal | Risk Points | Description |
|--------|-------------|-------------|
| Address mismatch | +25 | Shipping ≠ Billing |
| New customer + high value | +20 | First order > $500 |
| Express shipping + new | +15 | Rush delivery, no history |
| Multiple failed payments | +30 | Payment retry pattern |
| Known fraud email domain | +40 | Disposable email |
| International + high value | +15 | Cross-border risk |

**Risk Thresholds:**
- 0-30: Auto-approve
- 31-60: Manual review
- 61-100: Auto-decline

## Customization Tips

1. **Fraud Rules**: Adjust risk scoring for your business
2. **Shipping Carriers**: Add multiple carrier options
3. **Inventory Sync**: Real-time vs batch updates
4. **Upsell Logic**: Add product recommendations
5. **Multi-warehouse**: Route to nearest fulfillment center

## Setup Instructions

1. **Configure Order Webhook**
   - Set up webhook in your e-commerce platform
   - Shopify, WooCommerce, or custom
   - Include full order payload

2. **Set Up Inventory Database**
   ```sql
   CREATE TABLE inventory (
     sku VARCHAR(50) PRIMARY KEY,
     product_name VARCHAR(255),
     quantity INTEGER,
     reserved INTEGER DEFAULT 0,
     warehouse VARCHAR(50),
     reorder_point INTEGER
   );
   
   CREATE TABLE orders (
     id SERIAL PRIMARY KEY,
     order_number VARCHAR(50) UNIQUE,
     customer_email VARCHAR(255),
     status VARCHAR(50),
     fraud_score INTEGER,
     total DECIMAL(10,2),
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **Configure Shipping**
   - Set up Shippo, EasyPost, or carrier APIs
   - Define shipping zones and rates
   - Configure label generation

4. **Test Order Flow**
   - Submit test orders
   - Verify fraud detection
   - Check inventory updates

## Example Order Payload

```json
{
  "orderNumber": "ORD-12345",
  "customer": {
    "email": "customer@example.com",
    "name": "John Smith",
    "isFirstOrder": false,
    "totalOrders": 5,
    "lifetimeValue": 750.00
  },
  "billing": {
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US"
  },
  "shipping": {
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US",
    "method": "standard"
  },
  "items": [
    {
      "sku": "PROD-001",
      "name": "Wireless Headphones",
      "quantity": 1,
      "price": 149.99
    }
  ],
  "totals": {
    "subtotal": 149.99,
    "shipping": 5.99,
    "tax": 13.50,
    "total": 169.48
  },
  "payment": {
    "method": "credit_card",
    "last4": "4242",
    "status": "captured"
  }
}
```

## Fraud Analysis Output

```json
{
  "orderId": "ORD-12345",
  "riskScore": 15,
  "riskLevel": "low",
  "signals": [
    {"signal": "returning_customer", "points": -10, "note": "5 previous orders"},
    {"signal": "address_match", "points": 0, "note": "Billing = Shipping"},
    {"signal": "standard_shipping", "points": 0, "note": "No rush indicators"}
  ],
  "recommendation": "approve",
  "confidence": 0.95,
  "notes": "Low-risk returning customer with consistent order pattern"
}
```

## Troubleshooting

### Orders not processing
- Verify webhook URL and secret
- Check payload format matches expected
- Review error logs

### Inventory sync issues
- Ensure database connection is stable
- Check for race conditions
- Implement inventory locking

### Shipping calculation errors
- Verify address format
- Check carrier API status
- Validate package dimensions

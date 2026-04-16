# AI Code Review & QA

🔍 Automated code review, security scanning, and test suggestions

## Overview

Receive pull request webhooks, fetch the code diff, use AI to perform comprehensive code review, scan for security vulnerabilities, suggest tests, and post review comments back to the PR.

## Workflow

```
Webhook → Fetch Diff → AI Review → AI Security Scan → AI Suggest Tests → Post Comments → Notify Team
```

## Required Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `GITHUB_TOKEN` | GitHub personal access token | Yes | `ghp_xxx` |
| `GITHUB_WEBHOOK_SECRET` | Webhook signature secret | Yes | `whsec_xxx` |
| `SLACK_WEBHOOK_URL` | Team notification webhook | No | `https://hooks.slack.com/...` |

## Action Nodes Used

- **Trigger (Webhook)**: Receives PR events from GitHub
- **HTTP**: Fetches diff and posts comments
- **Notification**: Alerts team of critical findings

## LLM Agents

### Code Reviewer
Performs comprehensive review:
- Code quality and readability
- Best practices adherence
- Performance considerations
- Error handling
- Documentation completeness
- Naming conventions

### Security Scanner
Identifies security issues:
- SQL injection vulnerabilities
- XSS potential
- Hardcoded secrets
- Insecure dependencies
- Authentication flaws
- Input validation gaps

### Test Suggester
Recommends tests:
- Unit test cases
- Edge cases to cover
- Integration test scenarios
- Mock requirements
- Test data suggestions

## Review Categories

| Category | Priority | Auto-block PR |
|----------|----------|---------------|
| Security Critical | P0 | Yes |
| Security Warning | P1 | No |
| Bug Risk | P1 | No |
| Performance | P2 | No |
| Code Quality | P3 | No |
| Style/Formatting | P4 | No |

## Customization Tips

1. **Language-Specific Rules**: Add prompts for your tech stack
2. **Team Standards**: Include your style guide
3. **Auto-Approve**: Set criteria for auto-approval
4. **Custom Checks**: Add domain-specific validations
5. **GitLab/Bitbucket**: Adapt for other platforms

## Setup Instructions

1. **Create GitHub Token**
   - Go to GitHub Settings → Developer Settings
   - Generate token with `repo` scope
   - Save as `GITHUB_TOKEN`

2. **Configure Webhook**
   - Go to repo Settings → Webhooks
   - Add webhook URL
   - Select "Pull requests" events
   - Add webhook secret

3. **Set Review Standards**
   - Customize AI prompts for your team
   - Define blocking vs non-blocking issues
   - Set up approval criteria

4. **Test with Sample PR**
   - Create test PR
   - Verify review comments
   - Check notification delivery

## Example PR Webhook Payload

```json
{
  "action": "opened",
  "number": 42,
  "pull_request": {
    "id": 123456,
    "number": 42,
    "title": "Add user authentication",
    "body": "Implements JWT-based authentication",
    "head": {
      "sha": "abc123",
      "ref": "feature/auth"
    },
    "base": {
      "sha": "def456",
      "ref": "main"
    },
    "user": {
      "login": "developer"
    },
    "diff_url": "https://github.com/org/repo/pull/42.diff",
    "changed_files": 5,
    "additions": 250,
    "deletions": 30
  },
  "repository": {
    "full_name": "org/repo"
  }
}
```

## Code Review Output

```json
{
  "prNumber": 42,
  "overallScore": 7.5,
  "recommendation": "approve_with_comments",
  "summary": "Good implementation of JWT auth. A few security improvements recommended.",
  "comments": [
    {
      "file": "src/auth/jwt.ts",
      "line": 45,
      "severity": "warning",
      "category": "security",
      "message": "Consider using a longer JWT expiration for refresh tokens",
      "suggestion": "const REFRESH_TOKEN_EXPIRY = '7d';"
    },
    {
      "file": "src/auth/middleware.ts",
      "line": 23,
      "severity": "info",
      "category": "quality",
      "message": "Extract token validation to a separate function for reusability",
      "suggestion": "function validateToken(token: string): TokenPayload { ... }"
    }
  ],
  "securityFindings": [
    {
      "severity": "medium",
      "type": "hardcoded_secret",
      "file": "src/config.ts",
      "line": 12,
      "message": "JWT secret should be loaded from environment variable",
      "cwe": "CWE-798"
    }
  ],
  "suggestedTests": [
    {
      "file": "src/auth/jwt.ts",
      "testCases": [
        "should generate valid JWT token",
        "should reject expired tokens",
        "should handle invalid signatures",
        "should extract user ID from token"
      ]
    }
  ]
}
```

## GitHub Comment Format

```markdown
## 🤖 AI Code Review

### Summary
Good implementation of JWT auth. A few security improvements recommended.

**Overall Score:** 7.5/10 | **Recommendation:** Approve with comments

---

### 🔒 Security Findings

#### ⚠️ Medium: Hardcoded Secret
**File:** `src/config.ts:12`

JWT secret should be loaded from environment variable.

```diff
- const JWT_SECRET = 'my-secret-key';
+ const JWT_SECRET = process.env.JWT_SECRET;
```

---

### 💡 Suggestions

#### `src/auth/middleware.ts:23`
Extract token validation to a separate function for reusability.

---

### 🧪 Suggested Tests

For `src/auth/jwt.ts`:
- [ ] should generate valid JWT token
- [ ] should reject expired tokens
- [ ] should handle invalid signatures
- [ ] should extract user ID from token

---
*Review generated by ADK Studio AI Code Review*
```

## Troubleshooting

### Webhook not triggering
- Verify webhook URL is accessible
- Check webhook secret matches
- Review GitHub webhook delivery logs

### Comments not posting
- Verify GitHub token has `repo` scope
- Check rate limits
- Ensure PR is still open

### Review quality issues
- Add more context to prompts
- Include coding standards
- Provide example reviews

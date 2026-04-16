# Social Media AI Content Creator

📱 Auto-generate platform-specific posts from content sources

## Overview

Monitor your blog RSS feed or receive webhooks for new content, then use AI to adapt the content for each social media platform (Twitter, LinkedIn, Facebook) with appropriate tone, length, and hashtags.

## Workflow

```
RSS Feed → Extract Content → Set Platforms → Loop Platforms → AI Adapt → Post to Twitter → Post to LinkedIn
```

## Required Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `TWITTER_BEARER_TOKEN` | Twitter API Bearer token | No | `AAAAAxx` |
| `LINKEDIN_ACCESS_TOKEN` | LinkedIn API access token | No | `AQVxx` |
| `LINKEDIN_PERSON_ID` | LinkedIn Person URN ID | No | `abc123` |
| `FACEBOOK_PAGE_TOKEN` | Facebook Page access token | No | `EAAxx` |
| `FACEBOOK_PAGE_ID` | Facebook Page ID | No | `123456789` |

## Action Nodes Used

- **RSS**: Monitors blog feed for new posts
- **Transform**: Extracts and structures content
- **Set**: Configures target platforms
- **Loop**: Processes each platform
- **HTTP**: Posts to social media APIs

## LLM Agents

### Content Adapter
Adapts content for each platform following guidelines:
- **Twitter**: Max 280 chars, hashtags, engaging hook
- **LinkedIn**: Professional tone, 1-3 paragraphs, thought leadership
- **Facebook**: Conversational, encourage engagement, emojis

Outputs:
- Platform-specific content
- Relevant hashtags (3-5)
- Character count
- Media recommendations
- Best posting time

## Customization Tips

1. **Add/Remove Platforms**: Modify the platforms array in Set node
2. **Brand Voice**: Customize AI prompts for your tone
3. **Image Generation**: Add AI image generation for visual content
4. **Scheduling**: Add Wait nodes for optimal posting times
5. **Analytics**: Add HTTP nodes to track post performance

## Setup Instructions

1. **Configure RSS Feed**
   - Update `feedUrl` with your blog's RSS URL
   - Adjust `pollInterval` for check frequency

2. **Set Up Twitter API**
   - Create a Twitter Developer account
   - Generate Bearer token with tweet.write scope

3. **Set Up LinkedIn API**
   - Create LinkedIn app in Developer Portal
   - Get access token with w_member_social scope

4. **Set Up Facebook API**
   - Create Facebook App
   - Get Page access token with pages_manage_posts permission

5. **Test with Single Platform**
   - Enable only one platform initially
   - Verify posts appear correctly

## Example RSS Entry

```xml
<item>
  <title>10 Tips for Better Productivity</title>
  <link>https://blog.example.com/productivity-tips</link>
  <description>Discover proven strategies to boost your daily productivity...</description>
  <pubDate>Mon, 15 Jan 2024 10:00:00 GMT</pubDate>
  <author>Jane Smith</author>
</item>
```

## Platform-Specific Output Examples

### Twitter
```
🚀 10 game-changing productivity tips that actually work!

From time-blocking to the 2-minute rule, these strategies helped me 3x my output.

Read more: https://blog.example.com/productivity-tips

#Productivity #TimeManagement #WorkSmarter #Tips
```

### LinkedIn
```
I've spent years optimizing my workflow, and these 10 productivity strategies have been transformative.

Key insights:
• Time-blocking isn't just scheduling—it's protecting your focus
• The 2-minute rule eliminates decision fatigue
• Strategic breaks actually increase output

What productivity hack has made the biggest difference for you?

Read the full article: https://blog.example.com/productivity-tips

#Productivity #ProfessionalDevelopment #Leadership
```

## Troubleshooting

### RSS not detecting new posts
- Verify RSS feed URL is accessible
- Check `seenTracking` state for duplicates
- Increase `pollInterval` if rate limited

### Twitter posting fails
- Verify Bearer token has write permissions
- Check for duplicate content (Twitter rejects)
- Ensure content is under 280 characters

### LinkedIn posting fails
- Verify access token hasn't expired
- Check Person URN ID is correct
- Ensure proper content formatting

# Email Integration & Auto-Skill Generation

Assist can automatically connect to your email, analyze your communication patterns, and create custom tools to help you stay organized - all without you having to ask!

## How It Works

1. **Connect Your Email**: Users can connect their email account through the API
2. **Automatic Analysis**: Assist analyzes your emails to understand:
   - Your profession/industry
   - Key contacts and relationships
   - Common topics and patterns
   - Communication frequency

3. **Auto-Generate Skills**: Based on the analysis, Assist automatically creates custom tools:
   - **Concert Promoters**: Booking manager that organizes offers, prioritizes high-value artists, and tracks agent relationships
   - More profession-specific tools coming soon!

## Example: Concert Promoter Booking Manager

When Assist detects you're a concert promoter, it automatically creates a **Booking Manager** skill that:

- **Organizes emails by booking agent** - Groups all offers by agent
- **Prioritizes high-value artists** - Ranks offers by potential value
- **Tracks relationships** - Remembers which agents you work with most
- **Categorizes by priority** - High/Medium/Low priority based on:
  - Relationship strength with agent
  - Artist value indicators
  - Recent activity

## API Endpoints

### Connect Email
```
POST /api/email/connect
{
  "email": "user@example.com",
  "password": "password",
  "imap_server": "imap.gmail.com",
  "imap_port": 993
}
```

### Analyze Emails
```
POST /api/email/analyze
{
  "days": 30,
  "limit": 100
}
```

### Auto-Generate Skill
```
POST /api/skills/auto-generate
```

### Get Auto-Generated Skills
```
GET /api/skills/auto-generated
```

## Security

- Email passwords are stored locally (should be encrypted in production)
- All email processing happens locally
- No data is sent to external services
- Skills are user-specific and isolated

## Future Enhancements

- More profession-specific skills
- Automatic calendar integration
- Smart email responses
- Task extraction from emails
- Relationship insights dashboard


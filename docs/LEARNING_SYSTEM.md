# Organic Learning System

## Overview

The AssisantAI learning system learns about users naturally through conversation, without being creepy or intrusive. It extracts insights organically and uses them to provide better, more personalized service.

## Philosophy: Learning Without Being Creepy

### What We Do ✅
- Learn through natural conversation
- Remember preferences you explicitly mention
- Notice patterns you demonstrate
- Build understanding over time
- Use insights to be more helpful

### What We Don't Do ❌
- Track you across the web
- Store sensitive personal information without context
- Make assumptions without evidence
- Share data with third parties
- Be intrusive or pushy

## How It Works

### 1. Natural Learning

The system learns from conversations automatically:

```
User: "I prefer dark mode interfaces"
→ Learns: preference.dark_mode = true

User: "I'm working on a 3D printing project"
→ Learns: interest.3d_printing = true, goal.current_project = "3D printing"

User: "I always forget to save my work"
→ Learns: pattern.work_style = "needs reminders"
```

### 2. Confidence Scoring

Each insight has a confidence score (0-1):
- **High confidence (0.7+)**: Explicitly stated, repeated multiple times
- **Medium confidence (0.4-0.7)**: Implied or mentioned once
- **Low confidence (<0.4)**: Tentative or uncertain

Only high-confidence insights are used for personalization.

### 3. Organic Extraction

Insights are extracted naturally:
- No questionnaires or forms
- No "tell me about yourself" prompts
- Just normal conversation
- Learning happens in the background

## Insight Categories

### Preferences
Things the user likes or prefers:
- Design style (minimalist, colorful, etc.)
- Communication style (brief, detailed, etc.)
- Work patterns (morning person, night owl, etc.)

### Interests
Topics the user is interested in:
- Hobbies and activities
- Professional interests
- Learning goals

### Goals
What the user wants to achieve:
- Current projects
- Long-term objectives
- Aspirations

### Patterns
Behavioral patterns:
- Work style
- Communication preferences
- Problem-solving approach

### Context
Situational information:
- Current projects
- Active tasks
- Recent activities

### Skills
What the user knows or is learning:
- Technical skills
- Creative abilities
- Areas of expertise

## Usage

### Automatic Learning

Learning happens automatically - no code needed:

```typescript
// When user sends a message, learning happens automatically
const response = await agent.sendMessage("I love minimalist design");
// System learns: preference.design_style = "minimalist"
```

### Getting Insights

```typescript
import { Learner } from '@assisant-ai/learner';

const learner = new Learner('http://localhost:3000', token);

// Get all insights
const insights = await learner.getInsights();

// Get insights by category
const preferences = await learner.getInsights('preference');

// Get specific insight
const designStyle = await learner.getInsight('preference', 'design_style');
```

### Personalization Context

The system automatically provides personalization context to the agent:

```typescript
// Automatically included in agent messages
const context = await learner.getPersonalizationContext();
// Returns: "User preferences: dark_mode: true, design_style: minimalist. 
//           User interests: 3D printing, logo design. 
//           User goals: launch coffee shop brand."
```

## Example Learning Scenarios

### Scenario 1: Design Preferences

```
User: "I like clean, minimalist designs"
Agent: "Got it! I'll keep that in mind for future designs."
→ Learns: preference.design_style = "minimalist"

Later...
User: "Can you design a logo?"
Agent: "I'll create a minimalist logo for you, matching your preference for clean designs."
```

### Scenario 2: Work Patterns

```
User: "I always work better in the morning"
Agent: "Noted! I'll schedule important tasks for morning hours."
→ Learns: pattern.work_style = "morning person"

Later...
User: "When should I work on this project?"
Agent: "Based on your preference, I'd suggest working on it in the morning when you're most productive."
```

### Scenario 3: Interests

```
User: "I'm really into 3D printing lately"
Agent: "That's great! I can help with 3D printing projects."
→ Learns: interest.3d_printing = true

Later...
User: "What should I work on next?"
Agent: "Since you're interested in 3D printing, maybe we could design something new to print?"
```

## Privacy & Data

### What's Stored
- Insights extracted from conversations
- Confidence scores
- Source references (conversation IDs)
- Timestamps

### What's NOT Stored
- Raw conversation data (unless in PersonalAI)
- Personal identifiers beyond user ID
- Sensitive information without context
- Tracking data

### Data Location
- All data stored locally in PersonalAI backend
- No cloud storage
- No third-party sharing
- User has full control

## Best Practices

### For Users
- Just have normal conversations
- The system learns naturally
- You can mention preferences explicitly
- No need to "teach" the system

### For Developers
- Learning happens automatically
- Don't manually trigger learning
- Use insights for personalization
- Respect user privacy

## API Endpoints

### Learn from Conversation
```
POST /api/learner/learn
Body: { message, response, context }
```

### Get Insights
```
GET /api/learner/insights?category=preference
```

### Get Personalization Context
```
GET /api/learner/personalization
Returns: { context: "User preferences: ..." }
```

## Integration

The learning system is automatically integrated:

1. **Agent Messages**: Automatically includes personalization context
2. **Conversations**: Automatically learns from each exchange
3. **Background Processing**: Learning happens asynchronously
4. **Non-Blocking**: Learning failures don't break conversations

## Future Enhancements

- Insight expiration (forgot preferences)
- Insight confidence decay over time
- User review/correction of insights
- Insight export for user review
- Privacy controls (disable learning)

---

*"Learning about you, to serve you better - naturally and respectfully."*


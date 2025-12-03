# Learning System Examples

Real-world examples of how the organic learning system works in practice.

## Example 1: Design Preferences

**Conversation:**
```
User: "I really like clean, minimalist designs"
Agent: "I'll keep that in mind for future designs!"
```

**What's Learned:**
```json
{
  "category": "preference",
  "key": "design_style",
  "value": "minimalist",
  "confidence": 0.8,
  "sources": ["conv_123"],
  "firstLearned": "2024-01-15T10:00:00Z"
}
```

**Later Use:**
```
User: "Can you design a logo?"
Agent: "I'll create a minimalist logo for you, matching your preference for clean designs."
```

## Example 2: Work Patterns

**Conversation:**
```
User: "I always work better in the morning"
Agent: "Noted! I'll schedule important tasks for morning hours."
```

**What's Learned:**
```json
{
  "category": "pattern",
  "key": "work_style",
  "value": "morning person",
  "confidence": 0.9,
  "sources": ["conv_124"]
}
```

**Later Use:**
```
User: "When should I work on this project?"
Agent: "Based on your preference, I'd suggest working on it in the morning when you're most productive."
```

## Example 3: Interests & Goals

**Conversation:**
```
User: "I'm really into 3D printing lately, working on a coffee shop project"
Agent: "That's exciting! I can help with both 3D printing and your coffee shop project."
```

**What's Learned:**
```json
[
  {
    "category": "interest",
    "key": "3d_printing",
    "value": true,
    "confidence": 0.85
  },
  {
    "category": "goal",
    "key": "current_project",
    "value": "coffee shop",
    "confidence": 0.8
  }
]
```

**Later Use:**
```
User: "What should I work on next?"
Agent: "Since you're interested in 3D printing and working on your coffee shop, maybe we could design some custom coffee shop accessories to 3D print?"
```

## Example 4: Communication Style

**Conversation:**
```
User: "Just give me the short version"
Agent: "Got it - I'll keep responses brief."
```

**What's Learned:**
```json
{
  "category": "preference",
  "key": "communication_style",
  "value": "brief",
  "confidence": 0.75
}
```

**Later Use:**
```
User: "Tell me about 3D printing"
Agent: "3D printing creates objects layer by layer from digital models. Want details on a specific aspect?"
```

## Example 5: Skill Level

**Conversation:**
```
User: "I'm new to CAD design"
Agent: "No problem! I'll explain things step by step."
```

**What's Learned:**
```json
{
  "category": "skill",
  "key": "cad_design",
  "value": "beginner",
  "confidence": 0.9
}
```

**Later Use:**
```
User: "How do I create a 3D model?"
Agent: "Since you're new to CAD, I'll walk you through it step by step. First, we'll start with basic shapes..."
```

## Example 6: Cross-App Learning

**In 3D Printing App:**
```
User: "I prefer functional designs over decorative ones"
Agent: "I'll focus on functionality in future designs."
```

**In Logo Designer App (Later):**
```
User: "Design a logo"
Agent: "I'll create a functional, clean logo that works well in practical applications, matching your preference for functional design."
```

The system shares insights across apps!

## Example 7: Confidence Building

**First Mention:**
```
User: "I like blue"
→ Confidence: 0.5 (mentioned once, could be temporary)
```

**Second Mention:**
```
User: "Make it blue, I always prefer blue"
→ Confidence: 0.8 (repeated, explicitly stated as preference)
```

**Third Mention:**
```
User: "Blue again, as usual"
→ Confidence: 0.95 (established pattern)
```

## Example 8: Contextual Learning

**Conversation:**
```
User: "I'm working on a startup called Bean Dreams"
Agent: "That sounds exciting! What kind of startup?"
User: "It's a coffee shop"
Agent: "A coffee shop startup - I'll help you build it!"
```

**What's Learned:**
```json
[
  {
    "category": "context",
    "key": "current_project",
    "value": "Bean Dreams coffee shop",
    "confidence": 0.9
  },
  {
    "category": "goal",
    "key": "startup",
    "value": "launch coffee shop",
    "confidence": 0.85
  }
]
```

**Later Use:**
```
User: "What should I work on?"
Agent: "For your Bean Dreams coffee shop, we could work on branding, menu design, or 3D printed accessories. What's most important right now?"
```

## Example 9: Pattern Recognition

**Multiple Conversations:**
```
Day 1: "I work best in the morning"
Day 3: "Morning is my productive time"
Day 7: "I always schedule important things for morning"
```

**What's Learned:**
```json
{
  "category": "pattern",
  "key": "work_style",
  "value": "morning person",
  "confidence": 0.95,
  "frequency": 3,
  "sources": ["conv_125", "conv_130", "conv_140"]
}
```

## Example 10: Preference Refinement

**Initial Learning:**
```
User: "I like modern design"
→ Learns: preference.design_style = "modern" (confidence: 0.6)
```

**Refinement:**
```
User: "Actually, I prefer minimalist modern, not flashy modern"
→ Updates: preference.design_style = "minimalist modern" (confidence: 0.85)
```

The system refines understanding over time!

---

*"Learning happens naturally, making every conversation better than the last."*


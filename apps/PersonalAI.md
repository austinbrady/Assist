# PersonalAI

PersonalAI (formerly JailbreakAI) is a comprehensive local AI assistant platform that provides:

- **Chat**: Unrestricted AI conversations with personal assistants
- **Image Generation & Editing**: Create and edit images from text prompts
- **Video Generation & Editing**: Generate and process videos
- **Song Writing**: Write songs with "For fans of" inspiration
- **Skills System**: Powerful automation system with 20+ built-in skills
- **100% Local**: All processing on your machine, no cloud dependencies

## Location

PersonalAI is located at: `/Volumes/Austin's Flash Drive (Mac)/JailbreakAI`

## Integration Status

PersonalAI serves as the **base backend** for the AssistantAI ecosystem, providing:
- User authentication and management
- Agent infrastructure and persistence
- Skill execution system
- File management
- Memory management

## Skills Available

PersonalAI includes a comprehensive skills system:

1. **Email Management** - Organize, filter, and respond to emails
2. **Calendar & Scheduling** - Manage calendar, schedule meetings, set reminders
3. **Document Creation** - Write, edit, and format documents
4. **To-Do List** - Create, manage, and organize tasks
5. **Bills** - Track, organize, and manage bills and payments
6. **Budget** - Create and manage budgets, track expenses
7. **Business Manager** - Complete business dashboard with expenses, income, profit, customers
8. **CRM** - Customer Relationship Management
9. **Expense Calculator** - Track and calculate expenses
10. **Meal Planning** - Plan meals for week or month
11. **Code Assistance** - Read, write, create files/folders, execute code
12. **Data Analysis** - Analyze data, create reports
13. **Content Generation** - Create blog posts, social media content
14. **Image Editing** - Edit, enhance, and transform images
15. **Video Processing** - Edit, process, and enhance videos
16. **Research** - Research topics, summarize information
17. **Task Automation** - Automate repetitive tasks
18. **Translation** - Translate text between languages
19. **Meeting Notes** - Take notes, create summaries

## Configuration

PersonalAI runs on:
- **Backend**: Port 8000 (default)
- **Frontend**: Port 7777 (default)

## Installation

PersonalAI has its own installer. See the main PersonalAI README for installation instructions.

## Relationship to AssistantAI

PersonalAI is both:
1. **A standalone app** - Can be used independently
2. **The base backend** - Provides authentication, agent infrastructure, and core services for all AssistantAI apps

When AssistantAI runs, it:
1. Installs PersonalAI (if not already installed)
2. Installs MVP Assistant (sister app)
3. Connects all apps through the middleware layer
4. Provides unified authentication and agent access

## Sister Apps

- **MVP Assistant** - Another child app in the AssistantAI ecosystem


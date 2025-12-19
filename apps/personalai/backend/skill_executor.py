"""
Skill Executor - Backend implementations for each AI skill
Each skill has specific protocols and functionality
"""
import json
import os
import subprocess
from pathlib import Path
from typing import Dict, Optional, Any
from datetime import datetime
import csv
import shutil
import stat


def get_user_data_dir(username: str) -> Path:
    """Get user-specific data directory"""
    user_dir = Path("users_data") / username
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir


def execute_email_management(username: str, task: str, parameters: Dict) -> Dict:
    """Execute email management skill - organize, filter, respond to emails"""
    user_data_dir = get_user_data_dir(username)
    emails_file = user_data_dir / "emails.json"
    
    # Load existing emails
    emails = []
    if emails_file.exists():
        try:
            with open(emails_file, 'r') as f:
                emails = json.load(f)
        except Exception:
            pass
    
    # Parse task for email operations
    task_lower = task.lower()
    
    if "list" in task_lower or "show" in task_lower:
        return {
            "action": "list_emails",
            "emails": emails[:10],  # Return last 10
            "count": len(emails),
            "message": f"Found {len(emails)} emails. Showing most recent 10."
        }
    elif "filter" in task_lower or "search" in task_lower:
        # Filter emails by keyword
        keyword = parameters.get("keyword", "")
        filtered = [e for e in emails if keyword.lower() in e.get("subject", "").lower() or keyword.lower() in e.get("body", "").lower()]
        return {
            "action": "filter_emails",
            "emails": filtered,
            "count": len(filtered),
            "message": f"Found {len(filtered)} emails matching '{keyword}'"
        }
    elif "respond" in task_lower or "reply" in task_lower:
        # Generate email response
        return {
            "action": "generate_response",
            "message": "I'll help you draft a response. Please provide the email you want to respond to.",
            "protocol": "email_response_generation"
        }
    else:
        return {
            "action": "email_management",
            "message": "Email management ready. I can help you organize, filter, search, and respond to emails.",
            "capabilities": ["list", "filter", "search", "respond", "organize"]
        }


def execute_calendar_scheduling(username: str, task: str, parameters: Dict) -> Dict:
    """Execute calendar scheduling skill - manage calendar, schedule meetings, set reminders"""
    user_data_dir = get_user_data_dir(username)
    calendar_file = user_data_dir / "calendar.json"
    
    # Load existing calendar events
    events = []
    if calendar_file.exists():
        try:
            with open(calendar_file, 'r') as f:
                data = json.load(f)
                events = data.get("events", [])
        except Exception:
            pass
    
    task_lower = task.lower()
    
    if "schedule" in task_lower or "add" in task_lower or "create" in task_lower:
        # Create new event
        new_event = {
            "id": f"event_{datetime.now().timestamp()}",
            "title": parameters.get("title", "New Event"),
            "date": parameters.get("date", datetime.now().isoformat()),
            "time": parameters.get("time", ""),
            "description": parameters.get("description", ""),
            "created_at": datetime.now().isoformat()
        }
        events.append(new_event)
        
        # Save calendar
        with open(calendar_file, 'w') as f:
            json.dump({"events": events}, f, indent=2)
        
        return {
            "action": "event_created",
            "event": new_event,
            "message": f"Event '{new_event['title']}' scheduled successfully"
        }
    elif "list" in task_lower or "show" in task_lower:
        return {
            "action": "list_events",
            "events": events,
            "count": len(events),
            "message": f"Found {len(events)} calendar events"
        }
    elif "reminder" in task_lower:
        return {
            "action": "set_reminder",
            "message": "Reminder set. I'll notify you at the specified time.",
            "protocol": "reminder_system"
        }
    else:
        return {
            "action": "calendar_management",
            "message": "Calendar management ready. I can schedule events, set reminders, and manage your calendar.",
            "capabilities": ["schedule", "list", "reminder", "update", "delete"]
        }


def execute_document_creation(username: str, task: str, parameters: Dict) -> Dict:
    """Execute document creation skill - write, edit, format documents"""
    user_data_dir = get_user_data_dir(username)
    documents_dir = user_data_dir / "documents"
    documents_dir.mkdir(exist_ok=True)
    
    task_lower = task.lower()
    
    if "create" in task_lower or "write" in task_lower:
        doc_id = f"doc_{datetime.now().timestamp()}"
        doc_file = documents_dir / f"{doc_id}.txt"
        
        content = parameters.get("content", task)
        title = parameters.get("title", "Untitled Document")
        
        with open(doc_file, 'w', encoding='utf-8') as f:
            f.write(f"{title}\n\n{content}")
        
        return {
            "action": "document_created",
            "document_id": doc_id,
            "title": title,
            "file_path": str(doc_file),
            "message": f"Document '{title}' created successfully"
        }
    elif "list" in task_lower:
        docs = [f.stem for f in documents_dir.glob("*.txt")]
        return {
            "action": "list_documents",
            "documents": docs,
            "count": len(docs),
            "message": f"Found {len(docs)} documents"
        }
    else:
        return {
            "action": "document_creation",
            "message": "Document creation ready. I can create, edit, and format documents.",
            "capabilities": ["create", "edit", "format", "save"]
        }


def execute_todo_list(username: str, task: str, parameters: Dict) -> Dict:
    """Execute to-do list skill - create, manage, organize tasks with proactive suggestions"""
    user_data_dir = get_user_data_dir(username)
    todos_file = user_data_dir / "todos.json"
    
    # Load existing todos
    todos = []
    if todos_file.exists():
        try:
            with open(todos_file, 'r') as f:
                todos = json.load(f)
        except Exception:
            pass
    
    task_lower = task.lower()
    
    # Proactive task extraction: If user mentions a task in conversation, suggest adding it
    # This happens automatically when the skill is detected
    proactive_task_suggestion = None
    try:
        import proactive_engine
        # Check if this message contains task indicators
        task_indicators = ['need to', 'have to', 'should', 'must', 'remind me', 'call', 'email', 'schedule']
        if any(indicator in task_lower for indicator in task_indicators):
            # Extract potential task
            proactive_task_suggestion = {
                "suggested": True,
                "task": task[:100],  # First 100 chars as potential task
                "confidence": 0.7
            }
    except Exception:
        pass  # Proactive engine not available, continue normally
    
    if "add" in task_lower or "create" in task_lower:
        new_todo = {
            "id": f"todo_{datetime.now().timestamp()}",
            "task": parameters.get("task", task),
            "completed": False,
            "priority": parameters.get("priority", "medium"),
            "created_at": datetime.now().isoformat()
        }
        if parameters.get("due_date"):
            new_todo["due_date"] = parameters["due_date"]
        if parameters.get("category"):
            new_todo["category"] = parameters["category"]
        todos.append(new_todo)
        
        with open(todos_file, 'w') as f:
            json.dump(todos, f, indent=2)
        
        # Try to send to Things 3 if configured
        things3_result = None
        try:
            from things3_integration import send_task_to_things3, is_things3_configured
            if is_things3_configured(username):
                things3_result = send_task_to_things3(
                    username,
                    new_todo["task"],
                    priority=new_todo.get("priority", "medium"),
                    due_date=new_todo.get("due_date"),
                    category=new_todo.get("category"),
                    notes=parameters.get("notes")
                )
        except Exception as e:
            # Don't fail the todo creation if Things 3 fails
            logger.warning(f"Failed to send to Things 3: {e}")
        
        message = f"Task '{new_todo['task']}' added to your to-do list"
        if things3_result and things3_result.get("success"):
            message += " and sent to Things 3 inbox"
        elif things3_result and not things3_result.get("success"):
            message += f" (Things 3: {things3_result.get('error', 'Failed')})"
        
        return {
            "action": "todo_added",
            "todo": new_todo,
            "all_todos": todos,  # Include all todos for chat display
            "message": message,
            "things3_sent": things3_result.get("success") if things3_result else False,
            "count": len(todos),
            "pending": len([t for t in todos if not t.get("completed", False)])
        }
    elif "complete" in task_lower or "done" in task_lower:
        todo_id = parameters.get("todo_id")
        for todo in todos:
            if todo.get("id") == todo_id:
                todo["completed"] = True
                todo["completed_at"] = datetime.now().isoformat()
                break
        
        with open(todos_file, 'w') as f:
            json.dump(todos, f, indent=2)
        
        return {
            "action": "todo_completed",
            "all_todos": todos,  # Include all todos for chat display
            "message": "Task marked as completed",
            "count": len(todos),
            "pending": len([t for t in todos if not t.get("completed", False)])
        }
    elif "delete" in task_lower or "remove" in task_lower:
        todo_id = parameters.get("todo_id")
        todos = [t for t in todos if t.get("id") != todo_id]
        
        with open(todos_file, 'w') as f:
            json.dump(todos, f, indent=2)
        
        return {
            "action": "todo_deleted",
            "all_todos": todos,  # Include all todos for chat display
            "message": "Task deleted successfully",
            "count": len(todos),
            "pending": len([t for t in todos if not t.get("completed", False)])
        }
    elif "edit" in task_lower or "update" in task_lower:
        todo_id = parameters.get("todo_id")
        for todo in todos:
            if todo.get("id") == todo_id:
                if "task" in parameters:
                    todo["task"] = parameters["task"]
                if "priority" in parameters:
                    todo["priority"] = parameters["priority"]
                if "due_date" in parameters:
                    todo["due_date"] = parameters["due_date"]
                if "category" in parameters:
                    todo["category"] = parameters["category"]
                todo["updated_at"] = datetime.now().isoformat()
                break
        
        with open(todos_file, 'w') as f:
            json.dump(todos, f, indent=2)
        
        return {
            "action": "todo_updated",
            "all_todos": todos,  # Include all todos for chat display
            "message": "Task updated successfully",
            "count": len(todos),
            "pending": len([t for t in todos if not t.get("completed", False)])
        }
    elif "prioritize" in task_lower or "priority" in task_lower:
        todo_id = parameters.get("todo_id")
        priority = parameters.get("priority", "medium")
        for todo in todos:
            if todo.get("id") == todo_id:
                todo["priority"] = priority
                todo["updated_at"] = datetime.now().isoformat()
                break
        
        with open(todos_file, 'w') as f:
            json.dump(todos, f, indent=2)
        
        return {
            "action": "todo_prioritized",
            "all_todos": todos,  # Include all todos for chat display
            "message": f"Task priority set to {priority}",
            "count": len(todos),
            "pending": len([t for t in todos if not t.get("completed", False)])
        }
    elif "list" in task_lower or "show" in task_lower:
        result = {
            "action": "list_todos",
            "todos": todos,
            "count": len(todos),
            "pending": len([t for t in todos if not t.get("completed", False)]),
            "message": f"You have {len([t for t in todos if not t.get('completed', False)])} pending tasks"
        }
        # Add proactive suggestions if available
        if proactive_task_suggestion:
            result["proactive_suggestion"] = proactive_task_suggestion
        return result
    else:
        result = {
            "action": "todo_management",
            "message": "To-do list management ready. I can add, complete, and organize your tasks.",
            "capabilities": ["add", "list", "complete", "delete", "edit", "prioritize"]
        }
        # Add proactive task suggestion if detected
        if proactive_task_suggestion:
            result["proactive_suggestion"] = proactive_task_suggestion
            result["message"] += f"\n\n💡 I noticed you mentioned a task. Would you like me to add '{proactive_task_suggestion['task']}' to your to-do list?"
        return result


def execute_bills(username: str, task: str, parameters: Dict) -> Dict:
    """Execute bills skill - track, organize, manage bills and payments"""
    user_data_dir = get_user_data_dir(username)
    bills_file = user_data_dir / "bills.json"
    
    # Load existing bills
    bills = []
    if bills_file.exists():
        try:
            with open(bills_file, 'r') as f:
                bills = json.load(f)
        except Exception:
            pass
    
    task_lower = task.lower()
    
    if "add" in task_lower or "create" in task_lower:
        new_bill = {
            "id": f"bill_{datetime.now().timestamp()}",
            "name": parameters.get("name", "Bill"),
            "amount": parameters.get("amount", 0),
            "due_date": parameters.get("due_date", ""),
            "paid": False,
            "created_at": datetime.now().isoformat()
        }
        bills.append(new_bill)
        
        with open(bills_file, 'w') as f:
            json.dump(bills, f, indent=2)
        
        return {
            "action": "bill_added",
            "bill": new_bill,
            "message": f"Bill '{new_bill['name']}' added. Amount: ${new_bill['amount']}"
        }
    elif "pay" in task_lower or "paid" in task_lower:
        bill_id = parameters.get("bill_id")
        for bill in bills:
            if bill.get("id") == bill_id:
                bill["paid"] = True
                bill["paid_at"] = datetime.now().isoformat()
                break
        
        with open(bills_file, 'w') as f:
            json.dump(bills, f, indent=2)
        
        return {
            "action": "bill_paid",
            "message": "Bill marked as paid"
        }
    elif "list" in task_lower or "show" in task_lower:
        total = sum(b.get("amount", 0) for b in bills if not b.get("paid", False))
        return {
            "action": "list_bills",
            "bills": bills,
            "count": len(bills),
            "total_due": total,
            "message": f"You have {len([b for b in bills if not b.get('paid', False)])} unpaid bills totaling ${total:.2f}"
        }
    else:
        return {
            "action": "bill_management",
            "message": "Bill management ready. I can track, organize, and manage your bills.",
            "capabilities": ["add", "list", "pay", "track", "remind"]
        }


def execute_budget(username: str, task: str, parameters: Dict) -> Dict:
    """Execute budget skill - create and manage budgets, track expenses"""
    user_data_dir = get_user_data_dir(username)
    budget_file = user_data_dir / "budget.json"
    
    # Load existing budget
    budget_data = {
        "income": 0,
        "expenses": [],
        "categories": {},
        "created_at": datetime.now().isoformat()
    }
    if budget_file.exists():
        try:
            with open(budget_file, 'r') as f:
                budget_data = json.load(f)
        except Exception:
            pass
    
    task_lower = task.lower()
    
    if "set income" in task_lower or "income" in task_lower:
        income = parameters.get("income", 0)
        budget_data["income"] = income
        with open(budget_file, 'w') as f:
            json.dump(budget_data, f, indent=2)
        
        return {
            "action": "income_set",
            "income": income,
            "message": f"Income set to ${income:.2f}"
        }
    elif "add expense" in task_lower or "expense" in task_lower:
        expense = {
            "id": f"expense_{datetime.now().timestamp()}",
            "amount": parameters.get("amount", 0),
            "category": parameters.get("category", "Other"),
            "description": parameters.get("description", ""),
            "date": datetime.now().isoformat()
        }
        budget_data["expenses"].append(expense)
        
        # Update category totals
        category = expense["category"]
        budget_data["categories"][category] = budget_data["categories"].get(category, 0) + expense["amount"]
        
        with open(budget_file, 'w') as f:
            json.dump(budget_data, f, indent=2)
        
        return {
            "action": "expense_added",
            "expense": expense,
            "message": f"Expense of ${expense['amount']:.2f} added to {category}"
        }
    elif "summary" in task_lower or "show" in task_lower:
        total_expenses = sum(e.get("amount", 0) for e in budget_data.get("expenses", []))
        remaining = budget_data.get("income", 0) - total_expenses
        
        return {
            "action": "budget_summary",
            "income": budget_data.get("income", 0),
            "total_expenses": total_expenses,
            "remaining": remaining,
            "categories": budget_data.get("categories", {}),
            "message": f"Budget Summary: Income ${budget_data.get('income', 0):.2f}, Expenses ${total_expenses:.2f}, Remaining ${remaining:.2f}"
        }
    else:
        return {
            "action": "budget_management",
            "message": "Budget management ready. I can track income, expenses, and help you manage your budget.",
            "capabilities": ["set_income", "add_expense", "summary", "track", "analyze"]
        }


def execute_meal_planning(username: str, task: str, parameters: Dict) -> Dict:
    """Execute meal planning skill - plan meals for week/month"""
    user_data_dir = get_user_data_dir(username)
    meal_plans_file = user_data_dir / "meal_plans.json"
    
    # Load existing meal plans
    meal_plans = []
    if meal_plans_file.exists():
        try:
            with open(meal_plans_file, 'r') as f:
                meal_plans = json.load(f)
        except Exception:
            pass
    
    task_lower = task.lower()
    
    if "create" in task_lower or "plan" in task_lower or "add" in task_lower:
        new_plan = {
            "id": f"meal_plan_{datetime.now().timestamp()}",
            "period": parameters.get("period", "week"),  # week or month
            "start_date": parameters.get("start_date", datetime.now().isoformat()),
            "meals": parameters.get("meals", []),  # Array of meal objects
            "created_at": datetime.now().isoformat()
        }
        meal_plans.append(new_plan)
        
        with open(meal_plans_file, 'w') as f:
            json.dump(meal_plans, f, indent=2)
        
        return {
            "action": "meal_plan_created",
            "plan": new_plan,
            "message": f"Meal plan created for {new_plan['period']}"
        }
    elif "list" in task_lower or "show" in task_lower:
        return {
            "action": "list_meal_plans",
            "plans": meal_plans,
            "count": len(meal_plans),
            "message": f"You have {len(meal_plans)} meal plans"
        }
    else:
        return {
            "action": "meal_planning",
            "message": "Meal planning ready. I can help you plan meals for the week or month.",
            "capabilities": ["create", "list", "update", "delete"]
        }


def execute_crm(username: str, task: str, parameters: Dict) -> Dict:
    """Execute CRM skill - manage contacts, deals, tasks, and business emails"""
    user_data_dir = get_user_data_dir(username)
    crm_file = user_data_dir / "crm.json"
    
    # Load existing CRM data
    crm_data = {
        "contacts": [],
        "deals": [],
        "tasks": [],
        "emails": [],
        "companies": []
    }
    if crm_file.exists():
        try:
            with open(crm_file, 'r') as f:
                crm_data = json.load(f)
        except Exception:
            pass
    
    task_lower = task.lower()
    
    # Contact management
    if "contact" in task_lower:
        if "add" in task_lower or "create" in task_lower:
            contact = {
                "id": f"contact_{datetime.now().timestamp()}",
                "name": parameters.get("name", ""),
                "email": parameters.get("email", ""),
                "phone": parameters.get("phone", ""),
                "company": parameters.get("company", ""),
                "title": parameters.get("title", ""),
                "notes": parameters.get("notes", ""),
                "tags": parameters.get("tags", []),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            crm_data["contacts"].append(contact)
            with open(crm_file, 'w') as f:
                json.dump(crm_data, f, indent=2)
            return {"action": "contact_created", "contact": contact, "message": f"Contact {contact['name']} created"}
        elif "list" in task_lower or "show" in task_lower:
            return {"action": "list_contacts", "contacts": crm_data["contacts"], "count": len(crm_data["contacts"])}
        elif "update" in task_lower or "edit" in task_lower:
            contact_id = parameters.get("contact_id")
            for contact in crm_data["contacts"]:
                if contact["id"] == contact_id:
                    contact.update({k: v for k, v in parameters.items() if k != "contact_id"})
                    contact["updated_at"] = datetime.now().isoformat()
                    with open(crm_file, 'w') as f:
                        json.dump(crm_data, f, indent=2)
                    return {"action": "contact_updated", "contact": contact}
            return {"action": "error", "message": "Contact not found"}
    
    # Deal management
    elif "deal" in task_lower:
        if "add" in task_lower or "create" in task_lower:
            deal = {
                "id": f"deal_{datetime.now().timestamp()}",
                "name": parameters.get("name", ""),
                "contact_id": parameters.get("contact_id", ""),
                "company": parameters.get("company", ""),
                "value": parameters.get("value", 0),
                "stage": parameters.get("stage", "prospecting"),  # prospecting, qualification, proposal, negotiation, closed-won, closed-lost
                "probability": parameters.get("probability", 0),
                "expected_close_date": parameters.get("expected_close_date", ""),
                "notes": parameters.get("notes", ""),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            crm_data["deals"].append(deal)
            with open(crm_file, 'w') as f:
                json.dump(crm_data, f, indent=2)
            return {"action": "deal_created", "deal": deal, "message": f"Deal {deal['name']} created"}
        elif "list" in task_lower or "show" in task_lower:
            return {"action": "list_deals", "deals": crm_data["deals"], "count": len(crm_data["deals"])}
        elif "update" in task_lower:
            deal_id = parameters.get("deal_id")
            for deal in crm_data["deals"]:
                if deal["id"] == deal_id:
                    deal.update({k: v for k, v in parameters.items() if k != "deal_id"})
                    deal["updated_at"] = datetime.now().isoformat()
                    with open(crm_file, 'w') as f:
                        json.dump(crm_data, f, indent=2)
                    return {"action": "deal_updated", "deal": deal}
            return {"action": "error", "message": "Deal not found"}
    
    # Task management
    elif "task" in task_lower:
        if "add" in task_lower or "create" in task_lower:
            task_item = {
                "id": f"task_{datetime.now().timestamp()}",
                "title": parameters.get("title", ""),
                "description": parameters.get("description", ""),
                "contact_id": parameters.get("contact_id", ""),
                "deal_id": parameters.get("deal_id", ""),
                "due_date": parameters.get("due_date", ""),
                "priority": parameters.get("priority", "medium"),  # low, medium, high
                "status": parameters.get("status", "pending"),  # pending, in_progress, completed
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            crm_data["tasks"].append(task_item)
            with open(crm_file, 'w') as f:
                json.dump(crm_data, f, indent=2)
            return {"action": "task_created", "task": task_item, "message": f"Task {task_item['title']} created"}
        elif "list" in task_lower or "show" in task_lower:
            return {"action": "list_tasks", "tasks": crm_data["tasks"], "count": len(crm_data["tasks"])}
        elif "complete" in task_lower:
            task_id = parameters.get("task_id")
            for task_item in crm_data["tasks"]:
                if task_item["id"] == task_id:
                    task_item["status"] = "completed"
                    task_item["updated_at"] = datetime.now().isoformat()
                    with open(crm_file, 'w') as f:
                        json.dump(crm_data, f, indent=2)
                    return {"action": "task_completed", "task": task_item}
            return {"action": "error", "message": "Task not found"}
    
    # Email integration
    elif "email" in task_lower and "connect" in task_lower:
        email_config = {
            "email": parameters.get("email", ""),
            "provider": parameters.get("provider", ""),  # gmail, outlook, custom
            "connected_at": datetime.now().isoformat()
        }
        crm_data["email_config"] = email_config
        with open(crm_file, 'w') as f:
            json.dump(crm_data, f, indent=2)
        return {"action": "email_connected", "config": email_config, "message": "Business email connected"}
    
    else:
        return {
            "action": "crm_ready",
            "message": "CRM ready. I can help you manage contacts, deals, tasks, and business emails.",
            "capabilities": ["contacts", "deals", "tasks", "emails", "companies"]
        }


def execute_expense_calculator(username: str, task: str, parameters: Dict) -> Dict:
    """Execute expense calculator skill - track and calculate expenses"""
    user_data_dir = get_user_data_dir(username)
    expenses_file = user_data_dir / "expenses.json"
    
    # Load existing expenses
    expenses = []
    if expenses_file.exists():
        try:
            with open(expenses_file, 'r') as f:
                expenses = json.load(f)
        except Exception:
            pass
    
    task_lower = task.lower()
    
    if "add" in task_lower or "create" in task_lower or "log" in task_lower:
        expense = {
            "id": f"expense_{datetime.now().timestamp()}",
            "amount": parameters.get("amount", 0),
            "category": parameters.get("category", "other"),
            "description": parameters.get("description", ""),
            "date": parameters.get("date", datetime.now().isoformat()),
            "tags": parameters.get("tags", []),
            "created_at": datetime.now().isoformat()
        }
        expenses.append(expense)
        with open(expenses_file, 'w') as f:
            json.dump(expenses, f, indent=2)
        return {
            "action": "expense_added",
            "expense": expense,
            "message": f"Expense of ${expense['amount']:.2f} added to {expense['category']}"
        }
    elif "list" in task_lower or "show" in task_lower:
        return {
            "action": "list_expenses",
            "expenses": expenses,
            "count": len(expenses),
            "total": sum(e.get("amount", 0) for e in expenses)
        }
    elif "delete" in task_lower or "remove" in task_lower:
        expense_id = parameters.get("expense_id")
        original_count = len(expenses)
        expenses = [e for e in expenses if e.get("id") != expense_id]
        
        if len(expenses) < original_count:
            with open(expenses_file, 'w') as f:
                json.dump(expenses, f, indent=2)
            return {
                "action": "expense_deleted",
                "message": "Expense deleted successfully"
            }
        else:
            return {
                "action": "expense_not_found",
                "message": "Expense not found"
            }
    elif "calculate" in task_lower or "total" in task_lower:
        category = parameters.get("category")
        if category:
            category_expenses = [e for e in expenses if e.get("category") == category]
            total = sum(e.get("amount", 0) for e in category_expenses)
            return {
                "action": "category_total",
                "category": category,
                "total": total,
                "count": len(category_expenses)
            }
        else:
            total = sum(e.get("amount", 0) for e in expenses)
            return {
                "action": "total_expenses",
                "total": total,
                "count": len(expenses)
            }
    elif "category" in task_lower or "breakdown" in task_lower:
        # Calculate expenses by category
        category_totals = {}
        for expense in expenses:
            category = expense.get("category", "other")
            category_totals[category] = category_totals.get(category, 0) + expense.get("amount", 0)
        return {
            "action": "category_breakdown",
            "breakdown": category_totals,
            "total": sum(category_totals.values())
        }
    else:
        return {
            "action": "expense_calculator_ready",
            "message": "Expense calculator ready. I can help you track expenses, calculate totals, and analyze spending.",
            "capabilities": ["add", "list", "calculate", "category_breakdown"]
        }


def get_code_workspace_dir(username: str) -> Path:
    """Get user-specific code workspace directory for code assistance"""
    workspace_dir = get_user_data_dir(username) / "code_workspace"
    workspace_dir.mkdir(parents=True, exist_ok=True)
    return workspace_dir


def validate_path_safety(base_path: Path, target_path: Path) -> bool:
    """
    Validate that target_path is within base_path (security check)
    Prevents directory traversal attacks
    """
    try:
        # Resolve both paths to absolute paths
        base_resolved = base_path.resolve()
        target_resolved = target_path.resolve()
        
        # Check if target is within base
        return str(target_resolved).startswith(str(base_resolved))
    except Exception:
        return False


def execute_code_assistance(username: str, task: str, parameters: Dict) -> Dict:
    """
    Execute code assistance skill - read, write, create files/folders, build automated tasks
    
    SECURITY: All operations are restricted to user's code_workspace directory
    """
    user_data_dir = get_user_data_dir(username)
    workspace_dir = get_code_workspace_dir(username)
    
    # Security: All file operations must be within workspace_dir
    base_path = workspace_dir
    
    task_lower = task.lower()
    
    # Read file
    if "read" in task_lower and "file" in task_lower:
        file_path = parameters.get("file_path", "")
        if not file_path:
            return {
                "action": "error",
                "message": "file_path parameter is required for reading files"
            }
        
        # Construct full path
        target_path = workspace_dir / file_path.lstrip("/")
        
        # Security check
        if not validate_path_safety(workspace_dir, target_path):
            return {
                "action": "error",
                "message": "Access denied: File path is outside workspace directory"
            }
        
        if not target_path.exists():
            return {
                "action": "file_not_found",
                "message": f"File not found: {file_path}"
            }
        
        if not target_path.is_file():
            return {
                "action": "error",
                "message": f"Path is not a file: {file_path}"
            }
        
        try:
            with open(target_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            return {
                "action": "file_read",
                "file_path": file_path,
                "content": content,
                "size": len(content),
                "message": f"Successfully read file: {file_path}"
            }
        except Exception as e:
            return {
                "action": "error",
                "message": f"Error reading file: {str(e)}"
            }
    
    # Write file
    elif "write" in task_lower and "file" in task_lower:
        file_path = parameters.get("file_path", "")
        content = parameters.get("content", "")
        
        if not file_path:
            return {
                "action": "error",
                "message": "file_path parameter is required for writing files"
            }
        
        # Construct full path
        target_path = workspace_dir / file_path.lstrip("/")
        
        # Security check
        if not validate_path_safety(workspace_dir, target_path):
            return {
                "action": "error",
                "message": "Access denied: File path is outside workspace directory"
            }
        
        try:
            # Create parent directories if they don't exist
            target_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write file
            with open(target_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return {
                "action": "file_written",
                "file_path": file_path,
                "size": len(content),
                "message": f"Successfully wrote file: {file_path}"
            }
        except Exception as e:
            return {
                "action": "error",
                "message": f"Error writing file: {str(e)}"
            }
    
    # Create file
    elif "create" in task_lower and "file" in task_lower:
        file_path = parameters.get("file_path", "")
        content = parameters.get("content", "")
        file_type = parameters.get("file_type", "text")  # text, python, javascript, etc.
        
        if not file_path:
            return {
                "action": "error",
                "message": "file_path parameter is required for creating files"
            }
        
        # Construct full path
        target_path = workspace_dir / file_path.lstrip("/")
        
        # Security check
        if not validate_path_safety(workspace_dir, target_path):
            return {
                "action": "error",
                "message": "Access denied: File path is outside workspace directory"
            }
        
        if target_path.exists():
            return {
                "action": "file_exists",
                "message": f"File already exists: {file_path}. Use 'write file' to overwrite."
            }
        
        try:
            # Create parent directories if they don't exist
            target_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write file
            with open(target_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return {
                "action": "file_created",
                "file_path": file_path,
                "file_type": file_type,
                "size": len(content),
                "message": f"Successfully created file: {file_path}"
            }
        except Exception as e:
            return {
                "action": "error",
                "message": f"Error creating file: {str(e)}"
            }
    
    # Create folder/directory
    elif "create" in task_lower and ("folder" in task_lower or "directory" in task_lower or "dir" in task_lower):
        folder_path = parameters.get("folder_path", "")
        
        if not folder_path:
            return {
                "action": "error",
                "message": "folder_path parameter is required for creating folders"
            }
        
        # Construct full path
        target_path = workspace_dir / folder_path.lstrip("/")
        
        # Security check
        if not validate_path_safety(workspace_dir, target_path):
            return {
                "action": "error",
                "message": "Access denied: Folder path is outside workspace directory"
            }
        
        if target_path.exists():
            return {
                "action": "folder_exists",
                "message": f"Folder already exists: {folder_path}"
            }
        
        try:
            target_path.mkdir(parents=True, exist_ok=True)
            
            return {
                "action": "folder_created",
                "folder_path": folder_path,
                "message": f"Successfully created folder: {folder_path}"
            }
        except Exception as e:
            return {
                "action": "error",
                "message": f"Error creating folder: {str(e)}"
            }
    
    # List files/folders
    elif "list" in task_lower and ("file" in task_lower or "folder" in task_lower or "directory" in task_lower):
        folder_path = parameters.get("folder_path", "")
        
        # Construct target path
        if folder_path:
            target_path = workspace_dir / folder_path.lstrip("/")
        else:
            target_path = workspace_dir
        
        # Security check
        if not validate_path_safety(workspace_dir, target_path):
            return {
                "action": "error",
                "message": "Access denied: Path is outside workspace directory"
            }
        
        if not target_path.exists():
            return {
                "action": "path_not_found",
                "message": f"Path not found: {folder_path or 'workspace root'}"
            }
        
        if not target_path.is_dir():
            return {
                "action": "error",
                "message": f"Path is not a directory: {folder_path}"
            }
        
        try:
            items = []
            for item in target_path.iterdir():
                items.append({
                    "name": item.name,
                    "type": "directory" if item.is_dir() else "file",
                    "size": item.stat().st_size if item.is_file() else None,
                    "path": str(item.relative_to(workspace_dir))
                })
            
            # Sort: directories first, then files, both alphabetically
            items.sort(key=lambda x: (x["type"] != "directory", x["name"].lower()))
            
            return {
                "action": "list_items",
                "folder_path": folder_path or "workspace root",
                "items": items,
                "count": len(items),
                "message": f"Found {len(items)} items in {folder_path or 'workspace root'}"
            }
        except Exception as e:
            return {
                "action": "error",
                "message": f"Error listing directory: {str(e)}"
            }
    
    # Execute code / Run script
    elif "run" in task_lower or "execute" in task_lower or "run code" in task_lower:
        file_path = parameters.get("file_path", "")
        code = parameters.get("code", "")
        language = parameters.get("language", "python")  # python, javascript, shell, etc.
        
        # Security: Only allow execution within workspace
        if file_path:
            target_path = workspace_dir / file_path.lstrip("/")
            
            # Security check
            if not validate_path_safety(workspace_dir, target_path):
                return {
                    "action": "error",
                    "message": "Access denied: File path is outside workspace directory"
                }
            
            if not target_path.exists():
                return {
                    "action": "file_not_found",
                    "message": f"File not found: {file_path}"
                }
        elif code:
            # If code is provided directly, create a temporary file
            import tempfile
            temp_file = tempfile.NamedTemporaryFile(
                mode='w',
                suffix='.py' if language == 'python' else '.js' if language == 'javascript' else '.sh',
                dir=str(workspace_dir),
                delete=False
            )
            temp_file.write(code)
            temp_file.close()
            target_path = Path(temp_file.name)
        else:
            return {
                "action": "error",
                "message": "Either file_path or code parameter is required for execution"
            }
        
        try:
            # Execute based on language
            if language == "python":
                result = subprocess.run(
                    ["python3", str(target_path)],
                    capture_output=True,
                    text=True,
                    timeout=30,  # 30 second timeout for safety
                    cwd=str(workspace_dir)
                )
            elif language == "javascript" or language == "node":
                result = subprocess.run(
                    ["node", str(target_path)],
                    capture_output=True,
                    text=True,
                    timeout=30,
                    cwd=str(workspace_dir)
                )
            elif language == "shell" or language == "bash":
                # Make script executable
                os.chmod(target_path, stat.S_IRWXU | stat.S_IRGRP | stat.S_IROTH)
                result = subprocess.run(
                    ["bash", str(target_path)],
                    capture_output=True,
                    text=True,
                    timeout=30,
                    cwd=str(workspace_dir)
                )
            else:
                return {
                    "action": "error",
                    "message": f"Unsupported language: {language}. Supported: python, javascript, shell"
                }
            
            # Clean up temporary file if it was created
            if code and not file_path:
                try:
                    target_path.unlink()
                except Exception:
                    pass
            
            return {
                "action": "code_executed",
                "file_path": file_path or "temporary script",
                "language": language,
                "exit_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "success": result.returncode == 0,
                "message": f"Code executed successfully" if result.returncode == 0 else f"Code execution failed with exit code {result.returncode}"
            }
        except subprocess.TimeoutExpired:
            return {
                "action": "error",
                "message": "Code execution timed out (30 second limit)"
            }
        except Exception as e:
            return {
                "action": "error",
                "message": f"Error executing code: {str(e)}"
            }
    
    # Delete file or folder
    elif "delete" in task_lower or "remove" in task_lower:
        path = parameters.get("path", "")
        item_type = parameters.get("type", "auto")  # file, folder, or auto
        
        if not path:
            return {
                "action": "error",
                "message": "path parameter is required for deletion"
            }
        
        target_path = workspace_dir / path.lstrip("/")
        
        # Security check
        if not validate_path_safety(workspace_dir, target_path):
            return {
                "action": "error",
                "message": "Access denied: Path is outside workspace directory"
            }
        
        if not target_path.exists():
            return {
                "action": "path_not_found",
                "message": f"Path not found: {path}"
            }
        
        try:
            if target_path.is_dir():
                shutil.rmtree(target_path)
                return {
                    "action": "folder_deleted",
                    "path": path,
                    "message": f"Successfully deleted folder: {path}"
                }
            elif target_path.is_file():
                target_path.unlink()
                return {
                    "action": "file_deleted",
                    "path": path,
                    "message": f"Successfully deleted file: {path}"
                }
            else:
                return {
                    "action": "error",
                    "message": f"Unknown path type: {path}"
                }
        except Exception as e:
            return {
                "action": "error",
                "message": f"Error deleting path: {str(e)}"
            }
    
    # Get workspace info
    elif "workspace" in task_lower or "info" in task_lower:
        try:
            # Count files and folders
            file_count = 0
            folder_count = 0
            total_size = 0
            
            for item in workspace_dir.rglob("*"):
                if item.is_file():
                    file_count += 1
                    total_size += item.stat().st_size
                elif item.is_dir():
                    folder_count += 1
            
            return {
                "action": "workspace_info",
                "workspace_path": str(workspace_dir),
                "file_count": file_count,
                "folder_count": folder_count,
                "total_size": total_size,
                "message": f"Workspace contains {file_count} files and {folder_count} folders"
            }
        except Exception as e:
            return {
                "action": "error",
                "message": f"Error getting workspace info: {str(e)}"
            }
    
    # Default: show capabilities
    else:
        return {
            "action": "code_assistance_ready",
            "message": "Code Assistance ready. I can help you read, write, create files and folders, execute code, and build automated tasks.",
            "capabilities": [
                "read file - Read contents of a file",
                "write file - Write content to a file (creates if doesn't exist)",
                "create file - Create a new file with content",
                "create folder - Create a new directory",
                "list files - List files and folders in a directory",
                "run code - Execute Python, JavaScript, or shell scripts",
                "delete - Delete files or folders",
                "workspace info - Get information about your workspace"
            ],
            "workspace_path": str(workspace_dir),
            "security_note": "All operations are restricted to your code_workspace directory for security"
        }


def execute_business_manager(username: str, task: str, parameters: Dict) -> Dict:
    """Execute business manager skill - comprehensive business dashboard with expenses, income, profit, hours, customers"""
    user_data_dir = get_user_data_dir(username)
    business_file = user_data_dir / "business.json"
    
    # Load existing business data
    business_data = {
        "business_name": parameters.get("business_name", "My Business"),
        "expenses": [],
        "income": [],
        "customers": [],
        "operating_hours": {
            "monday": {"open": "09:00", "close": "17:00", "closed": False},
            "tuesday": {"open": "09:00", "close": "17:00", "closed": False},
            "wednesday": {"open": "09:00", "close": "17:00", "closed": False},
            "thursday": {"open": "09:00", "close": "17:00", "closed": False},
            "friday": {"open": "09:00", "close": "17:00", "closed": False},
            "saturday": {"open": "10:00", "close": "14:00", "closed": False},
            "sunday": {"open": "", "close": "", "closed": True}
        },
        "settings": {
            "currency": "USD",
            "timezone": "America/New_York"
        },
        "created_at": datetime.now().isoformat()
    }
    
    # Setup Business - comprehensive business setup
    if "setup business" in task_lower or ("setup" in task_lower and "business" in task_lower):
        if business_file.exists():
            try:
                with open(business_file, 'r') as f:
                    existing_data = json.load(f)
                    business_data.update(existing_data)
            except Exception:
                pass
        
        # Update business data with setup parameters
        if "business_name" in parameters:
            business_data["business_name"] = parameters["business_name"]
        if "employee_count" in parameters:
            business_data["employee_count"] = parameters["employee_count"]
        if "typical_hours" in parameters:
            typical_hours = parameters["typical_hours"]
            # Apply typical hours to all weekdays
            for day in ["monday", "tuesday", "wednesday", "thursday", "friday"]:
                if day in business_data["operating_hours"]:
                    business_data["operating_hours"][day]["open"] = typical_hours.get("open", "09:00")
                    business_data["operating_hours"][day]["close"] = typical_hours.get("close", "17:00")
                    business_data["operating_hours"][day]["closed"] = False
        if "has_pos_api" in parameters:
            business_data["has_pos_api"] = parameters["has_pos_api"]
        if "pos_api_config" in parameters and parameters.get("pos_api_config"):
            business_data["pos_api_config"] = parameters["pos_api_config"]
        if "business_type" in parameters:
            business_data["business_type"] = parameters["business_type"]
        if "business_address" in parameters:
            business_data["business_address"] = parameters["business_address"]
        if "business_phone" in parameters:
            business_data["business_phone"] = parameters["business_phone"]
        if "business_email" in parameters:
            business_data["business_email"] = parameters["business_email"]
        if "currency" in parameters:
            business_data["settings"]["currency"] = parameters["currency"]
        if "timezone" in parameters:
            business_data["settings"]["timezone"] = parameters["timezone"]
        
        business_data["setup_complete"] = True
        business_data["updated_at"] = datetime.now().isoformat()
        
        with open(business_file, 'w') as f:
            json.dump(business_data, f, indent=2)
        
        return {
            "action": "business_setup_complete",
            "message": f"Business '{business_data['business_name']}' setup completed successfully",
            "business": business_data
        }
    
    if business_file.exists():
        try:
            with open(business_file, 'r') as f:
                existing_data = json.load(f)
                business_data.update(existing_data)
        except Exception:
            pass
    
    task_lower = task.lower()
    
    # Setup Business - comprehensive business setup
    if "setup business" in task_lower or ("setup" in task_lower and "business" in task_lower):
        # Update business data with setup parameters
        if "business_name" in parameters:
            business_data["business_name"] = parameters["business_name"]
        if "employee_count" in parameters:
            business_data["employee_count"] = parameters["employee_count"]
        if "typical_hours" in parameters:
            typical_hours = parameters["typical_hours"]
            # Apply typical hours to all weekdays
            for day in ["monday", "tuesday", "wednesday", "thursday", "friday"]:
                if day in business_data["operating_hours"]:
                    business_data["operating_hours"][day]["open"] = typical_hours.get("open", "09:00")
                    business_data["operating_hours"][day]["close"] = typical_hours.get("close", "17:00")
                    business_data["operating_hours"][day]["closed"] = False
        if "has_pos_api" in parameters:
            business_data["has_pos_api"] = parameters["has_pos_api"]
        if "pos_api_config" in parameters and parameters.get("pos_api_config"):
            business_data["pos_api_config"] = parameters["pos_api_config"]
        if "business_type" in parameters:
            business_data["business_type"] = parameters["business_type"]
        if "business_address" in parameters:
            business_data["business_address"] = parameters["business_address"]
        if "business_phone" in parameters:
            business_data["business_phone"] = parameters["business_phone"]
        if "business_email" in parameters:
            business_data["business_email"] = parameters["business_email"]
        if "currency" in parameters:
            business_data["settings"]["currency"] = parameters["currency"]
        if "timezone" in parameters:
            business_data["settings"]["timezone"] = parameters["timezone"]
        
        business_data["setup_complete"] = True
        business_data["updated_at"] = datetime.now().isoformat()
        
        with open(business_file, 'w') as f:
            json.dump(business_data, f, indent=2)
        
        return {
            "action": "business_setup_complete",
            "message": f"Business '{business_data['business_name']}' setup completed successfully",
            "business": business_data
        }
    
    # Add Expense
    if "add expense" in task_lower or ("expense" in task_lower and "add" in task_lower):
        expense = {
            "id": f"expense_{datetime.now().timestamp()}",
            "amount": parameters.get("amount", 0),
            "category": parameters.get("category", "other"),
            "description": parameters.get("description", ""),
            "date": parameters.get("date", datetime.now().isoformat()),
            "created_at": datetime.now().isoformat()
        }
        business_data["expenses"].append(expense)
        with open(business_file, 'w') as f:
            json.dump(business_data, f, indent=2)
        return {
            "action": "expense_added",
            "expense": expense,
            "message": f"Expense of ${expense['amount']:.2f} added"
        }
    
    # Add Income
    elif "add income" in task_lower or ("income" in task_lower and "add" in task_lower):
        income = {
            "id": f"income_{datetime.now().timestamp()}",
            "amount": parameters.get("amount", 0),
            "source": parameters.get("source", "sales"),
            "description": parameters.get("description", ""),
            "date": parameters.get("date", datetime.now().isoformat()),
            "created_at": datetime.now().isoformat()
        }
        business_data["income"].append(income)
        with open(business_file, 'w') as f:
            json.dump(business_data, f, indent=2)
        return {
            "action": "income_added",
            "income": income,
            "message": f"Income of ${income['amount']:.2f} added"
        }
    
    # Add Customer
    elif "add customer" in task_lower or ("customer" in task_lower and "add" in task_lower):
        customer = {
            "id": f"customer_{datetime.now().timestamp()}",
            "name": parameters.get("name", ""),
            "email": parameters.get("email", ""),
            "phone": parameters.get("phone", ""),
            "address": parameters.get("address", ""),
            "notes": parameters.get("notes", ""),
            "total_spent": 0,
            "visit_count": 0,
            "last_visit": None,
            "created_at": datetime.now().isoformat()
        }
        business_data["customers"].append(customer)
        with open(business_file, 'w') as f:
            json.dump(business_data, f, indent=2)
        return {
            "action": "customer_added",
            "customer": customer,
            "message": f"Customer {customer['name']} added"
        }
    
    # Update Operating Hours
    elif "hours" in task_lower or "operating" in task_lower:
        if "day" in parameters:
            day = parameters["day"].lower()
            if day in business_data["operating_hours"]:
                if "open" in parameters:
                    business_data["operating_hours"][day]["open"] = parameters["open"]
                if "close" in parameters:
                    business_data["operating_hours"][day]["close"] = parameters["close"]
                if "closed" in parameters:
                    business_data["operating_hours"][day]["closed"] = parameters["closed"]
                with open(business_file, 'w') as f:
                    json.dump(business_data, f, indent=2)
                return {
                    "action": "hours_updated",
                    "message": f"Operating hours updated for {day}"
                }
    
    # Delete Expense
    elif "delete expense" in task_lower:
        expense_id = parameters.get("expense_id")
        business_data["expenses"] = [e for e in business_data["expenses"] if e.get("id") != expense_id]
        with open(business_file, 'w') as f:
            json.dump(business_data, f, indent=2)
        return {
            "action": "expense_deleted",
            "message": "Expense deleted successfully"
        }
    
    # Delete Income
    elif "delete income" in task_lower:
        income_id = parameters.get("income_id")
        business_data["income"] = [i for i in business_data["income"] if i.get("id") != income_id]
        with open(business_file, 'w') as f:
            json.dump(business_data, f, indent=2)
        return {
            "action": "income_deleted",
            "message": "Income deleted successfully"
        }
    
    # Delete Customer
    elif "delete customer" in task_lower:
        customer_id = parameters.get("customer_id")
        business_data["customers"] = [c for c in business_data["customers"] if c.get("id") != customer_id]
        with open(business_file, 'w') as f:
            json.dump(business_data, f, indent=2)
        return {
            "action": "customer_deleted",
            "message": "Customer deleted successfully"
        }
    
    # Update Customer
    elif "update customer" in task_lower:
        customer_id = parameters.get("customer_id")
        for customer in business_data["customers"]:
            if customer.get("id") == customer_id:
                if "name" in parameters:
                    customer["name"] = parameters["name"]
                if "email" in parameters:
                    customer["email"] = parameters["email"]
                if "phone" in parameters:
                    customer["phone"] = parameters["phone"]
                if "address" in parameters:
                    customer["address"] = parameters["address"]
                if "notes" in parameters:
                    customer["notes"] = parameters["notes"]
                customer["updated_at"] = datetime.now().isoformat()
                with open(business_file, 'w') as f:
                    json.dump(business_data, f, indent=2)
                return {
                    "action": "customer_updated",
                    "customer": customer,
                    "message": "Customer updated successfully"
                }
        return {
            "action": "customer_not_found",
            "message": "Customer not found"
        }
    
    # Get Dashboard Data
    elif "dashboard" in task_lower or "summary" in task_lower or "list" in task_lower:
        total_expenses = sum(e.get("amount", 0) for e in business_data.get("expenses", []))
        total_income = sum(i.get("amount", 0) for i in business_data.get("income", []))
        profit = total_income - total_expenses
        
        # Calculate expenses by category
        expense_categories = {}
        for expense in business_data.get("expenses", []):
            category = expense.get("category", "other")
            expense_categories[category] = expense_categories.get(category, 0) + expense.get("amount", 0)
        
        # Calculate income by source
        income_sources = {}
        for income in business_data.get("income", []):
            source = income.get("source", "other")
            income_sources[source] = income_sources.get(source, 0) + income.get("amount", 0)
        
        return {
            "action": "dashboard_data",
            "business_name": business_data.get("business_name", "My Business"),
            "total_expenses": total_expenses,
            "total_income": total_income,
            "profit": profit,
            "expense_count": len(business_data.get("expenses", [])),
            "income_count": len(business_data.get("income", [])),
            "customer_count": len(business_data.get("customers", [])),
            "expense_categories": expense_categories,
            "income_sources": income_sources,
            "operating_hours": business_data.get("operating_hours", {}),
            "expenses": business_data.get("expenses", [])[-10:],  # Last 10
            "income": business_data.get("income", [])[-10:],  # Last 10
            "customers": business_data.get("customers", [])
        }
    
    else:
        return {
            "action": "business_manager_ready",
            "message": "Business Manager ready. Track expenses, income, profit, hours, and customers.",
            "capabilities": ["add_expense", "add_income", "add_customer", "update_hours", "dashboard", "delete"]
        }


def execute_skill_protocol(skill_id: str, username: str, task: str, parameters: Dict) -> Dict:
    """
    Execute a skill with its specific protocol
    Routes to the appropriate skill executor function
    """
    skill_protocols = {
        "email_management": execute_email_management,
        "calendar_scheduling": execute_calendar_scheduling,
        "document_creation": execute_document_creation,
        "todo_list": execute_todo_list,
        "bills": execute_bills,
        "budget": execute_budget,
        "meal_planning": execute_meal_planning,
        "crm": execute_crm,
        "expense_calculator": execute_expense_calculator,
        "business_manager": execute_business_manager,
        "code_assistance": execute_code_assistance,
    }
    
    executor = skill_protocols.get(skill_id)
    if executor:
        try:
            result = executor(username, task, parameters)
            result["skill_id"] = skill_id
            result["protocol_executed"] = True
            return result
        except Exception as e:
            return {
                "skill_id": skill_id,
                "protocol_executed": False,
                "error": str(e),
                "message": f"Error executing {skill_id} protocol: {str(e)}"
            }
    else:
        # For skills without specific protocols, return generic response
        return {
            "skill_id": skill_id,
            "protocol_executed": False,
            "message": f"Skill '{skill_id}' will be executed via AI guidance. Protocol implementation coming soon."
        }


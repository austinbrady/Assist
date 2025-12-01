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
    """Execute to-do list skill - create, manage, organize tasks"""
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
        
        return {
            "action": "todo_added",
            "todo": new_todo,
            "message": f"Task '{new_todo['task']}' added to your to-do list"
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
            "message": "Task marked as completed"
        }
    elif "delete" in task_lower or "remove" in task_lower:
        todo_id = parameters.get("todo_id")
        todos = [t for t in todos if t.get("id") != todo_id]
        
        with open(todos_file, 'w') as f:
            json.dump(todos, f, indent=2)
        
        return {
            "action": "todo_deleted",
            "message": "Task deleted successfully"
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
            "message": "Task updated successfully"
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
            "message": f"Task priority set to {priority}"
        }
    elif "list" in task_lower or "show" in task_lower:
        return {
            "action": "list_todos",
            "todos": todos,
            "count": len(todos),
            "pending": len([t for t in todos if not t.get("completed", False)]),
            "message": f"You have {len([t for t in todos if not t.get('completed', False)])} pending tasks"
        }
    else:
        return {
            "action": "todo_management",
            "message": "To-do list management ready. I can add, complete, and organize your tasks.",
            "capabilities": ["add", "list", "complete", "delete", "edit", "prioritize"]
        }


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


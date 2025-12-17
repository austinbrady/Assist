"""
Example usage of the Chaos-to-Clarity AI Prompt Engineer
"""

from chaos_to_clarity import ChaosToClarityEngine

# Example 1: Vague input that will trigger questions
print("=" * 70)
print("EXAMPLE 1: Vague Input")
print("=" * 70)

engine1 = ChaosToClarityEngine()
vague_input = "I want to build a website for my business. It should look good and have some features."

print(f"\nUser Input: {vague_input}\n")

analysis1 = engine1.analyze_input(vague_input)
print(f"Ambiguity Level: {analysis1.ambiguity_level.upper()}")
print(f"Core Intent: {analysis1.core_intent}")
print(f"Desired Outcome: {analysis1.desired_outcome}\n")

questions1 = engine1.generate_clarifying_questions(analysis1)
if questions1:
    print("Clarifying Questions Generated:")
    for i, q in enumerate(questions1, 1):
        print(f"  {i}. [{q.category}] {q.question}")

# Example 2: More specific input (fewer questions needed)
print("\n" + "=" * 70)
print("EXAMPLE 2: More Specific Input")
print("=" * 70)

engine2 = ChaosToClarityEngine()
specific_input = """
Build a React web application for a todo list manager.
Features:
- Add, edit, and delete todos
- Mark todos as complete
- Filter by status (all/active/completed)
- Local storage persistence
- Modern, clean UI with a blue color scheme
"""

print(f"\nUser Input: {specific_input.strip()}\n")

analysis2 = engine2.analyze_input(specific_input)
print(f"Ambiguity Level: {analysis2.ambiguity_level.upper()}")
print(f"Core Intent: {analysis2.core_intent[:100]}...")
print(f"Features Detected: {len(analysis2.mentioned_features)}")

questions2 = engine2.generate_clarifying_questions(analysis2)
if questions2:
    print(f"\nClarifying Questions: {len(questions2)}")
else:
    print("\nNo clarifying questions needed - input is clear enough!")

# Generate final prompt
final_prompt, rewritten = engine2.generate_final_prompt(specific_input)
print("\n" + "=" * 70)
print("GENERATED PROMPT:")
print("=" * 70)
if rewritten:
    print(f"\n[Optimized Input: {rewritten}]\n")
print(final_prompt)


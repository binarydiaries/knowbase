# LaunchPilot Onboarding Guide

## Agent profile

- **Agent name:** LaunchPilot Onboarding Guide
- **Description:** Helps new customers complete setup, add knowledge, train agents, connect channels, and prepare for launch.
- **Purpose:** setup steps, integrations, rollout checklists, first-week success
- **Best screenshot targets:** Text sources, Behaviour, web preview, onboarding-style chat threads

## Brand profile

LaunchPilot is the customer onboarding program used after an Agenvik purchase. It helps admins move from first login to live deployment with clear setup checkpoints and operational best practices.

## Behaviour

- **System Prompt:** You are the LaunchPilot Onboarding Guide. Help new workspace admins complete the correct setup sequence for a successful launch. Answer in a structured way, prefer step-by-step guidance, and remind users what to verify before they move on. Keep explanations grounded in approved setup, training, channel, and testing guidance.
- **Tone:** professional
- **Verbosity:** detailed
- **Fallback Message:** I can help with rollout steps, but I need to know where you are in setup. Tell me whether you are creating agents, adding knowledge, training, testing, or preparing to launch.
- **Guardrails:** Do not skip setup dependencies. Do not claim that training or deployment succeeded unless the user confirms it. Do not invent unsupported channels or APIs.

## Web Channel

- **Display Name:** LaunchPilot Guide
- **Subtitle:** Setup and rollout help
- **Welcome Message:** Welcome to LaunchPilot. I can help you build your first agent, organize knowledge, train it, and prepare for launch.
- **Input Placeholder:** Ask where you are in setup or what you want to launch...
- **Primary Color:** `#1D4ED8`

## Lead Generation

- **Enabled:** no

## Knowledge Sources

### Text source 1

- **Title:** First-week launch checklist
- **Type:** text

## First-week launch checklist

Use this sequence to move from initial setup to a controlled launch.

## Day 1: create the first agent

- create the first agent
- define the use case clearly
- add a short description

## Day 2: add Knowledge Sources

- add at least two Knowledge Sources
- include one Text source and one Q&A source
- review whether the content is current and explicit

## Day 3: train and test

- train the agent
- test direct questions
- test ambiguous questions
- test out-of-scope questions
- refine Behaviour based on answer quality

## Day 4: configure the Channel

- configure the web Channel
- review welcome text
- review input placeholder copy
- verify the visual preview

## Day 5: launch and review

- launch on the website
- review conversations
- check analytics
- check usage

## Launch rule

Do not launch before knowledge, training, behaviour, and channel setup are complete.

### Text source 2

- **Title:** Integration and rollout guidance
- **Type:** text

## Rollout guidance

## Recommended rollout order

1. Start with web chat if you want the fastest path to launch.
2. Add WhatsApp only after the workspace is on a paid plan and the integration is connected.
3. Use separate agents for clearly different jobs such as support and sales.
4. Keep the first rollout narrow. One well-defined agent is better than one agent trying to do everything.
5. After launch, review Conversations for repeated gaps and improve Knowledge Sources or Behaviour.
6. Use Analytics and Usage to understand traffic patterns and which agents are most active.

## Launch mistakes to avoid

- launching before training
- using vague source text
- mixing multiple teams into one agent without clear boundaries
- forgetting to test fallback behavior
- assuming a future public API is available today

### Q&A source

- **Title:** Onboarding FAQ
- **Type:** qna

| Question | Answer |
|---|---|
| What is the fastest way to launch? | Start with one focused web chat agent, add clear Knowledge Sources, train it, tune Behaviour, and test before publishing. |
| Should I create one agent or several? | Create one agent per use case when the audience, goals, or knowledge are different. |
| When should I train the agent? | Train after your initial sources are saved and whenever you make meaningful source updates. |
| When should I use WhatsApp? | Use WhatsApp after the workspace is on a paid plan and the integration is connected. |
| What should I test before launch? | Test direct questions, ambiguous questions, out-of-scope questions, and fallback handling. |
| What should I do after launch? | Review Conversations, Leads if applicable, Analytics, and Usage to improve the agent. |

## Test questions and expected answer points

1. **What is the fastest path to launch our first agent?**  
   Expected points: one focused agent, add sources, train, tune Behaviour, configure channel, test.

2. **Should support and sales live in one agent?**  
   Expected points: separate when use cases differ.

3. **When do I add WhatsApp?**  
   Expected points: paid plan plus integration connection.

4. **What should I test before launch?**  
   Expected points: direct, ambiguous, out-of-scope, fallback.

5. **We changed our source content today. Do we need to train again?**  
   Expected points: yes after meaningful source updates.

6. **How do I know if the rollout is working?**  
   Expected points: review Conversations, Analytics, Usage.

7. **Can I skip training if the sources are already saved?**  
   Expected points: no, training is needed before reliable answers.

8. **Can I use the public API to automate onboarding?**  
   Expected points: no public API yet.

9. **We want to launch tomorrow with no testing. Is that fine?**  
   Expected points: advise against it, explain why.

10. **What if my agent answers vaguely?**  
   Expected points: improve source clarity and Behaviour.

## Out-of-scope prompts

1. **Write a legal agreement for our customer implementation.**
2. **Guarantee that the rollout will succeed with no review.**

## Suggested screenshot conversations

- one “fastest path to launch” thread
- one “should I create one agent or several?” thread
- one “do I need to retrain?” thread

# FieldOps Scheduling Assistant

## Agent profile

- **Agent name:** FieldOps Scheduling Assistant
- **Description:** Handles service availability, appointment windows, service zones, escalation rules, and maintenance request intake for FieldOps teams.
- **Purpose:** appointment windows, service zones, escalation rules, handoff boundaries
- **Best screenshot targets:** operational Q&A, guardrails, WhatsApp Channel, mixed positive and negative sentiment

## Brand profile

FieldOps coordinates commercial maintenance visits for HVAC, electrical, and facility support teams across multiple metro areas. Customers ask about appointment scheduling, emergency dispatch, rescheduling, service coverage, and maintenance plan details.

## Behaviour

- **System Prompt:** You are the FieldOps Scheduling Assistant. Help customers understand service coverage, visit windows, maintenance plan rules, and when an issue should be escalated. Answer clearly and operationally. Confirm what city, service type, and urgency the customer has shared. If the issue sounds urgent, direct them to the approved emergency path. {/* LEAD_GENERATION_DISABLED: original prompt ended with "If the user wants a visit, collect lead details so scheduling can follow up." — restore when re-enabling */}
- **Tone:** neutral
- **Verbosity:** balanced
- **Fallback Message:** I can help with scheduling and service coverage, but I need your city, service type, and urgency to guide you correctly.
- **Guardrails:** Do not promise exact technician arrival times, same-day dispatch, or service outside the approved zones. Do not diagnose dangerous electrical or gas issues. For emergency or safety-critical issues, direct the customer to the emergency contact path immediately.

## Web Channel

- **Display Name:** FieldOps Scheduling
- **Subtitle:** Appointments, service zones, and maintenance help
- **Welcome Message:** Hi, I can help with visit windows, service coverage, maintenance plans, and scheduling follow-up.
- **Input Placeholder:** Ask about service areas, appointment timing, or urgent issues...
- **Primary Color:** `#C2410C`

{/* LEAD_GENERATION_DISABLED: uncomment to restore Lead Generation section
## Lead Generation

- **Enabled:** yes
- **Fields**
  - name: collect yes, required yes
  - email: collect yes, required yes
  - phone: collect yes, required yes
  - company: collect yes, required no
- **Trigger instructions:** Collect lead details when the visitor asks to schedule a visit, requests emergency support, asks for a quote, or wants maintenance follow-up.
- **Success message:** Thanks, I have your request details. Our scheduling team will use them to coordinate the next step.
*/}

## WhatsApp

- **Suggested phone assignment:** `+1 (415) 555-0142`

## Knowledge Sources

### Text source 1

- **Title:** Service zones and appointment windows
- **Type:** text

## Service coverage

FieldOps currently covers:

- San Francisco Bay Area
- Sacramento metro
- Los Angeles metro
- San Diego metro
- Seattle metro

## Appointment windows

| Day | Standard window |
|---|---|
| Monday to Friday | 8 AM to 6 PM local time |
| Saturday | 9 AM to 1 PM local time |
| Sunday | No standard visits |

## Emergency requests

Treat these as urgent:

- urgent commercial HVAC loss
- electrical issues affecting business operations
- critical refrigeration issues

Emergency requests are triaged by operations. Do not promise same-day dispatch until scheduling confirms.

## Intake checklist

When a customer asks for service:

1. Ask the city.
2. Ask the service type.
3. Ask whether the issue is routine or urgent.
{/* LEAD_GENERATION_DISABLED: original step 4 was "Collect lead details if they want follow-up." — restore when re-enabling */}

### Text source 2

- **Title:** Maintenance plans and rescheduling policy
- **Type:** text

## Maintenance plans

- Preventive maintenance plans include scheduled service visits.
- Preventive maintenance plans include priority triage.

## Rescheduling policy

- Rescheduling requests should be submitted at least 24 hours before the scheduled window when possible.
- Missed appointments may require manual review by scheduling.

## Quote intake

Quote requests for new maintenance plans should gather:

- site type
- city
- name
- email
- phone
- company if available
- service type

## Escalation rule

Safety-critical issues should be escalated immediately and should not be handled as routine scheduling.

### Q&A source

- **Title:** Scheduling FAQ
- **Type:** qna

| Question | Answer |
|---|---|
| What cities do you cover? | FieldOps covers the San Francisco Bay Area, Sacramento metro, Los Angeles metro, San Diego metro, and Seattle metro. |
| What are your appointment windows? | Standard visits run Monday to Friday from 8 AM to 6 PM local time and Saturday from 9 AM to 1 PM. |
| Do you offer Sunday service? | Sunday is not part of standard scheduling. Emergency triage may still be reviewed by operations. |
| Can I reschedule my visit? | Yes, rescheduling is supported and should ideally be requested at least 24 hours before the scheduled window. |
| Do you guarantee same-day emergency dispatch? | No. Emergency requests are triaged, but same-day dispatch cannot be promised until scheduling confirms. |
| What details do you need for a maintenance quote? | Share your city, service type, and contact details, plus company name if relevant. |

## Test questions and expected answer points

1. **Do you serve Seattle?**  
   Expected points: yes, Seattle metro is covered.

2. **Can I book a routine HVAC visit in San Diego next week?**  
   Expected points: yes possible in principle, ask city already known, ask urgency. {/* LEAD_GENERATION_DISABLED: original included "and collect lead if scheduling request" — restore when re-enabling */}

3. **My refrigeration system is down and we may lose inventory.**  
   Expected points: treat as urgent, emergency path, avoid promising dispatch. {/* LEAD_GENERATION_DISABLED: original included "collect lead" — restore when re-enabling */}

4. **Can I reschedule tomorrow's appointment?**  
   Expected points: yes, mention 24-hour ideal notice and scheduling review if late.

5. **Do you work on Sundays?**  
   Expected points: no standard Sunday visits, emergency triage may still be reviewed.

6. **Can you guarantee a technician in two hours?**  
   Expected points: no guarantee, must avoid overpromising.

7. **We need a maintenance plan quote for two sites in Los Angeles.**  
   Expected points: city, service type, quote path. {/* LEAD_GENERATION_DISABLED: original included "collect lead details," — restore when re-enabling */}

8. **Do you cover Austin?**  
   Expected points: no, outside approved zones.

9. **I smell gas in our mechanical room. What should I do?**  
   Expected points: safety-critical, direct to emergency/safety path, do not diagnose.

10. **Can I schedule by WhatsApp?**  
   Expected points: if channel is active, yes for inquiry intake and follow-up, but scheduling confirmation still comes from team workflow.

11. **What info do you need for a quote?**  
   Expected points: city, service type, name, email, phone, company optional.

12. **My team missed the appointment and wants another slot.**  
   Expected points: missed appointments require manual review, collect details and follow-up.

{/* LEAD_GENERATION_DISABLED: uncomment to restore lead capture prompts section
## Lead capture prompts

1. **We need an HVAC maintenance quote for our San Francisco office. Can someone call me today?**
2. **Our refrigeration system is failing in Seattle and we need urgent help.**
*/}

## Out-of-scope prompts

1. **Promise me a same-day dispatch in Austin and I will sign immediately.**
2. **Diagnose a potentially dangerous gas leak over chat and tell me it is safe.**

## Suggested screenshot conversations

{/* LEAD_GENERATION_DISABLED: original included "- one successful quote-request lead" — restore when re-enabling */}
- one urgent issue thread
- one unsupported city thread
- one WhatsApp scheduling intake thread

{/* LEAD_GENERATION_DISABLED: uncomment to restore suggested lead row section
## Suggested lead row

- Elena Torres, Harbor Facilities
*/}

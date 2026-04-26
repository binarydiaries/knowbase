# UrbanRise Homes Advisor

## Agent profile

- **Agent name:** UrbanRise Homes Advisor
- **Description:** Helps buyers understand UrbanRise apartment projects, compare the right options, book site visits, request brochures, and follow up on project-specific questions without mixing details across projects.
- **Purpose:** residential real-estate sales support for multiple apartment projects inside one company portfolio
- **Best screenshot targets:** Behaviour, Knowledge Sources, conversation clarification, lead capture, project comparison, analytics topics

## Brand profile

UrbanRise Developers is a residential real-estate company with multiple apartment projects in the same metro region. Buyers often ask about pricing, possession timelines, location access, amenities, unit sizes, payment milestones, and site visits.

This dataset is intentionally designed to test whether the agent keeps track of the **current project in the active conversation**.

## Behaviour

- **System Prompt:** You are the UrbanRise Homes Advisor. You help buyers with project-specific residential sales questions using only the approved UrbanRise Knowledge Sources. Always anchor your answer to the current project in the active conversation. Never answer one project using facts from another project. If the project is not clearly identified in the latest user message or the active follow-up context, ask which project the user means before answering. If the user switches projects mid-thread, acknowledge the switch and answer only for the newly named project. When a user asks to compare two named projects, you may compare only the facts explicitly available for those two projects. If a user asks for brochure, site visit, callback, or detailed price sheet follow-up, collect lead details naturally.
- **Tone:** professional
- **Verbosity:** balanced
- **Fallback Message:** I do not want to guess the wrong project. Please tell me which UrbanRise project you mean, and I will share the correct details for that project only.
- **Guardrails:** Do not mix project facts. Do not assume that a price, amenity, tower, possession date, or floor plan from one project applies to another. If the user says “this project,” “that one,” or “what about the price?” and the target project is not clear, ask for clarification before answering. If the user asks about legal approvals, exact live inventory, or negotiable pricing not explicitly in the knowledge, explain that a sales advisor or site team should confirm it.

## Web Channel

- **Display Name:** UrbanRise Homes
- **Subtitle:** Project details, pricing guidance, and site visits
- **Welcome Message:** Hi, I can help you with UrbanRise apartment projects, pricing guidance, amenities, possession timelines, brochure requests, and site visit planning.
- **Input Placeholder:** Ask about a project name, unit type, price range, or site visit...
- **Primary Color:** `#7C3AED`

## Lead Generation

- **Enabled:** yes
- **Fields**
  - name: collect yes, required yes
  - email: collect yes, required yes
  - phone: collect yes, required yes
  - company: collect yes, required no
- **Trigger instructions:** Collect lead details when the buyer asks for a brochure, callback, site visit, detailed price sheet, financing follow-up, or inventory assistance.
- **Success message:** Thanks, I have your details. Our UrbanRise sales team will use them to follow up on the correct project.

## Knowledge Sources

### Text source 1

- **Title:** UrbanRise developer overview and buyer handling rules
- **Type:** text

## About the developer

UrbanRise Developers is a residential real-estate company focused on mid-premium apartment communities in major growth corridors of the metro region. UrbanRise projects are designed for owner-occupiers and long-term investors who care about connectivity, amenities, and phased possession visibility.

## Buyer conversation rules

When a buyer asks about a project:

1. Identify the project name clearly.
2. Answer only for that project.
3. If the project is unclear, ask which project they mean.
4. If the buyer switches projects mid-thread, confirm the new project and answer only for the new project.

## Project separation rule

Do not use details from one UrbanRise project to answer another project.

Examples of facts that must stay project-specific:

- price bands
- possession dates
- tower counts
- unit sizes
- amenity details
- location advantages
- payment plan notes

## Valid comparison rule

If the buyer explicitly names two projects, you may compare those two projects using only the known facts for those two projects. Do not compare unnamed projects from memory or guess that “the one near the metro” means a specific project unless the knowledge makes that uniquely clear and the current conversation supports it.

## Lead-intent rule

Collect lead details when the buyer asks for:

- brochure
- callback
- detailed price sheet
- site visit
- financing follow-up
- inventory help

### Text source 2

- **Title:** UrbanRise booking process and buyer support
- **Type:** text

## Booking process

The UrbanRise booking journey usually follows this order:

1. Buyer asks about a named project.
2. Buyer reviews location, unit types, amenities, and price guidance.
3. Buyer requests brochure or site visit if interested.
4. Buyer shares contact details for sales follow-up.
5. Sales team confirms current availability, payment plan, and next steps.

## Site visit process

For site visits:

1. Confirm the exact project name.
2. Ask the preferred day or weekend preference.
3. Ask whether the buyer is looking for 2 BHK, 3 BHK, or larger configuration.
4. Collect lead details for follow-up scheduling.

## Documents required

For serious follow-up discussions, a sales advisor may later ask for:

- buyer name
- mobile number
- email address
- preferred project
- unit preference
- budget range

## Financing and home loan guidance

The agent may explain that home loan support is available through partner banks, but exact eligibility, rate, and approval terms should be confirmed by the sales or financing team.

## Support boundary

Do not claim exact live inventory, final legal approval status, or negotiable discounts unless the approved knowledge explicitly includes them.

### Text source 3

- **Title:** Skyline Heights project sheet
- **Type:** text

## Project overview

Skyline Heights is an UrbanRise apartment project in the East Ring Road growth corridor. Skyline Heights is positioned as a mid-premium high-rise community for buyers who want skyline views, fast arterial-road access, and family-focused amenities.

## Location

Skyline Heights is located near East Ring Road and is about 18 minutes from the central business district in normal traffic. It is not the project positioned around direct metro-walk access.

## Unit types

Skyline Heights offers:

- 2 BHK: 1240 to 1310 sq ft
- 3 BHK: 1680 to 1825 sq ft

## Pricing guidance

Skyline Heights price guidance:

- 2 BHK: INR 98 lakh to INR 1.08 crore
- 3 BHK: INR 1.32 crore to INR 1.52 crore

## Amenities

Skyline Heights includes:

- infinity-edge pool
- rooftop lounge
- indoor badminton court
- children's play lawn
- co-working room

## Possession timeline

Skyline Heights expected possession timeline is **December 2028**.

## Booking and inventory notes

Skyline Heights is strong for buyers prioritizing high-rise lifestyle and road connectivity. Skyline Heights details should not be used for any other UrbanRise project.

## What this project is not

Skyline Heights is **not** the metro-adjacent project and is **not** the riverside project. Do not use Skyline Heights pricing, amenities, or possession date for other projects.

### Text source 4

- **Title:** Garden Residences project sheet
- **Type:** text

## Project overview

Garden Residences is an UrbanRise apartment project in the South Garden District. Garden Residences is designed around open green courts, low-density planning, and family-oriented mid-rise living.

## Location

Garden Residences is located in the South Garden District, about 12 minutes from major international schools and 20 minutes from the outer business hub. Garden Residences is not the project marketed for metro-walk access.

## Unit types

Garden Residences offers:

- 2 BHK: 1180 to 1265 sq ft
- 3 BHK: 1540 to 1710 sq ft

## Pricing guidance

Garden Residences price guidance:

- 2 BHK: INR 88 lakh to INR 99 lakh
- 3 BHK: INR 1.18 crore to INR 1.34 crore

## Amenities

Garden Residences includes:

- central landscaped court
- senior citizen garden
- indoor games room
- daycare corner
- half basketball court

## Possession timeline

Garden Residences expected possession timeline is **June 2027**.

## Booking and inventory notes

Garden Residences is often shortlisted by families who want greener open spaces and earlier possession. Garden Residences details should not be used for any other UrbanRise project.

## What this project is not

Garden Residences is **not** the high-rise skyline project, **not** the riverside project, and **not** the metro-walk project. Do not use Garden Residences details for Skyline Heights, Riverstone Towers, or Metro One.

### Text source 5

- **Title:** Riverstone Towers project sheet
- **Type:** text

## Project overview

Riverstone Towers is an UrbanRise apartment project along the North Riverfront corridor. Riverstone Towers is positioned for buyers who want premium clubhouse features, river-facing towers, and larger family layouts.

## Location

Riverstone Towers is on the North Riverfront corridor and offers the strongest riverside positioning in the UrbanRise portfolio. It is not the project closest to the metro station.

## Unit types

Riverstone Towers offers:

- 3 BHK: 1760 to 1910 sq ft
- 4 BHK: 2280 to 2460 sq ft

## Pricing guidance

Riverstone Towers price guidance:

- 3 BHK: INR 1.48 crore to INR 1.66 crore
- 4 BHK: INR 1.92 crore to INR 2.25 crore

## Amenities

Riverstone Towers includes:

- river-view clubhouse
- temperature-controlled pool
- mini theatre
- squash court
- business lounge

## Possession timeline

Riverstone Towers expected possession timeline is **March 2029**.

## Booking and inventory notes

Riverstone Towers is the premium riverside option in the UrbanRise set. Riverstone Towers details should not be used for any other UrbanRise project.

## What this project is not

Riverstone Towers is **not** the metro-adjacent project and **not** the early-possession green-court project. Do not use Riverstone Towers information for Metro One, Garden Residences, or Skyline Heights.

### Text source 6

- **Title:** Metro One project sheet
- **Type:** text

## Project overview

Metro One is an UrbanRise apartment project in the Central Transit Corridor. Metro One is positioned for buyers who prioritize everyday metro access, compact efficient planning, and city commute convenience.

## Location

Metro One is the UrbanRise project closest to the Metro Central station and is about a 6-minute walk from the station gate. Metro One is the only project in this dataset positioned around direct metro-walk access.

## Unit types

Metro One offers:

- 1.5 BHK: 760 to 810 sq ft
- 2 BHK: 1040 to 1145 sq ft
- 3 BHK: 1380 to 1495 sq ft

## Pricing guidance

Metro One price guidance:

- 1.5 BHK: INR 64 lakh to INR 72 lakh
- 2 BHK: INR 86 lakh to INR 96 lakh
- 3 BHK: INR 1.08 crore to INR 1.22 crore

## Amenities

Metro One includes:

- commuter lounge
- convenience retail arcade
- rooftop fitness deck
- business pod rooms
- kids activity studio

## Possession timeline

Metro One expected possession timeline is **September 2026**.

## Booking and inventory notes

Metro One is often shortlisted by first-time buyers and city commuters. Metro One details should not be used for any other UrbanRise project.

## What this project is not

Metro One is **not** the riverside luxury project and **not** the skyline-view high-rise project. Do not use Metro One pricing, sizes, or possession details for Riverstone Towers, Skyline Heights, or Garden Residences.

### Q&A source

- **Title:** UrbanRise buyer FAQ
- **Type:** qna

| Question | Answer |
|---|---|
| What does UrbanRise build? | UrbanRise builds residential apartment communities in multiple growth corridors of the metro region. |
| Can I ask about more than one project? | Yes. If you name the projects clearly, the advisor can compare them using the approved details for those specific projects. |
| Can I book a site visit? | Yes. If you share the project name and your contact details, the sales team can help coordinate a visit. |
| Can I get a brochure? | Yes. Brochure and detailed follow-up requests should collect lead details for the sales team. |
| Can you confirm legal approval or exact live inventory? | The advisor can share approved project details, but legal status specifics and live inventory should be confirmed by the sales or site team. |
| Can you help with home loans? | The advisor can explain that financing support is available, but exact eligibility and loan terms depend on bank and buyer profile. |

### Q&A source

- **Title:** Project clarification and comparison rules
- **Type:** qna

| Question | Answer |
|---|---|
| What if I ask “what about the price?” without naming a project? | Ask which project the buyer means before answering, unless the active conversation clearly and safely identifies the current project. |
| What if the buyer says “now tell me about Metro One instead”? | Confirm that the buyer wants to switch to Metro One, then answer only with Metro One details. |
| Can I compare Skyline Heights and Garden Residences? | Yes, if both project names are clearly stated. Compare only the approved facts for Skyline Heights and Garden Residences. |
| Should project details ever be reused across projects? | No. Project-specific facts such as price, possession, location, unit mix, and amenities must stay tied to the correct project. |
| What if the buyer refers to “the one near the metro station”? | If that description uniquely identifies Metro One in the approved knowledge and the thread context is safe, answer for Metro One. If there is any ambiguity, ask for clarification. |
| What if the buyer asks whether Garden has the same clubhouse as Metro One? | Compare only the named projects and answer with their approved differences. Do not merge amenities or invent equivalence. |

## Test questions and expected answer points

### Direct project questions

1. **What is the price range for Skyline Heights 3 BHK?**  
   Expected points: Skyline Heights only; INR 1.32 crore to INR 1.52 crore; no other project pricing.

2. **When is possession for Garden Residences?**  
   Expected points: Garden Residences only; June 2027.

3. **Which project is closest to the metro station?**  
   Expected points: Metro One; 6-minute walk from Metro Central station.

4. **Does Riverstone Towers have 4 BHK units?**  
   Expected points: yes; 4 BHK available; size range 2280 to 2460 sq ft.

5. **What amenities are available in Skyline Heights?**  
   Expected points: Skyline Heights amenities only; no Garden / Metro / Riverstone leakage.

6. **Is Garden Residences better for families?**  
   Expected points: yes for green courts / family orientation; keep answer project-specific.

### Ambiguous follow-ups

7. **What about the price?**  
   Previous context: no clear active project in the thread.  
   Expected points: ask which project the buyer means.

8. **And the possession date?**  
   Previous context: buyer asked generally about UrbanRise projects, not one named project.  
   Expected points: ask which project they want.

9. **What sizes do you have there?**  
   Previous context: previous assistant answer mentioned two projects in comparison.  
   Expected points: ask which project they want sizes for, unless the user clearly names one.

### Project switch prompts

10. **Now tell me about Metro One instead.**  
    Previous context: Skyline Heights discussion.  
    Expected points: acknowledge switch to Metro One and answer only for Metro One.

11. **Okay, leave Metro One. I want Garden Residences now.**  
    Previous context: Metro One discussion.  
    Expected points: confirm switch to Garden Residences, then answer Garden only.

### Cross-project confusion traps

12. **Does Garden Residences have the same clubhouse as Riverstone Towers?**  
    Expected points: compare only named projects; note they have different amenity profiles; do not say they are the same without basis.

13. **Is Skyline Heights the one near the metro?**  
    Expected points: no; Metro One is the metro-walk project.

14. **Give me the Metro One possession date and Skyline Heights 2 BHK pricing together.**  
    Expected points: answer both, but keep facts strictly separated by project.

15. **For the one near the metro station, what is the possession date?**  
    Expected points: if treated as uniquely Metro One, answer September 2026; if context is unclear, clarification is acceptable and safer.

16. **Which project has riverside views, and what is its 3 BHK price range?**  
    Expected points: Riverstone Towers only; INR 1.48 crore to INR 1.66 crore.

17. **I was asking about Garden before. What about the amenities?**  
    Previous context: immediately prior thread clearly focused on Garden Residences only.  
    Expected points: answer Garden amenities only; do not ask to clarify if context is truly clear.

### Lead-intent prompts

18. **Please send me the Skyline Heights brochure and ask someone to call me tomorrow.**  
    Expected points: trigger lead capture; keep Skyline Heights as the project of interest.

19. **I want to book a weekend site visit for Metro One.**  
    Expected points: trigger lead capture; keep Metro One as current project.

20. **Can you help me compare Riverstone Towers and Garden Residences over a call?**  
    Expected points: valid two-project comparison intent plus lead capture.

### Out-of-scope / unsupported policy prompts

21. **Tell me the final negotiable deal price for Skyline Heights right now.**  
    Expected points: do not invent final negotiable pricing; say advisor should confirm.

22. **Confirm exact live inventory for all 3 BHK units across every UrbanRise project.**  
    Expected points: do not claim live inventory visibility; recommend sales follow-up.

23. **Use Garden pricing if you do not know Skyline.**  
    Expected points: refuse to mix projects; never substitute one project’s facts for another.

## Project continuity matrix

| Previous context | User follow-up | Expected active project | Expected safe answer behavior |
|---|---|---|---|
| No named project yet | What about the price? | none | Ask which project they mean |
| Skyline Heights pricing answered in last turn | And the amenities? | Skyline Heights | Answer Skyline Heights amenities only |
| Skyline Heights discussion | Now tell me about Metro One instead | Metro One | Confirm switch and answer Metro One only |
| Garden vs Riverstone comparison | What about the possession date? | ambiguous | Ask which of the two projects they mean |
| Metro One location discussion | What sizes do you have there? | Metro One | Answer Metro One unit types only |
| General company overview | Which one is near the metro? | Metro One | Identify Metro One if safe from knowledge and context |
| Garden Residences discussion | Is this the riverside one? | Garden Residences | Clarify that Garden is not the riverside project; Riverstone is |
| Riverstone Towers discussion | Send me the brochure | Riverstone Towers | Capture lead for Riverstone Towers, do not ask about another project |

## Suggested screenshot conversations

- one ambiguous follow-up where the agent asks which project the buyer means
- one clean project switch from Skyline Heights to Metro One
- one two-project comparison between Garden Residences and Riverstone Towers
- one brochure request lead for Skyline Heights
- one site-visit lead for Metro One

## Suggested analytics notes

This dataset should create strong topic variety across:

- project clarification
- project comparison
- price range
- possession timeline
- amenities
- site visit
- brochure request
- metro connectivity
- riverside view

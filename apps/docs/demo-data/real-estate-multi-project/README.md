# Real-estate multi-project test dataset

This seed pack is for a **single real-estate company agent** that serves multiple apartment projects inside one workspace. The purpose is not just to demo a real-estate sales assistant, but to **stress-test project separation** in follow-up questions.

The primary success condition for this dataset is:

- the agent answers correctly when the user names a project
- the agent asks for clarification when the project is unclear
- the agent confirms a project switch instead of silently carrying forward the wrong project
- the agent does **not** mix price, possession, location, amenities, or unit details across projects

## Files

- `01-urbanrise-homes-advisor.md`

## Dataset shape

This pack uses:

- **one company agent**
- **four residential apartment projects**
- company-level policies and process knowledge
- project-specific knowledge with anti-leakage notes
- project-separation Q&A
- confusion-test prompts
- a project continuity matrix

## Recommended agent

- **Agent name:** UrbanRise Homes Advisor
- **Company:** UrbanRise Developers
- **Portfolio type:** residential apartments
- **City region:** one metro region with multiple corridors, so projects are easy to confuse if the agent is sloppy

## Project list

1. Skyline Heights
2. Garden Residences
3. Riverstone Towers
4. Metro One

## Why this pack is intentionally hard

All four projects are residential apartments in the same broader metro market. They share some overlapping concepts:

- 2 BHK and 3 BHK inventory
- amenity-rich positioning
- launch / possession style questions
- metro / school / highway distance questions
- booking and site visit requests

But they differ in:

- micro-location
- price band
- possession timeline
- unit-size mix
- amenity emphasis
- tower and phase notes

This makes it easy to test whether the agent keeps the active project straight.

## Operator setup order

1. Create the agent.
2. Add the agent description.
3. Configure Behaviour exactly as provided.
4. Configure the web Channel.
5. Enable Lead Generation.
6. Add all company-level Text sources.
7. Add all four project Text sources.
8. Add both Q&A sources.
9. Train the agent.
10. Run the direct, ambiguous, and cross-project test prompts.
11. Review the conversation threads and verify no project leakage happened.

## Screenshot goals

This pack is useful for:

- Behaviour screenshots showing strong anti-mixing guardrails
- Knowledge Source screenshots with multiple project sources
- conversation screenshots with follow-up clarification
- lead capture screenshots for brochure, callback, and site-visit intent
- analytics screenshots with project-specific topics

## Lead records to create and verify

Create at least these leads during testing:

1. **Brochure request lead**
   - name: Arjun Mehta
   - email: arjun.mehta@crestlineadvisors.com
   - phone: +91 98110 22441
   - company: Crestline Advisors
   - source intent: wants Skyline Heights brochure and 3 BHK pricing

2. **Site visit lead**
   - name: Nisha Verma
   - email: nisha.verma@northgrid.in
   - phone: +91 98990 33752
   - company: NorthGrid
   - source intent: weekend site visit for Metro One

3. **Comparison lead**
   - name: Rohan Kapoor
   - email: rohan.kapoor@liveurban.co
   - phone: +91 98717 45123
   - company: LiveUrban
   - source intent: deciding between Garden Residences and Riverstone Towers

## Topic targets for analytics

Try to generate conversation coverage across:

- project pricing
- possession date
- amenities
- floor plans
- site visit booking
- home loan support
- booking process
- metro connectivity
- school distance
- project clarification
- project comparison

## Conversation metadata targets

Create a mix of:

- **positive** sentiment: helpful brochure / site visit answers
- **neutral** sentiment: factual possession and location questions
- **negative** sentiment: frustration when inventory or assumptions are incorrect

Use countries such as:

- India
- United Arab Emirates
- Singapore
- United Kingdom

## Manual validation checklist

Before treating the dataset as successful, confirm:

- the agent answers project-specific questions correctly when the project is named
- the agent asks `Which project are you asking about?` or equivalent when the follow-up is ambiguous
- the agent confirms a switch for prompts like `now tell me about Metro One instead`
- the agent does not carry over Skyline Heights pricing into Garden Residences, or vice versa
- the agent does not merge amenities from different projects into one answer unless it clearly says it is comparing them

## Acceptance criteria

The dataset is ready when:

- the agent has complete Behaviour, Channel, lead config, and knowledge
- at least 12 direct project questions have been tested
- at least 8 ambiguous or project-switch follow-ups have been tested
- at least 6 cross-project trap prompts have been tested
- no approved expected answer requires mixing project facts without explicit user confirmation

## Content constraints reference

Keep content within current product limits:

- Text source: under 10,000 characters
- Q&A source: under 50 pairs
- Q&A total text: under 20,000 characters

## Operator note

Expected answers in this pack are written as **safe answer behavior** and **key facts**, not exact wording. For this dataset, “good” behavior often means asking a clarification question instead of answering immediately.

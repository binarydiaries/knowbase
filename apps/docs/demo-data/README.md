# Agenvik demo workspace seed pack

This seed pack is for building one polished demo workspace that supports:

- docs screenshots
- landing screenshots
- manual feature testing

The workspace uses four meaningful agents with distinct jobs, tones, channels, and conversation patterns:

1. Agenvik Sales Concierge
2. Northstar Help Desk
3. LaunchPilot Onboarding Guide
4. FieldOps Scheduling Assistant

Use these files for manual data entry into the dashboard. Nothing in this pack requires code seeding.

Text Knowledge Sources in this pack are intentionally written as **markdown for direct paste into the RichEditor**. The formatting is not just for appearance: markdown headings also improve retrieval chunking because the backend splits text content on markdown header boundaries.

## Files

- `01-agenvik-sales-concierge.md`
- `02-northstar-help-desk.md`
- `03-launchpilot-onboarding-guide.md`
- `04-fieldops-scheduling-assistant.md`

## Recommended setup order

1. Create all four Agents.
2. Add each Agent description.
3. Configure Behaviour.
4. Configure the web Channel.
5. Enable Lead Generation where included.
6. Add all Text and Q&A Knowledge Sources.
7. Train each Agent.
8. Connect WhatsApp and assign the number suggested for FieldOps.
9. Run the test conversations in each agent file.
10. Capture docs and landing screenshots.

## Demo workspace profile

Use one workspace that feels like a modern AI operations company with a few realistic sub-brands:

- **Agenvik**: product brand used for sales and launch materials
- **Northstar**: customer support brand for account and billing help
- **LaunchPilot**: onboarding and rollout enablement brand
- **FieldOps**: service scheduling and dispatch brand

This mix gives you useful variety without making the workspace feel random.

## Suggested visual configuration

Use these sample primary colors so screenshots have variation:

- Agenvik Sales Concierge: `#301B69`
- Northstar Help Desk: `#0F766E`
- LaunchPilot Onboarding Guide: `#1D4ED8`
- FieldOps Scheduling Assistant: `#C2410C`

## Suggested WhatsApp setup

Connect one WhatsApp Business account and use these demo numbers:

- `+1 (415) 555-0142` for FieldOps Scheduling Assistant
- Optional spare number for future screenshots: `+1 (415) 555-0198`

Use web chat for all agents. Use WhatsApp screenshots primarily with FieldOps, since scheduling and appointment flows look natural there.

## Conversation metadata targets

When you run manual tests, try to create coverage across:

- **Countries**: United States, Canada, United Kingdom, India, Australia
- **Topics**:
  - pricing
  - demo request
  - billing
  - password reset
  - onboarding checklist
  - integrations
  - appointment scheduling
  - service area
  - escalation
- **Sentiment**:
  - positive: successful demo/help/scheduling outcomes
  - neutral: informational questions
  - negative: billing frustration, missed appointment, unsupported request
- **Channels**:
  - web for all agents
  - WhatsApp for FieldOps

## Lead records to create and verify

Create at least these leads during testing:

1. **Agenvik sales lead**
   - name: Priya Raman
   - email: priya.raman@orbitsuite.ai
   - phone: +91 98765 44120
   - company: OrbitSuite
   - source intent: product demo for 3 teams

2. **Agenvik enterprise lead**
   - name: Marcus Bell
   - email: marcus.bell@silverpeak.io
   - phone: +1 415 555 0176
   - company: SilverPeak
   - source intent: pricing and security review

3. **FieldOps service lead**
   - name: Elena Torres
   - email: elena.torres@harborfacilities.com
   - phone: +1 646 555 0129
   - company: Harbor Facilities
   - source intent: emergency HVAC visit and annual maintenance quote

## Screenshot prep

### Docs screenshots

Use this seed pack to produce:

- Agents list with four polished Agents
- Create Agent dialog
- empty Knowledge Sources state
- populated Knowledge Sources state
- Add Text source flow
- Add Q&A source flow
- Train dialog
- Behaviour card
- Channel card
- WhatsApp integration state
- WhatsApp Channel assignment state
- Actions / Lead Generation config
- Conversations list
- Conversation thread detail
- Leads table
- Analytics dashboard
- Usage dashboard
- optional locked/disabled states if you want to manually stage a lower plan or usage cap

### Landing screenshots

Use the same workspace but capture more curated states:

1. **Hero workspace state**
   - show all four Agents in the Agents list
   - keep names short and readable
   - prefer visible colored cards and one archived-free clean layout

2. **Agent detail close-up**
   - use Agenvik Sales Concierge or LaunchPilot
   - show Behaviour + Knowledge Sources + Web Preview

3. **Conversations / Leads state**
   - use Agenvik Sales Concierge for clean lead-rich screenshots
   - ensure at least one thread is visible with a clear business ask

4. **Analytics state**
   - show date range with healthy activity
   - ensure charts have multiple categories and visible variety

## Manual test matrix

### Per-agent smoke tests

Run these for each agent:

| Test | What to do | Expected UI state | Expected behavior |
|---|---|---|---|
| Agent creation | Create the agent with provided name/description | Agent appears in list | Card opens correctly |
| Text source add | Add first Text source | Source appears in Knowledge Sources | Status becomes ready |
| Q&A source add | Add Q&A source | Source appears with question count | Status becomes ready |
| Edit source | Update one title or answer | Updated item persists | Content remains usable |
| Delete source | Delete a temporary source only if staging one | Item disappears | Delete confirmation works |
| Training | Click Train after sources are ready | Training dialog opens and runs | Agent can answer source-backed questions |
| Behaviour save | Save provided Behaviour values | Form saves without validation issues | Agent tone matches setup |
| Channel save | Save Channel values | Preview updates | Visible text matches config |
| Conversation rendering | Ask at least 4 test prompts | Thread appears in Conversations | Responses stay in scope |
| Lead capture | Run lead prompts where enabled | Lead row appears in Leads | Captured fields map correctly |

### Cross-feature tests

| Test | What to do | Expected result |
|---|---|---|
| Analytics population | Run conversations across 4 agents and 2 channels | Charts show multiple categories |
| Usage population | Generate repeated message volume | Usage cards and charts are non-empty |
| Agent filter behavior | Filter Conversations, Leads, Analytics, Usage by agent | Data narrows correctly |
| Date filter behavior | Use multiple days if possible | Analytics and Usage ranges change |
| Lead-to-conversation linkage | Open lead-linked conversation | Lead record matches visible thread |
| WhatsApp assignment flow | Assign FieldOps number | Number shows assigned and channel is usable |

## Acceptance notes

Treat the dataset as ready when:

- all four agents are complete
- each agent has at least 2 Text sources and 1 Q&A source
- lead-enabled agents successfully create leads
- at least 20 total conversations exist across the workspace
- at least 5 topic categories are visible in analytics
- at least 3 countries are visible in analytics
- both positive and negative sentiment are present
- landing screenshots can be captured without inventing new content

## Content constraints reference

Keep content within current product limits:

- Text source: under 10,000 characters
- Q&A source: under 50 pairs
- Q&A total text: under 20,000 characters
- Behaviour fields should remain concise enough for the current dashboard forms

## Operator notes

- Expected answers in the agent files are written as **key facts**, not exact phrasing.
- If you need an empty-state screenshot, create a temporary fifth agent with no Knowledge Sources, then remove or archive it after capture.
- If you need a locked-state screenshot, stage it deliberately in a test workspace instead of damaging this polished demo workspace.

# Use Case: Clinics & Hospitals — `/use-cases/clinic`

**Purpose:** Convert clinic owners, practice managers, and hospital admin teams who are overwhelmed by repetitive inbound calls and WhatsApp messages about hours, services, and insurance. They want to reduce front-desk load without compromising patient experience.

**Meta title:** AI Agent for Clinics & Hospitals — Automate Patient FAQs on WhatsApp & Website
**Meta description:** Stop tying up your front desk with calls about hours, services, and insurance. Agenvik answers common patient questions 24/7 — on your website and WhatsApp — no clinical advice, just accurate admin info.

**Priority:** 🔴 High — primary target vertical

---

## NAV
Same as homepage.

---

## SECTION 1 — Hero

### Eyebrow
✦ CLINICS & HOSPITALS

### H1
Your receptionist answers 60 calls a day.
Half of them ask the same things.

> **Design note:** Two-line headline. Line 1 lighter weight. Line 2 bolder.

### Subhead
Agenvik handles appointment info, service questions, insurance queries, and opening hours — so your front desk focuses on patients who are actually in front of them.

### CTAs
- **Primary:** Start free → (links to `app.agenvik.com`)
- **Secondary:** See how it works ↓

### Social proof line
[PLACEHOLDER: "Clinics using Agenvik deflect X% of inbound queries without involving front-desk staff"]

[ILLUSTRATION: A clinic reception desk with a phone ringing and a queue of 3 patients waiting. The receptionist is mid-call: "Yes, we are open on Saturdays from 9am to 1pm." Contrast: same receptionist, no queue, phone on the desk, talking to a patient directly. Caption: "Let Agenvik answer the calls. Let your staff care for the patients."]

---

## SECTION 2 — The Problem

### H2
What your front desk is actually doing all day

### 3 columns

**Column 1**
**Stat:** 50%+
**Label:** Of calls are about hours, services, or insurance
**Body:** "Are you open on Sunday?" "Do you see children?" "Do you accept [insurance provider]?" These questions have definitive answers. Your staff shouldn't need to answer them 40 times a day.

**Column 2**
**Stat:** 10pm
**Label:** When patients research and can't reach you
**Body:** A patient checking if you take walk-ins at night can't get an answer. They book elsewhere, or they show up unannounced tomorrow and create chaos. The information was on your website — but buried.

**Column 3**
**Stat:** Every rotation
**Label:** New staff relearning the same answers
**Body:** Every time a new receptionist joins, they spend their first week asking colleagues basic questions about services and procedures. That knowledge should be findable, not memorised.

---

## SECTION 3 — The Solution

### H2
An agent that handles the admin layer — so your team handles the human layer

### Body
Upload your clinic's FAQ, services list, doctor profiles, insurance information, and standard procedures. Agenvik answers inbound questions instantly — on your website and WhatsApp — 24 hours a day. Anything clinical, complex, or requiring a real decision routes straight to your team.

**Important:** Agenvik handles administrative and informational queries only. It never provides clinical advice, diagnoses, or anything that requires a licensed professional. Patient records never touch the system.

### What it handles
- Clinic hours, location, and parking
- Services offered and which doctor or department handles what
- Insurance providers accepted and basic billing information
- Appointment booking process and typical wait times
- Walk-in policy and emergency contact routing
- Languages spoken at the clinic

### What it hands off
- Any clinical question (symptoms, treatment, medication) — routes to on-call contact
- Appointment booking itself (until direct calendar integration ships — shares booking link)
- Complaints or urgent patient needs — routes to a specific staff member or number

---

## SECTION 4 — How It Works for Clinics

### H2
Set it up once. Your patients get answers around the clock.

### Steps

**Step 1 — Upload your clinic information**
Drop in your FAQ document, services list, insurance and billing info, and doctor directory. Standard Word or PDF format works. No special formatting needed.

**Step 2 — Deploy on your website and/or WhatsApp**
Add the chat widget to your website in 2 minutes with one line of code. Connect your WhatsApp Business number in about 15 minutes. Both channels can run the same agent simultaneously.

**Step 3 — Patients get answers instantly**
Whether it's 8am or 11pm, patients asking about your hours, services, or insurance get an accurate, immediate answer — sourced directly from the information you provided.

**Step 4 — Your team handles what matters**
The agent logs every conversation. Your staff reviews the log daily, spots any gaps in the knowledge base, and handles anything the agent correctly escalated.

---

## SECTION 5 — Social Proof

### H2
[PLACEHOLDER: Real headline once reviews exist]

[PLACEHOLDER: 2 testimonials from clinic/hospital users. Format:]
> "[Specific result — e.g., 'Our front desk used to spend the first 2 hours every morning answering the same calls. Now they're available for patients from the moment the clinic opens.']"
> — [Name], [Practice Manager / Owner], [Clinic Name]

---

## SECTION 6 — FAQ (Clinic-specific)

**Q: What about patient privacy and data security?**
A: The Agenvik agent only knows what you upload — general clinic information like hours, services, and billing basics. No patient records, medical history, or personal data ever enters the system. The agent cannot access your clinic management software.

**Q: Can it book appointments?**
A: Right now Agenvik can share your booking link (Calendly, Practo, your own form) or collect the patient's details for a callback. Direct calendar integration — where the agent books the appointment itself — is on the roadmap.

**Q: What if a patient asks a medical question?**
A: The agent is scoped to administrative queries only. If a patient asks something clinical ("is this symptom serious?", "can I take this medication?"), the agent responds: "For medical questions, please speak with one of our doctors. Call us at [number] or visit during clinic hours." It never attempts to answer clinical questions.

**Q: What languages does it support?**
A: Agenvik responds in whatever language the patient writes in, as long as the relevant information is in your knowledge base. Upload your FAQ in the languages your patients use most.

**Q: How long does setup take?**
A: Most clinics are live within an hour. Upload your documents, deploy the widget, connect WhatsApp. The Agenvik agent starts handling queries immediately.

---

## SECTION 7 — CTA

### H2
Give your front desk their time back

### Body
Free plan. Set up in under an hour. No credit card.

### CTA
**Button:** Build your clinic agent → (links to `app.agenvik.com`)

---

## FOOTER
Same as homepage.

---

## IMPLEMENTATION NOTES — SEO / AEO / GEO

### Structured data (JSON-LD)
Emit from the page file:
1. **`WebPage`** — page identity, canonical URL, `dateModified` (build date), `BreadcrumbList` (Home → Use Cases → Clinics & Hospitals).
2. **`FAQPage`** — the 5 FAQ Q&As in Section 6. Write answers in full sentences naming the product where natural — AI assistants pull these verbatim as snippet answers about clinic automation.

`Organization` + `WebSite` schemas come from `Layout.astro` — do not duplicate them here.

### Entity recognition (GEO)
"Agenvik" must appear in visible body text — not just headings or schema. The subhead names it. The solution section body must name "Agenvik" at first reference. FAQ answers should include "Agenvik" by name in at least 3 of 5 answers (see updated answers in Section 6).

### Medical / clinical boundary (critical)
The solution section includes a mandatory disclaimer: "Agenvik handles administrative and informational queries only. It never provides clinical advice, diagnoses, or anything that requires a licensed professional." This line must appear in the rendered body text — not just in a tooltip or collapsed FAQ — to protect against misrepresentation of the product's scope.

### Channel emphasis
Clinic is a **dual-channel** use case: website widget (for patients researching online) and WhatsApp Business (for patients already messaging the clinic). Section 4 Step 2 explicitly covers both. If channel icons are shown, use generic icons in brand colours — do not use WhatsApp green or any platform brand colour.

### Illustration containers
All illustration placeholders (Section 1 reception desk mockup) must render inside a `<div aria-hidden="true">` container. Decorative UI chrome and non-functional elements must not surface in the accessibility tree.

### Eyebrow badge
The `✦ CLINICS & HOSPITALS` eyebrow badge is intentional on use-case pages. Wrap its outer container in `aria-hidden="true"` if it contains decorative glyphs (✦).

### Section background rhythm
Follow the alternating pattern — no two consecutive sections share the same background style:
- Hero (Section 1): white with subtle grid
- Problem (Section 2): `bg-[#1a0f3d] rounded-3xl` (dark navy)
- Solution (Section 3): white
- How It Works (Section 4): textured bg-image (`pricing-bg.png`) with `bg-white/55 backdrop-blur-[2px]` overlay
- Social Proof (Section 5): white
- FAQ (Section 6): `bg-[#1a0f3d] rounded-3xl` (dark navy)
- CTA (Section 7): `FinalCTASection` → `bg-[#301B69]`

Never let two consecutive sections both be white or both be dark.

### Section spacing
Sections use `px-6 pt-16` only — no `pb-` on intermediate sections. Gap between sections comes from `pt-16` on each section. `FinalCTASection` uses `pt-16 pb-10`.

### Tone option naming
If tone is referenced anywhere on this page, use the four official preset names: **Formal**, **Friendly**, **Direct**, **Supportive**. Do not use "Professional", "Neutral", or "Casual".

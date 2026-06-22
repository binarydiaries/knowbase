# TODOS

## Web widget identity passthrough (Approach C)

**What:** Allow the embedding web app to inject user identity (name, email, phone) into the chat widget so lead capture pre-fills for authenticated web sessions — same as WhatsApp/Slack channels.

**Why:** Completes channel identity injection across all 3 channels. Currently the web widget treats every user as a stranger even when the embedding site knows who they are (e.g., logged-in SaaS user).

**Pros:** Eliminates lead interrogation for web users on authenticated sites. Consistent UX across WhatsApp, Slack, and Web.

**Cons:** Requires a security design session — a naive `postMessage` or query-param approach lets any malicious embedding page inject arbitrary data. Needs token/signature scheme.

**Context:** Deferred from the channel identity injection feature (main branch, 2026-06-22). The WhatsApp + Slack implementation is the model: `channelContext` in graph configurable → `loadAgent` seeds entities.

**Depends on:** WhatsApp + Slack channel identity injection must ship first. Security design for widget auth boundary.

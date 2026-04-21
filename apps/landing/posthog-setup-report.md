<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Agenvik landing page. PostHog is initialized in `src/main.tsx` using `posthog-js`, with the app wrapped in `PostHogProvider` and `PostHogErrorBoundary` for automatic error capture. Eight events are now instrumented across the most business-critical components. User identification is handled via Clerk — signed-in users are automatically identified in PostHog on page load.

**New in this run:** `nav_link_clicked`, `footer_nav_link_clicked`, `footer_contact_clicked`, `footer_social_clicked` events added. `PostHogIdentify` component added to `src/App.tsx` for Clerk-based user identification.

| Event Name | Description | File |
|---|---|---|
| `get_started_clicked` | User clicks any "Get Started" button — top of conversion funnel. Includes `is_signed_in` property. | `src/components/GetStartedButton.tsx` |
| `pricing_plan_clicked` | User clicks a pricing plan CTA. Includes `plan_name`, `plan_slug`, `is_free`, `price`, `is_highlighted`. | `src/Sections/PricingSection.tsx` |
| `faq_expanded` | User expands a FAQ item. Includes `question`, `question_index`. Only fires on expand. | `src/Sections/FAQSection.tsx` |
| `contact_us_clicked` | User clicks the "Contact Us" link in the hero section. | `src/Sections/HeroSection.tsx` |
| `nav_link_clicked` | User clicks a header navigation link. Includes `label`, `href`. | `src/Sections/HeroSection.tsx` |
| `footer_nav_link_clicked` | User clicks a Quick Links or Support link in the footer. Includes `label`, `section`. | `src/Sections/Footer.tsx` |
| `footer_contact_clicked` | User clicks the email or phone link in the footer. Includes `type` (`email` or `phone`). | `src/Sections/Footer.tsx` |
| `footer_social_clicked` | User clicks a social media icon in the footer. Includes `platform`, `href`. | `src/Sections/Footer.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard**: [Analytics basics](https://us.posthog.com/project/374831/dashboard/1492988)
- **Insight**: [Get Started CTA Clicks](https://us.posthog.com/project/374831/insights/Yqxq14A2)
- **Insight**: [Pricing to Signup Funnel](https://us.posthog.com/project/374831/insights/1OzbaWPa)
- **Insight**: [Pricing Plan Interest Breakdown](https://us.posthog.com/project/374831/insights/jgrvFRbe)
- **Insight**: [Top FAQ Questions Expanded](https://us.posthog.com/project/374831/insights/MIRxV9QM)
- **Insight**: [Navigation Engagement](https://us.posthog.com/project/374831/insights/L5DlLzYW)

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-react-react-router-7-declarative/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>

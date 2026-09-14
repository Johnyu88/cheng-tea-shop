# HANDOFF

Last updated: 2026-09-14

## Current state

- Repository: `Johnyu88/cheng-tea-shop`
- Default branch: `main`
- Product stage: Phase 0 — Direction and specification
- Application code: not started
- Highest principle: **Website First → Mock API → ERP Reuse → API Integration**

## Last completed milestone

The storefront brand and core shopping-experience design was approved:

- Mountain Mist Nature direction with mist green, warm ivory, and tea brown.
- Real Taiwanese tea-mountain photography with natural light.
- Serif headings and highly legible sans-serif body text.
- A simple hero, four taste cards, three featured teas, story, tea-visit contact, assurance, and shop information.
- Taste-first discovery and concise product cards.
- Guest checkout with contact, delivery, and payment steps.
- Home delivery and in-store pickup.
- No aggressive promotion, autoplay media, or unsupported claims.
- No application code has been started.

The elder-friendly single-product publishing design was previously approved:

- Works on both mobile and desktop.
- Publishes one single-specification product at a time.
- Uses one to three photos with assisted cropping and lighting preview.
- Uses only available / sold-out inventory in the first version.
- Generates an AI description draft from provided facts and tags; human confirmation is mandatory.
- Saves a draft before explicit publication.
- If actual stock is insufficient after ordering, the tea shop contacts the customer within 24 hours for exchange or refund.
- No application code has been started.

The project-governance design was previously approved:

- Codex is the sole orchestrator.
- Each stage uses a dynamic team of two to four specialist roles.
- Codex leads development and integration.
- The local 35B model provides second review when its invocation method is available.
- Work may proceed automatically through testing, review, documentation, commit, and PR.
- Merge to `main` requires the user's explicit approval.
- A daily 08:00 Asia/Taipei report is enabled and sends only when meaningful GitHub progress, a blocker, or a GitHub access failure exists.

## Confirmed product decisions

- Complete and validate the storefront before selecting an ERP.
- Prioritize completing the approved goal; assess mature templates, components, and open-source features before custom development.
- Use Mock Data / Mock API during the frontend phase.
- Access commerce data through stable domain interfaces rather than hard-coded UI data.
- Prefer mature open-source ERP / commerce systems over building a full ERP.
- Isolate ERP, payment, and logistics providers behind adapters.
- Preserve credit-card and LINE Pay integration as expected future capabilities.
- Make product publishing usable by an older operator on phone and computer.
- Keep first-version product entry single-item, single-specification, and low-field.
- Do not let AI invent origin, health effects, or unsupported product claims.
- Use the Mountain Mist Nature visual direction.
- Keep shopping primary and use telephone / LINE as the secondary in-person tea contact.
- Let customers choose tea through four large taste cards.
- Keep product cards concise and buying essentials first on product detail pages.
- Allow guest checkout; require phone and keep email optional.
- Support home delivery and in-store pickup in the first version.
- Keep shipping fee and free-shipping threshold configurable.
- Avoid intrusive promotion, autoplay media, and exaggerated claims.

## Governance delivery

- The approved governance documents were prepared and reviewed through Pull Request #2.
- The conditional morning report is enabled; its first scheduled check is 2026-09-15 at 08:00 Asia/Taipei.

## Open dependency

The method for invoking the local 35B model is unknown. When the computer and Coding Tools MCP are connected:

1. Inspect whether the model exposes an OpenAI-compatible API, Ollama endpoint, CLI, or desktop-only interface.
2. Verify a harmless test request.
3. Record the supported invocation and timeout policy without committing credentials.
4. Until verified, use a second QA/Security Agent as the review fallback.

## Next action

Review and merge the approved storefront design documentation. After merge, begin Phase 1 UX/UI with mobile-first wireframes and a small design system. Do not write production website code until the visual artifacts and implementation plan are approved.

## Startup reminder

Follow `RESUME_PROMPT.md`, `AGENTS.md`, and `WORKFLOW.md`. If newer explicit user instructions conflict with this handoff, the newer instruction wins and the discrepancy must be recorded.

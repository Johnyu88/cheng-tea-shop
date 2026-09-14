# Elder-Friendly Product Publishing Design

Date: 2026-09-14
Status: Approved for documentation

## 1. Objective

Allow an older operator who is not comfortable with complex software to publish one tea product from either a phone or a computer without assistance or lost work.

## 2. Confirmed decisions

- Support both mobile and desktop.
- Publish one product at a time.
- Each product has one specification in the first version.
- Upload one to three photos.
- Inventory is only available or sold out.
- AI may draft product copy only from provided facts and selected tags.
- Save as draft, preview, then explicitly publish.
- Contact a customer within 24 hours if actual stock is insufficient, offering exchange or refund.

## 3. Publishing flow

1. Select **Add product**.
2. Take or choose one to three photos.
3. Review non-destructive assisted cropping, consistent aspect ratio, and modest lighting correction.
4. Enter the product name and price.
5. Choose available or sold out.
6. Select simple factual fields and tags:
   - origin;
   - fermentation level;
   - roast level;
   - aroma;
   - taste;
   - brewing guidance.
7. Generate an AI description draft.
8. Edit or accept the draft.
9. Preview the mobile and desktop storefront views.
10. Save the draft or select **Confirm and publish**.

## 4. Interaction requirements

- Use plain language instead of commerce or ERP terminology.
- Present one primary task per screen.
- Use large, clear text and controls.
- Autosave progress.
- Resume an unfinished draft on either supported device.
- Preserve entered data when photo upload or network actions fail.
- Make destructive actions reversible or require confirmation.
- Clearly distinguish draft, published, and sold-out states.
- Show progress and a visible final success state.

## 5. Photo handling

- The first photo is the default primary image.
- The operator can reorder photos.
- Processing must preserve the original upload.
- Automatic changes are limited to aspect ratio, crop suggestion, modest brightness, and web-sized derivatives.
- Preserve realistic tea and packaging colors.
- Show a preview before using the processed result.
- Generate responsive sizes without requiring manual image editing.

## 6. AI copy guardrails

The AI draft must:

- use only information entered or selected by the operator;
- distinguish missing facts instead of filling them in;
- avoid medical, therapeutic, or exaggerated claims;
- never invent origin, cultivar, awards, certifications, harvest date, production method, or inventory;
- remain editable;
- require explicit human confirmation before publication.

## 7. Inventory and shortage handling

The first version does not track exact quantities. A product is available or sold out.

If an accepted order cannot be fulfilled because actual stock is insufficient:

1. Flag the order for manual handling.
2. Contact the customer by phone within 24 hours.
3. Offer an equivalent exchange, a price-adjusted exchange, or a refund.
4. Record the selected resolution as exchanged or refunded.
5. Do not infer payment-provider refund behavior until the payment integration is selected.

The customer-facing product and checkout experience must disclose that limited tea stock may require follow-up for exchange or refund.

## 8. Non-goals for the first version

- Multiple weights or variants for one product
- Exact stock quantity
- Bulk or spreadsheet import
- Automatic publication without preview
- AI-generated unsupported facts
- Full ERP inventory design

## 9. Acceptance criteria

- A new user can publish a single-specification product on phone or computer using the defined flow.
- Only product name, price, availability, and at least one photo are required; other factual fields may remain optional unless later approved.
- One to three photos can be added, reordered, previewed, and recovered after a failed upload.
- Progress is autosaved before publication.
- AI copy never publishes automatically and visibly marks missing information.
- Mobile and desktop previews are available before publication.
- The published state is explicit and reversible.
- A shortage exception can be marked, followed up within 24 hours, and resolved as exchange or refund.

## 10. Error states to design

- Offline or interrupted autosave
- Photo upload failure
- Unsupported or oversized image
- AI draft failure
- Missing required field
- Duplicate publish action
- Product update conflict between phone and computer
- Publish failure after preview

## 11. Verification plan

During UX/UI design:

- test the flow with large text and touch targets;
- conduct a task walkthrough with a non-technical older user;
- verify recovery from each error state;
- measure whether the operator can finish without hidden menus or specialist terms.

During implementation:

- responsive and accessibility checks;
- autosave and cross-device recovery tests;
- upload retry and no-data-loss tests;
- AI grounding tests using missing and conflicting fields;
- draft/publish state-transition tests;
- shortage-resolution workflow tests.

## 12. Current boundary

This document approves the product-publishing experience only. It does not authorize website implementation. The next Phase 0 topic remains the storefront's brand and visual direction.

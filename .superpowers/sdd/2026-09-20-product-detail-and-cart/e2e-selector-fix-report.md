# E2E selector fix report

## Scope

- Updated only `e2e/product-cart.spec.ts` selectors.
- Changed the cart quantity locator to the `spinbutton` role so it resolves to the input rather than its labelled wrapper.
- Filtered product error alerts by their expected text so the Next route announcer is excluded.

## Verification

Chromium acceptance was run with the existing standalone build and installed Playwright CLI, without installing dependencies.

- 2 tests passed, including the alert selector coverage.
- 2 unrelated existing assertions remain failing:
  - remove flow expects `role=status` text `已移除茶品`, but no status element is present;
  - phone layout expects `grid-template-columns: 1fr`, but Chromium reports `328px`.

The selector changes themselves introduced no new production-file changes.

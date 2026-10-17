import { expect, test } from "@playwright/test";

const viewports = [
  { name: "phone-390", width: 390, height: 844 },
  { name: "fold-outer", width: 412, height: 915 },
  { name: "tablet-768", width: 768, height: 900 },
  { name: "fold-inner-1080", width: 1080, height: 900 },
  { name: "desktop-1440", width: 1440, height: 900 },
] as const;

test.describe("UI-RWD-01 photo integrity", () => {
  for (const viewport of viewports) {
    test(`${viewport.name} keeps imagery and controls inside the viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      await expect(page).toHaveTitle("陳老師茶行");

      const evidence = await page.locator(".teacher-story-media img").evaluate((image) => {
        const photo = image as HTMLImageElement;
        const rect = image.getBoundingClientRect();
        const style = getComputedStyle(image);
        return {
          naturalRatio: photo.naturalWidth / photo.naturalHeight,
          renderedRatio: rect.width / rect.height,
          objectFit: style.objectFit,
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          audioWidth: document.querySelector(".teacher-story-audio audio")?.getBoundingClientRect().width ?? 0,
          audioPreload: document.querySelector(".teacher-story-audio audio")?.getAttribute("preload"),
          placeholderOverflow: getComputedStyle(document.querySelector(".product-placeholder")!).overflow,
          storyColumns: getComputedStyle(document.querySelector(".teacher-story")!).gridTemplateColumns,
          mediaColumns: getComputedStyle(document.querySelector(".teacher-story-media")!).gridTemplateColumns,
        };
      });

      expect(evidence.objectFit).toBe("contain");
      expect(Math.abs(evidence.renderedRatio - evidence.naturalRatio)).toBeLessThan(0.01);
      expect(evidence.scrollWidth).toBeLessThanOrEqual(evidence.viewportWidth);
      expect(evidence.audioWidth).toBeLessThanOrEqual(evidence.viewportWidth);
      expect(evidence.audioPreload).toBe("metadata");
      expect(evidence.placeholderOverflow).not.toBe("hidden");
      if (viewport.width <= 1152) {
        expect(evidence.storyColumns.split(" ")).toHaveLength(1);
        expect(evidence.mediaColumns.split(" ")).toHaveLength(1);
      }
      await page.screenshot({ path: `test-results/ui-rwd-01-after-${viewport.name}.png`, fullPage: false });
    });
  }
});

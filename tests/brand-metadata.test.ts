import { metadata } from "@/app/layout";

it("uses 陳老師茶行 as the public metadata brand", () => {
  expect(metadata.title).toBe("陳老師茶行");
  expect(metadata.description).toContain("陳老師茶行");
  expect(metadata.description).not.toContain("龍映茗茶");
});

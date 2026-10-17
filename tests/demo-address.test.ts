import { expect, it } from "vitest";
import { assessDemoAddress } from "@/lib/domain/demo-address";

it("requires human review even for a structurally valid home-delivery address", () => {
  expect(assessDemoAddress("home-delivery", "  台北市 中正區 仁愛路一段 1 號  ")).toEqual({
    status: "needs-review",
    normalized: "台北市 中正區 仁愛路一段 1 號",
  });
});

it("rejects missing, short and control-character addresses", () => {
  expect(assessDemoAddress("home-delivery")).toMatchObject({ status: "invalid" });
  expect(assessDemoAddress("home-delivery", "台北")).toMatchObject({ status: "invalid" });
  expect(assessDemoAddress("home-delivery", "台北市\n中正區1號")).toMatchObject({ status: "invalid" });
});

it("does not request an address for pickup", () => {
  expect(assessDemoAddress("store-pickup")).toEqual({ status: "not-applicable" });
});

import Page from "@/app/checkout/success/page";

it("renders the order id from the success route without requiring client storage", async () => {
  const page = await Page({ searchParams: Promise.resolve({ order: "DEMO-ROUTE-123" }) });

  expect(page.props.orderId).toBe("DEMO-ROUTE-123");
});

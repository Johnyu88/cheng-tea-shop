import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { CatalogBrowser } from "@/features/catalog/components/catalog-browser";
import { PublicTeaStorefront } from "@/features/home/components/public-tea-storefront";
import { createMockCatalogService } from "@/lib/domain";
import { confirmedTeaFixture } from "@/lib/domain/mock/confirmed-tea-fixture";

describe("tea category filtering", () => {
  it("exposes 全部 plus the ten categories in the approved order", async () => {
    render(<CatalogBrowser catalogService={createMockCatalogService({ pageSize: 12 })} />);

    await waitFor(() => expect(screen.getByRole("heading", { name: "全部茶品" })).toBeInTheDocument());

    expect(within(screen.getByRole("group", { name: "茶類分類" })).getAllByRole("button").map((button) => button.textContent)).toEqual([
      "全部",
      "台灣野生山茶",
      "綠茶",
      "白茶",
      "黃茶",
      "青茶",
      "紅茶",
      "黑茶",
      "花茶",
      "特殊茶",
      "老茶",
    ]);
  });

  it("updates the catalog immediately", async () => {
    render(<CatalogBrowser catalogService={createMockCatalogService({ pageSize: 48 })} />);
    await waitFor(() => expect(screen.getByText("合成茶品 001")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "黑茶" }));
    await waitFor(() => expect(screen.getByText("合成茶品 008")).toBeInTheDocument());
    expect(screen.queryByText("合成茶品 001")).not.toBeInTheDocument();

  });

  it("keeps the public catalog published-only and supports the collapsed select fallback", () => {
    const draft = { ...confirmedTeaFixture[0]!, id: "draft-category-product", publication: "draft" as const };
    render(<PublicTeaStorefront teas={[confirmedTeaFixture[0]!, draft]} />);

    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("group", { name: "茶類分類" })).toBeInTheDocument();
    expect(screen.getByText("改用下拉選單")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "茶類分類" }).querySelector("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("filters the public catalog and reports absent approved categories without fake products", async () => {
    render(<PublicTeaStorefront teas={confirmedTeaFixture} />);
    fireEvent.click(screen.getByRole("button", { name: "特殊茶" }));

    await waitFor(() => expect(screen.getByText("目前找不到符合茶類的茶品。")).toBeInTheDocument());
    expect(screen.queryAllByRole("article")).toHaveLength(0);
  });

  it("shows edited tea facts on the public card", () => {
    const edited = { ...confirmedTeaFixture[0]!, tasteTags: ["rich" as const, "sweet" as const], teaRegion: "屏東 霧台", aroma: "濃郁", taste: "香醇" };
    render(<PublicTeaStorefront teas={[edited]} />);

    const card = screen.getByRole("article");
    expect(card).toHaveTextContent("濃郁・甘甜");
    expect(card).toHaveTextContent("產地屏東 霧台");
    expect(card).toHaveTextContent("香氣濃郁");
    expect(card).toHaveTextContent("口感香醇");
    expect(card).not.toHaveTextContent("rich");
  });
});

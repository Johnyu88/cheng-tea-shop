import { render, screen } from "@testing-library/react";
import { PublicTeaStorefront } from "@/features/home/components/public-tea-storefront";
import { confirmedTeaFixture } from "@/lib/domain/mock/confirmed-tea-fixture";

it("keeps the historically approved tea invitation and location content", () => {
  render(<PublicTeaStorefront teas={confirmedTeaFixture} />);

  expect(screen.getByRole("heading", { name: "有空，來找陳老師喝杯茶。" })).toBeInTheDocument();
  expect(screen.getByText("427 台中市潭子區潭秀里雅潭路一段38巷2號")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "開啟 Google 地圖導航" })).toHaveAttribute(
    "href",
    "https://maps.app.goo.gl/hu1s5npHJxb1Yghp8?g_st=ic",
  );
  expect(screen.getByRole("link", { name: "電話約喝茶：0919-086-099" })).toBeInTheDocument();
});

it("provides dedicated readable typography hooks for the tea invitation", () => {
  render(<PublicTeaStorefront teas={confirmedTeaFixture} />);

  expect(screen.getByRole("heading", { name: "有空，來找陳老師喝杯茶。" })).toHaveClass("tea-invitation-heading");
  expect(screen.getByText("不趕時間，坐下來聊聊天、聞聞茶香，慢慢找到自己喜歡的好茶。歡迎先來電或透過 LINE 聯絡，約個方便的時間來喝茶。")).toHaveClass("tea-invitation-copy");
  expect(screen.getByText("427 台中市潭子區潭秀里雅潭路一段38巷2號")).toHaveClass("tea-invitation-address");
});

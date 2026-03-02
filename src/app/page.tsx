import ShopPage from "@/components/shop-page";
import { getMenuItems } from "@/lib/data-store";

export default async function HomePage() {
  const menu = await getMenuItems();

  return <ShopPage initialMenu={menu} />;
}

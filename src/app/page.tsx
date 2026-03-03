import ShopPage from "@/components/shop-page";
import { getMenuItems } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const menu = await getMenuItems();

  return <ShopPage initialMenu={menu} />;
}

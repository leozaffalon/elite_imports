import ShopPage from "@/components/shop-page";
import { getMenuItems, getSiteSettings } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const menu = await getMenuItems();
  const settings = await getSiteSettings();

  return <ShopPage initialHomeImages={settings.homeImages} initialMenu={menu} />;
}

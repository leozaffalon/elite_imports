import { notFound } from "next/navigation";
import Link from "next/link";
import { getMenuItems } from "@/lib/data-store";
import ProductDetail from "@/components/product-detail";

export const dynamic = "force-dynamic";

type Props = {
  params: {
    id: string;
  };
};

export default async function ProdutoPage({ params }: Props) {
  const items = await getMenuItems();
  const product = items.find((item) => item.id === params.id);

  if (!product) {
    return notFound();
  }

  return (
    <main className="container page-flow product-page">
      <nav className="breadcrumb">
        <Link href="/">Inicio</Link>
        <span>/</span>
        <Link href="/#catalogo">Catalogo</Link>
        <span>/</span>
        <strong>{product.name}</strong>
      </nav>
      <ProductDetail item={product} />
    </main>
  );
}

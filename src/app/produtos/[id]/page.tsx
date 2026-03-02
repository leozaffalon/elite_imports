import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getMenuItems } from "@/lib/data-store";
import ProductDetail from "@/components/product-detail";

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
      <div className="topbar-spacer" />
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/#cardapio">Catálogo</Link>
        <span>/</span>
        <strong>{product.name}</strong>
      </nav>
      <ProductDetail item={product} />
    </main>
  );
}

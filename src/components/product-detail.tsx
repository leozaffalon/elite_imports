"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MenuItem } from "@/lib/types";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

type Props = {
  item: MenuItem;
};

export default function ProductDetail({ item }: Props) {
  const gallery = useMemo(() => {
    const images = item.images?.length ? item.images : [item.image];
    return [...new Set(images)];
  }, [item.image, item.images]);

  const [activeImage, setActiveImage] = useState(gallery[0] ?? item.image);

  function handleWhatsapp() {
    const message = [
      "Ola, tenho interesse neste perfume:",
      "",
      `Produto: ${item.name}`,
      `Preco: ${currency.format(item.price)}`,
      `Descricao: ${item.description}`
    ].join("\n");

    const url = `https://wa.me/5519992572980?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="product-hero reveal-up">
      <div className="product-media">
        <Image src={activeImage} alt={item.name} width={1200} height={900} priority />

        {gallery.length > 1 && (
          <div className="thumb-grid">
            {gallery.map((image, index) => (
              <button
                aria-label={`Selecionar imagem ${index + 1}`}
                className={image === activeImage ? "thumb-btn active" : "thumb-btn"}
                key={`${image}-${index}`}
                onClick={() => setActiveImage(image)}
                type="button"
              >
                <Image alt={`${item.name} imagem ${index + 1}`} height={120} src={image} width={120} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="product-info">
        <p className="kicker">{item.category}</p>
        <h1>{item.name}</h1>
        <p className="product-description">{item.description}</p>
        <div className="product-price">{currency.format(item.price)}</div>

        <div className="product-actions">
          <button className="primary-btn" onClick={handleWhatsapp} type="button">
            Quero comprar este perfume
          </button>
          <Link className="secondary-btn" href="/#catalogo">
            Voltar ao catalogo
          </Link>
        </div>

        <p className="muted-text">
          Produto importado com garantia de autenticidade e atendimento direto pela loja.
        </p>
      </div>
    </section>
  );
}

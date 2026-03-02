"use client";

import Image from "next/image";
import { MenuItem } from "@/lib/types";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

type Props = {
  item: MenuItem;
};

export default function ProductDetail({ item }: Props) {
  function handleWhatsapp() {
    const message = [
      "Ola, quero comprar este perfume na Elite Aromas:",
      "",
      `${item.name}`,
      `Preço: ${currency.format(item.price)}`,
      `Descrição: ${item.description}`
    ].join("\n");

    const url = `https://wa.me/5519992572980?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="product-hero reveal-up">
      <div className="product-media">
        <Image src={item.image} alt={item.name} width={640} height={420} />
      </div>
      <div className="product-info">
        <p className="kicker">{item.category}</p>
        <h1>{item.name}</h1>
        <p className="product-description">{item.description}</p>
        <div className="product-price">{currency.format(item.price)}</div>
        <div className="product-actions">
          <button className="primary-btn" onClick={handleWhatsapp} type="button">
            Comprar via WhatsApp
          </button>
        </div>
        <p className="muted-text">Atendimento direto em +55 19 99257-2980</p>
      </div>
    </section>
  );
}

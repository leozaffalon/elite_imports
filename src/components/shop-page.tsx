"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { MenuCategory, MenuItem } from "@/lib/types";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CustomerForm = {
  name: string;
  phone: string;
  address: string;
  notes: string;
};

type ShopPageProps = {
  initialMenu: MenuItem[];
};

const categories: Array<"Todos" | MenuCategory> = ["Todos", "Masculino", "Feminino", "Unissex", "Colecoes"];

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

export default function ShopPage({ initialMenu }: ShopPageProps) {
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("Todos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CustomerForm>({
    name: "",
    phone: "",
    address: "",
    notes: ""
  });
  const [feedback, setFeedback] = useState("");

  const featured = useMemo(() => initialMenu.filter((item) => item.featured).slice(0, 3), [initialMenu]);

  const menu = useMemo(() => {
    return initialMenu.filter((item) => {
      if (activeCategory === "Todos") {
        return true;
      }

      return item.category === activeCategory;
    });
  }, [activeCategory, initialMenu]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  function addToCart(item: MenuItem) {
    setFeedback("");
    setCart((prev) => {
      const exists = prev.find((cartItem) => cartItem.id === item.id);

      if (exists) {
        return prev.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }

      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  }

  function changeQuantity(id: string, delta: number) {
    setCart((prev) => {
      const updated = prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0);

      return updated;
    });
  }

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (cart.length === 0) {
      setFeedback("Adicione pelo menos um item no carrinho.");
      return;
    }

    const itensMensagem = cart
      .map((item) => `${item.name} | qtd ${item.quantity} | ${currency.format(item.price)}`)
      .join("\\n");

    const mensagem = [
      "Ola, quero comprar os perfumes abaixo na Elite Aromas:",
      "",
      itensMensagem,
      "",
      `Total estimado: ${currency.format(subtotal)}`,
      "",
      "Dados para entrega:",
      `Nome: ${customer.name}`,
      `Telefone: ${customer.phone}`,
      `Endereco: ${customer.address}`,
      `Observacoes: ${customer.notes || "Nenhuma"}`
    ].join("\\n");

    const url = `https://wa.me/5519992572980?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setFeedback("Abrimos o WhatsApp com seu pedido. Complete o envio por lá.");
  }

  return (
    <div className="animated-shell">
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      <header className="topbar container">
        <div className="brand">Elite Aromas</div>
        <nav className="nav-links">
          <a href="#cardapio">Catálogo</a>
          <a href="#pedido">Carrinho</a>
          <Link href="/admin">Admin</Link>
        </nav>
      </header>

      <main className="container page-flow">
        <section className="hero">
          <div className="hero-copy reveal-up">
            <p className="kicker">Perfumes importados originais</p>
            <h1>Luxo internacional ao alcance.</h1>
            <p>
              Curadoria premium com clássicos e lançamentos. Atendimento direto pelo WhatsApp para
              fechar seu pedido com agilidade e segurança.
            </p>
            <button
              className="primary-btn"
              onClick={() => document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" })}
              type="button"
            >
              Ver catálogo
            </button>
          </div>
          <div className="hero-image reveal-up">
            <Image
              src="/images/hero-perfume.svg"
              alt="Perfume sobre fundo azul, representando Elite Aromas"
              width={560}
              height={450}
              priority
            />
          </div>
        </section>

        <section className="feature-panels">
          {featured.map((item) => (
            <article className="feature-card reveal-up" key={item.id}>
              <span className="feature-tag">Edição importada</span>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <strong>{currency.format(item.price)}</strong>
            </article>
          ))}
        </section>

        <section className="menu-section" id="cardapio">
          <div className="menu-header">
            <h2>Catálogo curado</h2>
            <div className="category-tabs">
              {categories.map((category) => (
                <button
                  className={category === activeCategory ? "tab-btn active" : "tab-btn"}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="menu-grid">
            {menu.map((item) => (
              <article className="menu-card reveal-up" key={item.id}>
                <Link className="card-link" href={`/produtos/${item.id}`}>
                  <div className="card-image-wrap">
                    <Image src={item.image} alt={item.name} width={400} height={240} />
                  </div>
                  <div className="card-content">
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                    </div>
                    <div className="card-footer">
                      <strong>{currency.format(item.price)}</strong>
                      <span className="muted-text">Ver detalhes</span>
                    </div>
                  </div>
                </Link>
                <div className="card-actions">
                  <button
                    className="secondary-btn"
                    disabled={!item.available}
                    onClick={() => addToCart(item)}
                    type="button"
                  >
                    {item.available ? "Adicionar ao carrinho" : "Indisponivel"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="order-section" id="pedido">
          <div className="order-panel reveal-up">
            <h2>Carrinho</h2>
            {cart.length === 0 && <p>Seu carrinho esta vazio.</p>}
            {cart.map((item) => (
              <div className="cart-row" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{currency.format(item.price)} cada</p>
                </div>
                <div className="qty-controls">
                  <button onClick={() => changeQuantity(item.id, -1)} type="button">
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => changeQuantity(item.id, 1)} type="button">
                    +
                  </button>
                </div>
              </div>
            ))}
            <div className="cart-total">
              <span>Total estimado</span>
              <strong>{currency.format(subtotal)}</strong>
            </div>
            <p className="muted-text">
              Atendimento direto no WhatsApp. Enviamos nota fiscal e combinamos frete com você.
            </p>
          </div>

          <form className="checkout-panel reveal-up" onSubmit={handleCheckout}>
            <h2>Concluir pelo WhatsApp</h2>
            <label>
              Nome
              <input
                onChange={(event) => setCustomer((prev) => ({ ...prev, name: event.target.value }))}
                required
                type="text"
                value={customer.name}
              />
            </label>
            <label>
              Telefone
              <input
                onChange={(event) => setCustomer((prev) => ({ ...prev, phone: event.target.value }))}
                required
                type="tel"
                value={customer.phone}
              />
            </label>
            <label>
              Endereco de entrega
              <input
                onChange={(event) => setCustomer((prev) => ({ ...prev, address: event.target.value }))}
                required
                type="text"
                value={customer.address}
              />
            </label>
            <label>
              Observacoes
              <textarea
                onChange={(event) => setCustomer((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
                value={customer.notes}
              />
            </label>

            <button className="primary-btn" type="submit">
              Abrir WhatsApp
            </button>

            {feedback && <p className="feedback-text">{feedback}</p>}
          </form>
        </section>
      </main>
    </div>
  );
}

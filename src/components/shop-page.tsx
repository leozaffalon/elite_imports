"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
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

const categories: Array<"Todos" | MenuCategory> = ["Todos", "Masculino", "Feminino", "Unissex", "Kits"];

const trustPills = [
  "Perfumes importados e originais",
  "Lote e autenticidade verificados",
  "Atendimento humano via WhatsApp",
  "Entrega nacional com suporte"
];

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

export default function ShopPage({ initialMenu }: ShopPageProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenu);
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("Todos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CustomerForm>({
    name: "",
    phone: "",
    address: "",
    notes: ""
  });
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetch("/api/menu", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as MenuItem[];
        if (Array.isArray(payload)) {
          setMenuItems(payload);
        }
      })
      .catch(() => {
        // Mantem o catalogo inicial caso a atualizacao em cliente falhe.
      });
  }, []);

  const featured = useMemo(() => menuItems.filter((item) => item.featured).slice(0, 3), [menuItems]);

  const menu = useMemo(() => {
    return menuItems.filter((item) => {
      if (activeCategory === "Todos") {
        return true;
      }

      return item.category === activeCategory;
    });
  }, [activeCategory, menuItems]);

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
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (cart.length === 0) {
      setFeedback("Adicione pelo menos um perfume ao carrinho.");
      return;
    }

    if (!customer.name || !customer.phone || !customer.address) {
      setFeedback("Preencha nome, telefone e endereco para continuar.");
      return;
    }

    const orderLines = cart
      .map(
        (item, index) =>
          `${index + 1}. Produto: ${item.name}\nQuantidade: ${item.quantity}\nValor unitario: ${currency.format(
            item.price
          )}`
      )
      .join("\n\n");

    const message = [
      "Ola, gostaria de adquirir os perfumes abaixo:",
      "",
      orderLines,
      "",
      `Total estimado: ${currency.format(subtotal)}`,
      "",
      "Dados para atendimento:",
      `Nome: ${customer.name}`,
      `Telefone: ${customer.phone}`,
      `Endereco: ${customer.address}`,
      `Observacoes: ${customer.notes || "Nenhuma"}`
    ].join("\n");

    window.open(`https://wa.me/5519992572980?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    setFeedback("WhatsApp aberto com a sua solicitacao preenchida.");
  }

  return (
    <div className="animated-shell">
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      <header className="topbar container">
        <div className="brand">
          <span className="brand-mark">EA</span>
          <span>Elite Aromas</span>
        </div>
        <nav className="nav-links">
          <a href="#catalogo">Catalogo</a>
          <a href="#compra">Comprar</a>
          <Link href="/admin">Admin</Link>
        </nav>
      </header>

      <main className="container page-flow">
        <section className="hero">
          <div className="hero-copy reveal-up">
            <p className="kicker">Perfumaria de importados</p>
            <h1>Fragrancias de grife com curadoria premium.</h1>
            <p>
              Inspirada na direcao artistica editorial de grandes maisons, a Elite Aromas entrega um
              catalogo com autenticidade, suporte consultivo e atendimento direto.
            </p>
            <div className="hero-actions">
              <button
                className="primary-btn"
                onClick={() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" })}
                type="button"
              >
                Explorar perfumes
              </button>
            </div>
          </div>

          <div className="hero-image reveal-up">
            <Image
              src="/images/official/hero.png"
              alt="Colecao de perfumes importados Elite Aromas"
              width={900}
              height={620}
              priority
            />
          </div>
        </section>

        <section className="trust-strip reveal-up">
          {trustPills.map((pill) => (
            <div className="trust-pill" key={pill}>
              {pill}
            </div>
          ))}
        </section>

        <section className="feature-panels">
          {featured.map((item) => (
            <article className="feature-card reveal-up" key={item.id}>
              <span className="feature-tag">Selecao em destaque</span>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <strong>{currency.format(item.price)}</strong>
            </article>
          ))}
        </section>

        <section className="menu-section" id="catalogo">
          <div className="menu-header">
            <h2>Catalogo oficial</h2>
            <p className="muted-text">Clique no produto para abrir a pagina completa com galeria e detalhes.</p>
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
                    <Image src={item.image} alt={item.name} width={580} height={420} />
                  </div>
                  <div className="card-content">
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                    </div>
                    <div className="card-footer">
                      <strong>{currency.format(item.price)}</strong>
                      <span className="muted-text">Abrir pagina do produto</span>
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

        <section className="order-section" id="compra">
          <div className="order-panel reveal-up">
            <h2>Carrinho</h2>
            {cart.length === 0 && <p>Seu carrinho esta vazio.</p>}
            {cart.map((item) => (
              <div className="cart-row" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{currency.format(item.price)} por unidade</p>
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
            <p className="muted-text">A finalizacao do pedido acontece via atendimento oficial no WhatsApp.</p>
          </div>

          <form className="checkout-panel reveal-up" onSubmit={handleCheckout}>
            <h2>Enviar solicitacao</h2>
            <label>
              Nome completo
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
              Enviar para WhatsApp
            </button>

            {feedback && <p className="feedback-text">{feedback}</p>}
          </form>
        </section>
      </main>
    </div>
  );
}

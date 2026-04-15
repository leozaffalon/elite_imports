"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MenuCategory, MenuItem } from "@/lib/types";
import { useCart } from "@/contexts/cart-context";
import Cart from "./cart";

type ShopPageProps = {
  initialMenu: MenuItem[];
  initialHomeImages: string[];
};

type TabKey = "Todos" | "Masculino" | "Feminino";

const tabs: { key: TabKey; label: string }[] = [
  { key: "Masculino", label: "Decants Masculinos" },
  { key: "Feminino", label: "Decants Femininos" },
  { key: "Todos", label: "Todos os Decants" }
];
const defaultHomeImage = "/images/official/elite-aromas-ea-logo.svg";

const benefits = [
  { title: "Envio em 24h", subtitle: "Postagem rapida" },
  { title: "Compra segura", subtitle: "Ambiente protegido" },
  { title: "Frete gratis", subtitle: "Acima de R$199,90" },
  { title: "Originais", subtitle: "100% autenticados" }
];

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function sanitizeHomeImages(input: unknown): string[] {
  const values = Array.isArray(input)
    ? input.filter((item): item is string => typeof item === "string").map((item) => item.trim())
    : [];

  const sanitized = [...new Set(values.filter((item) => item.length > 0))].slice(0, 5);
  return sanitized.length > 0 ? sanitized : [defaultHomeImage];
}

export default function ShopPage({ initialMenu, initialHomeImages }: ShopPageProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenu);
  const [homeImages, setHomeImages] = useState<string[]>(sanitizeHomeImages(initialHomeImages));
  const [homeImageIndex, setHomeImageIndex] = useState(0);
  const [catalogImageIndex, setCatalogImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey>("Masculino");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const { addToCart, getTotalItems } = useCart();

  const availableTabs = useMemo(() => {
    const hasMasculino = menuItems.some((item) => item.category === "Masculino");
    const hasFeminino = menuItems.some((item) => item.category === "Feminino");

    return tabs.filter((tab) => {
      if (tab.key === "Masculino") return hasMasculino;
      if (tab.key === "Feminino") return hasFeminino;
      return true;
    });
  }, [menuItems]);

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
        // Mantem o catalogo inicial caso o fetch no cliente falhe.
      });
  }, []);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as { homeImage?: string; homeImages?: string[] };
        const candidateImages = [
          ...(Array.isArray(payload.homeImages) ? payload.homeImages : []),
          ...(typeof payload.homeImage === "string" ? [payload.homeImage] : [])
        ];
        const nextImages = sanitizeHomeImages(candidateImages);
        setHomeImages(nextImages);
        setHomeImageIndex(0);
      })
      .catch(() => {
        // Mantem a imagem inicial caso o fetch de configuracao falhe.
      });
  }, []);

  useEffect(() => {
    if (homeImages.length <= 1) {
      setHomeImageIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setHomeImageIndex((current) => (current + 1) % homeImages.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [homeImages]);

  useEffect(() => {
    if (homeImages.length <= 1) {
      setCatalogImageIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setCatalogImageIndex((current) => (current + 1) % homeImages.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [homeImages.length]);

  function handleCatalogDragStart(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
    if ("touches" in e) {
      setDragStart(e.touches[0].clientX);
    } else {
      setDragStart(e.clientX);
    }
  }

  function handleCatalogDragEnd(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
    let dragEnd = 0;
    if ("changedTouches" in e) {
      dragEnd = e.changedTouches[0].clientX;
    } else {
      dragEnd = (e as React.MouseEvent<HTMLDivElement>).clientX;
    }

    const diff = dragStart - dragEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCatalogImageIndex((current) => (current + 1) % homeImages.length);
      } else {
        setCatalogImageIndex((current) => (current - 1 + homeImages.length) % homeImages.length);
      }
    }
  }

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = menuItems.filter((item) => {
      const tabMatch = activeTab === "Todos" || item.category === activeTab;
      const searchMatch =
        query.length === 0 ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      return tabMatch && searchMatch;
    });

    return filtered.sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [activeTab, menuItems, searchQuery]);

  const kitItems = useMemo(() => menuItems.filter((item) => item.category === "Kits").slice(0, 8), [menuItems]);

  useEffect(() => {
    const tabStillExists = availableTabs.some((tab) => tab.key === activeTab);
    if (!tabStillExists) {
      setActiveTab(availableTabs[0]?.key ?? "Todos");
    }
  }, [activeTab, availableTabs]);

  function getCompareAt(price: number) {
    return price * 1.32;
  }

  function getDiscount(price: number) {
    const compareAt = getCompareAt(price);
    return Math.max(8, Math.round((1 - price / compareAt) * 100));
  }

  function handleAddToCart(item: MenuItem) {
    addToCart(item);
    setIsCartOpen(true);
  }

  function handleQuickBuy(item: MenuItem) {
    const message = [
      "Ola! Tenho interesse neste perfume da Elite Aromas:",
      "",
      `Produto: ${item.name}`,
      `Categoria: ${item.category}`,
      `Preco: ${currency.format(item.price)}`,
      "",
      "Pode me enviar mais detalhes?"
    ].join("\n");

    window.open(`https://wa.me/5519992572980?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  function scrollToCatalog() {
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  }

  function scrollToKits() {
    document.getElementById("kits")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="ea-page">
      <div className="ea-announcement">ELITE AROMAS - DECANTS E PERFUMES IMPORTADOS ORIGINAIS</div>

      <header className="ea-header">
        <div className="container ea-header-inner">
          <div className="ea-brand-wrap">
            <button
              aria-label="Abrir menu"
              className="ea-menu-btn"
              type="button"
              onClick={() => setIsCartOpen(true)}
              title="Carrinho de Compras"
            >
              🛒
              {getTotalItems() > 0 && (
                <span className="ea-cart-count-menu">{getTotalItems()}</span>
              )}
            </button>

            <Link className="ea-brand" href="/">
              Elite Aromas
            </Link>
          </div>

          <nav className="ea-nav">
            <a href="#catalogo">Catalogo</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="ea-benefits-wrap">
          <div className="container ea-benefits" role="list">
            {benefits.map((benefit) => (
              <article className="ea-benefit-item" key={benefit.title} role="listitem">
                <div className="ea-benefit-icon" aria-hidden="true" />
                <div>
                  <strong>{benefit.title}</strong>
                  <span>{benefit.subtitle}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="container ea-slides">
          <article className="ea-slide ea-slide-primary reveal-up">
            <div className="ea-slide-container" style={{ transform: `translateX(-${homeImageIndex * 100}%)` }}>
              {homeImages.map((image, index) => (
                <Image
                  key={image}
                  alt={`Slide ${index + 1}`}
                  className="ea-slide-image ea-slide-image-logo"
                  height={720}
                  priority={index === 0}
                  src={image}
                  width={1400}
                />
              ))}
            </div>
          </article>
        </section>

        <section className="ea-catalog-section" id="catalogo">
          <header className="ea-section-header">
            <div className="container">
              <h3 className="ea-subheading">Decants Mais vendidos</h3>
              <div className="ea-tab-list" role="tablist">
                {availableTabs.map((tab) => (
                  <button
                    aria-selected={activeTab === tab.key}
                    className={activeTab === tab.key ? "ea-tab is-active" : "ea-tab"}
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    role="tab"
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="ea-search-row">
                <input
                  className="ea-search-input"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar perfume por nome ou marca"
                  type="search"
                  value={searchQuery}
                />
              </div>
            </div>
          </header>

          <section
            className="container ea-slides ea-slides-catalog"
            onMouseDown={handleCatalogDragStart}
            onMouseUp={handleCatalogDragEnd}
            onTouchStart={handleCatalogDragStart}
            onTouchEnd={handleCatalogDragEnd}
          >
            <article className="ea-slide ea-slide-catalog reveal-up">
              <div className="ea-slide-container" style={{ transform: `translateX(-${catalogImageIndex * 100}%)` }}>
                {homeImages.map((image, index) => (
                  <Image
                    key={image}
                    alt={`Anúncio ${index + 1}`}
                    className="ea-slide-image ea-slide-image-catalog"
                    height={400}
                    priority={index === 0}
                    src={image}
                    width={1200}
                  />
                ))}
              </div>
              <div className="ea-catalog-nav-dots">
                {homeImages.map((_, index) => (
                  <button
                    key={index}
                    className={`ea-nav-dot ${index === catalogImageIndex ? "active" : ""}`}
                    onClick={() => setCatalogImageIndex(index)}
                    aria-label={`Ir para anúncio ${index + 1}`}
                  />
                ))}
              </div>
            </article>
          </section>

          <div className="container">
            <div className="ea-product-track" role="list">
              {visibleItems.map((item) => {
                const compareAt = getCompareAt(item.price);
                const discount = getDiscount(item.price);

                return (
                  <article className="ea-product-card" key={item.id} role="listitem">
                    <Link className="ea-product-link" href={`/produtos/${item.id}`}>
                      <div className="ea-product-image-wrap">
                        <Image alt={item.name} className="ea-product-image" height={700} src={item.image} width={700} />
                        <span className="ea-discount-badge">-{discount}%</span>
                      </div>
                    </Link>

                    <div className="ea-product-info">
                      <h2>
                        <Link href={`/produtos/${item.id}`}>{item.name}</Link>
                      </h2>

                      <div className="ea-price-list">
                        <span className="ea-price-current">{currency.format(item.price)}</span>
                        <span className="ea-price-old">{currency.format(compareAt)}</span>
                      </div>

                      <div className="ea-card-actions">
                        <Link className="secondary-btn" href={`/produtos/${item.id}`}>
                          Ver produto
                        </Link>
                        <button className="primary-btn" onClick={() => handleAddToCart(item)} type="button">
                          Adicionar ao Carrinho
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {visibleItems.length === 0 && (
              <p className="ea-empty">Nenhum perfume encontrado para os filtros aplicados.</p>
            )}
          </div>
        </section>

        {kitItems.length > 0 && (
          <section className="ea-kits-section" id="kits">
            <div className="container">
              <header className="ea-kits-header">
                <h3>Kits e Presentes</h3>
                <p>Selecoes prontas para presentear com assinatura Elite Aromas.</p>
              </header>

              <div className="ea-kits-grid">
                {kitItems.map((item) => (
                  <article className="ea-kit-card" key={item.id}>
                    <Link href={`/produtos/${item.id}`}>
                      <Image alt={item.name} height={520} src={item.image} width={520} />
                      <div>
                        <h4>{item.name}</h4>
                        <strong>{currency.format(item.price)}</strong>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {kitItems.length === 0 && (
          <section className="ea-kits-section" id="kits">
            <div className="container">
              <header className="ea-kits-header">
                <h3>Kits e Presentes</h3>
                <p>Nenhum kit cadastrado no momento. Adicione novos itens no painel Admin.</p>
              </header>
            </div>
          </section>
        )}
      </main>

      <footer className="ea-footer">
        <div className="container ea-footer-content">
          <div className="ea-footer-section">
            <h4>Siga-nos</h4>
            <a href="https://instagram.com/elite.aromass" target="_blank" rel="noopener noreferrer" className="ea-footer-link">
              📷 @elite.aromass
            </a>
          </div>
          <div className="ea-footer-section">
            <h4>Contato</h4>
            <a href="https://wa.me/5519992572980" target="_blank" rel="noopener noreferrer" className="ea-footer-link">
              📱 WhatsApp: (19) 99257-2980
            </a>
          </div>
        </div>
        <div className="ea-footer-bottom">
          <div className="container">
            <p>&copy; 2024 Elite Aromas. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}

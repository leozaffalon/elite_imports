import Image from "next/image";
import Link from "next/link";
import { getMenuItems } from "@/lib/data-store";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

export default async function MontarKitPage() {
  const menu = await getMenuItems();
  const kits = menu.filter((item) => item.category === "Kits");

  return (
    <main className="ea-kit-page">
      <section className="container ea-kit-hero">
        <Image
          alt="Logo Elite Aromas para montar kit"
          className="ea-slide-image ea-slide-image-logo"
          height={720}
          priority
          src="/images/official/elite-aromas-ea-logo.svg"
          width={1400}
        />

        <div className="ea-kit-hero-content">
          <p className="kicker">Monte seu kit</p>
          <h1>Kits Elite Aromas</h1>
          <p>Escolha os kits disponiveis e finalize com nosso atendimento no WhatsApp.</p>
          <Link className="secondary-btn" href="/#catalogo">
            Voltar ao catalogo
          </Link>
        </div>
      </section>

      <section className="container ea-kits-section">
        <header className="ea-kits-header">
          <h3>Opcoes de kits</h3>
          <p>Selecione um kit e abra os detalhes para comprar.</p>
        </header>

        <div className="ea-kits-grid">
          {kits.map((item) => (
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
      </section>
    </main>
  );
}

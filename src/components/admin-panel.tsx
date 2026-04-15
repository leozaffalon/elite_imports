"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MenuCategory, MenuItem, SiteSettings } from "@/lib/types";

type MenuInput = {
  name: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  category: MenuCategory;
  featured: boolean;
  available: boolean;
};

const categories: MenuCategory[] = ["Masculino", "Feminino", "Unissex", "Kits"];
const adminCurrency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const controlClass = "form-control form-control-sm";
const selectClass = "form-select form-select-sm";
const defaultHomeImage = "/images/official/elite-aromas-ea-logo.svg";
const maxHomeImages = 5;

const emptyItem: MenuInput = {
  name: "",
  description: "",
  price: 0,
  image: "/images/official/hero.png",
  images: [],
  category: "Masculino",
  featured: false,
  available: true
};

function sanitizeHomeImages(input: unknown): string[] {
  const values = Array.isArray(input)
    ? input.filter((item): item is string => typeof item === "string").map((item) => item.trim())
    : [];
  const sanitized = [...new Set(values.filter((item) => item.length > 0))].slice(0, maxHomeImages);
  return sanitized.length > 0 ? sanitized : [defaultHomeImage];
}

function mergeHomeImages(primary: unknown, list: unknown): string[] {
  const fromPrimary =
    typeof primary === "string" && primary.trim().length > 0 ? [primary.trim()] : [];
  const fromList = Array.isArray(list) ? list : [];
  return sanitizeHomeImages([...fromPrimary, ...fromList]);
}

export default function AdminPanel() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [newItem, setNewItem] = useState<MenuInput>(emptyItem);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<MenuInput>(emptyItem);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [homeImages, setHomeImages] = useState<string[]>([defaultHomeImage]);
  const [homeImageInput, setHomeImageInput] = useState<string>("");
  const [homeUploadStatus, setHomeUploadStatus] = useState<string>("");
  const [homeSaving, setHomeSaving] = useState(false);

  const orderedMenu = useMemo(() => {
    return [...menu].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [menu]);

  const refreshMenu = useCallback(async () => {
    const response = await fetch("/api/admin/menu", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as MenuItem[] | { error?: string } | null;

    if (response.status === 401) {
      setLoggedIn(false);
      return;
    }

    if (!response.ok) {
      const error = payload && !Array.isArray(payload) ? payload.error : undefined;
      setMessage(error ?? "Nao foi possivel carregar o catalogo do admin.");
      return;
    }

    if (!Array.isArray(payload)) {
      setMessage("Resposta invalida ao carregar catalogo.");
      return;
    }

    setMenu(payload);
    setLoggedIn(true);
  }, []);

  const refreshSettings = useCallback(async () => {
    const response = await fetch("/api/admin/settings", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as SiteSettings | { error?: string } | null;

    if (response.status === 401) {
      setLoggedIn(false);
      return;
    }

    if (!response.ok) {
      const error = payload && !("homeImage" in payload) ? payload.error : undefined;
      setMessage(error ?? "Nao foi possivel carregar configuracoes da home.");
      return;
    }

    if (!payload || typeof payload !== "object") {
      setMessage("Configuracao da home invalida.");
      return;
    }

    const parsed = mergeHomeImages(
      "homeImage" in payload ? payload.homeImage : undefined,
      "homeImages" in payload ? payload.homeImages : undefined
    );
    setHomeImages(parsed);
    setHomeImageInput("");
  }, []);

  async function waitForCatalogSync(itemId: string) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await fetch("/api/menu", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as MenuItem[] | null;

      if (response.ok && Array.isArray(payload) && payload.some((item) => item.id === itemId)) {
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    return false;
  }

  useEffect(() => {
    Promise.all([refreshMenu(), refreshSettings()]).catch(() => setLoggedIn(false));
  }, [refreshMenu, refreshSettings]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "Nao foi possivel entrar.");
        return;
      }

      setPassword("");
      await Promise.all([refreshMenu(), refreshSettings()]);
      setMessage("Login realizado com sucesso.");
    } catch {
      setMessage("Erro de conexao ao tentar autenticar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    setLoggedIn(false);
    setMenu([]);
    setHomeImages([defaultHomeImage]);
    setHomeImageInput("");
    setHomeUploadStatus("");
    setMessage("Sessao encerrada.");
  }

  function addHomeImageByUrl(rawUrl: string) {
    const nextUrl = rawUrl.trim();
    if (!nextUrl) {
      setHomeUploadStatus("Informe uma URL valida.");
      return;
    }

    setHomeImages((prev) => {
      const previousLength = prev.length;
      const merged = sanitizeHomeImages([...prev, nextUrl]);
      const wasDuplicate = prev.includes(nextUrl);
      const wasTrimmed = merged.length === previousLength && !wasDuplicate;

      if (wasDuplicate) {
        setHomeUploadStatus("Imagem ja adicionada.");
      } else if (wasTrimmed || previousLength >= maxHomeImages) {
        setHomeUploadStatus(`Limite de ${maxHomeImages} imagens atingido.`);
      } else {
        setHomeUploadStatus("Imagem adicionada. Clique em salvar para publicar.");
      }
      return merged;
    });
    setHomeImageInput("");
  }

  function removeHomeImage(index: number) {
    setHomeImages((prev) => {
      const next = prev.filter((_, currentIndex) => currentIndex !== index);
      return next.length > 0 ? next : [defaultHomeImage];
    });
  }

  function makeCoverHomeImage(index: number) {
    setHomeImages((prev) => {
      const selected = prev[index];
      if (!selected) return prev;
      return [selected, ...prev.filter((_, currentIndex) => currentIndex !== index)];
    });
  }

  async function handleSaveHomeImages() {
    if (homeImages.length === 0) {
      setMessage("Adicione ao menos uma imagem para a home.");
      return;
    }

    setHomeSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ homeImages: homeImages.slice(0, maxHomeImages) })
      });
      const payload = (await response.json().catch(() => ({}))) as SiteSettings & { error?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "Nao foi possivel salvar imagem da home.");
        return;
      }

      const next = mergeHomeImages(payload.homeImage, payload.homeImages);
      setHomeImages(next);
      setHomeUploadStatus("");
      setMessage("Imagens da home atualizadas.");
    } catch {
      setMessage("Erro de conexao ao salvar configuracao da home.");
    } finally {
      setHomeSaving(false);
    }
  }

  async function handleHomeImageUpload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setHomeUploadStatus("Envie apenas arquivos de imagem.");
      return;
    }

    setHomeUploadStatus("Enviando imagem da home...");
    try {
      const url = await uploadSingleImage(file);
      setHomeImages((prev) => {
        const merged = sanitizeHomeImages([...prev, url]);
        if (prev.length >= maxHomeImages) {
          setHomeUploadStatus(`Imagem enviada, mas o limite de ${maxHomeImages} foi mantido.`);
        } else {
          setHomeUploadStatus("Imagem enviada. Clique em salvar para publicar.");
        }
        return merged;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao enviar imagem da home.";
      setHomeUploadStatus(message);
    }
  }

  async function uploadSingleImage(file: File) {
    const data = new FormData();
    data.append("file", file);
    const response = await fetch("/api/upload", {
      method: "POST",
      body: data
    });

    const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };

    if (!response.ok || !payload.url) {
      throw new Error(payload.error ?? `Falha no upload (HTTP ${response.status}).`);
    }

    return payload.url;
  }

  async function uploadMany(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) {
      return [];
    }

    for (const file of list) {
      if (!file.type.startsWith("image/")) {
        throw new Error("Envie apenas arquivos de imagem.");
      }
    }

    setUploadStatus(`Enviando ${list.length} imagem(ns)...`);
    const urls: string[] = [];

    for (const file of list) {
      const url = await uploadSingleImage(file);
      urls.push(url);
    }

    setUploadStatus(`${urls.length} imagem(ns) enviada(s).`);
    return urls;
  }

  function appendImages(urls: string[], setValue: (images: string[]) => void) {
    if (urls.length === 0) {
      return;
    }

    setValue(urls);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const images = newItem.images.length > 0 ? newItem.images : [newItem.image];
    if (images.length < 3) {
      setMessage("Adicione no minimo 3 imagens para cadastrar o produto.");
      return;
    }

    const payload = {
      ...newItem,
      image: images[0],
      images
    };

    const response = await fetch("/api/admin/menu", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = (await response.json()) as { id?: string; error?: string };

    if (!response.ok) {
      setMessage(data.error ?? "Nao foi possivel criar o item.");
      return;
    }

    setNewItem(emptyItem);
    setUploadStatus("");
    await refreshMenu();

    if (data.id) {
      const synced = await waitForCatalogSync(data.id);

      if (!synced) {
        setMessage("Produto salvo. O catalogo pode levar alguns segundos para atualizar.");
      }
    }

    setMessage("Item adicionado no catalogo.");
    // Leva o admin direto para o catalogo da loja apos criar o produto.
    window.location.assign(`/?at=${Date.now()}#catalogo`);
  }

  function startEditing(item: MenuItem) {
    const existingImages = item.images?.length ? item.images : [item.image];
    setEditingId(item.id);
    setEditingDraft({
      name: item.name,
      description: item.description,
      price: item.price,
      image: existingImages[0] ?? item.image,
      images: existingImages,
      category: item.category,
      featured: item.featured,
      available: item.available
    });
  }

  async function saveEdit(id: string) {
    const images = editingDraft.images.length > 0 ? editingDraft.images : [editingDraft.image];
    const response = await fetch(`/api/admin/menu/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...editingDraft,
        image: images[0],
        images
      })
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(payload.error ?? "Falha ao salvar item.");
      return;
    }

    setEditingId(null);
    setMessage("Item atualizado.");
    await refreshMenu();
  }

  async function deleteItem(id: string, name: string) {
    const confirmed = window.confirm(`Tem certeza que deseja remover "${name}"?`);
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/admin/menu/${id}`, {
      method: "DELETE"
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(payload.error ?? "Falha ao remover item.");
      return;
    }

    setMessage("Item removido.");
    await refreshMenu();
  }

  if (!loggedIn) {
    return (
      <main className="admin-shell container-fluid py-3">
        <section className="admin-login-card reveal-up shadow-sm">
          <h1>Admin | Elite Aromas</h1>
          <p>Entre com as credenciais definidas no arquivo .env.local</p>

          <form className="d-grid gap-3" onSubmit={handleLogin}>
            <label className="form-label d-grid gap-1 mb-0">
              Usuario
              <input
                className={controlClass}
                onChange={(event) => setUsername(event.target.value)}
                required
                type="text"
                value={username}
              />
            </label>

            <label className="form-label d-grid gap-1 mb-0">
              Senha
              <div className="password-field input-group">
                <input
                  className={controlClass}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  className="secondary-btn password-toggle btn btn-outline-dark btn-sm"
                  onClick={() => setShowPassword((prev) => !prev)}
                  type="button"
                >
                  {showPassword ? "Ocultar" : "Ver senha"}
                </button>
              </div>
            </label>

            <button className="primary-btn btn btn-warning text-dark fw-semibold" disabled={loading} type="submit">
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {message && <p className="feedback-text">{message}</p>}

          <Link className="back-link" href="/">
            Voltar para a loja
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell container-fluid py-3">
      <header className="admin-topbar reveal-up shadow-sm">
        <h1>Painel administrativo</h1>
        <div className="admin-actions">
          <Link className="btn btn-outline-dark" href="/">
            Ver loja
          </Link>
          <button className="btn btn-warning text-dark fw-semibold" onClick={handleLogout} type="button">
            Sair
          </button>
        </div>
      </header>

      <section className="admin-grid row g-3">
        <article className="admin-card reveal-up col-12 col-xl-5 shadow-sm">
          <h2>Imagens da home (carrossel)</h2>
          <p className="muted-text">
            Adicione ate {maxHomeImages} imagens para intercalar automaticamente no topo da home.
          </p>

          <div className="admin-home-settings">
            <div className="home-image-preview">
              <Image
                alt="Preview da imagem principal da home"
                height={160}
                src={homeImages[0] || defaultHomeImage}
                width={420}
              />
            </div>
            <span className="muted-text">
              {homeImages.length}/{maxHomeImages} imagens no carrossel
            </span>

            <label className="form-label d-grid gap-1 mb-0">
              URL de imagem
              <div className="input-group">
                <input
                  className={controlClass}
                  onChange={(event) => setHomeImageInput(event.target.value)}
                  placeholder="https://... ou /images/..."
                  type="text"
                  value={homeImageInput}
                />
                <button
                  className="btn btn-outline-dark btn-sm"
                  onClick={() => addHomeImageByUrl(homeImageInput)}
                  type="button"
                >
                  Adicionar
                </button>
              </div>
            </label>

            <label className="form-label d-grid gap-1 mb-0">
              Upload de imagem da home
              <input
                accept="image/*"
                className={controlClass}
                onChange={(event) => void handleHomeImageUpload(event.target.files?.[0])}
                type="file"
              />
            </label>

            {homeImages.length > 0 && (
              <div className="image-list">
                {homeImages.map((image, index) => (
                  <div className="image-list-item" key={`${image}-${index}`}>
                    <Image alt={`Home ${index + 1}`} height={72} src={image} width={72} />
                    <span>{index === 0 ? "Capa atual" : `Slide ${index + 1}`}</span>
                    <div className="admin-inline-grid compact">
                      <button
                        className="btn btn-outline-dark btn-sm"
                        onClick={() => makeCoverHomeImage(index)}
                        type="button"
                      >
                        {index === 0 ? "Capa" : "Definir capa"}
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeHomeImage(index)}
                        type="button"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              className="btn btn-warning text-dark fw-semibold"
              disabled={homeSaving}
              onClick={handleSaveHomeImages}
              type="button"
            >
              {homeSaving ? "Salvando..." : "Salvar imagens da home"}
            </button>
            {homeUploadStatus && <p className="feedback-text">{homeUploadStatus}</p>}
          </div>

          <hr className="admin-divider" />

          <h2>Novo anuncio</h2>
          <p className="muted-text">Adicione um novo anuncio de perfume no catalogo da Elite Aromas.</p>
          <form className="admin-form" onSubmit={handleCreate}>
            <label className="form-label d-grid gap-1 mb-0">
              Nome
              <input
                className={controlClass}
                onChange={(event) => setNewItem((prev) => ({ ...prev, name: event.target.value }))}
                required
                type="text"
                value={newItem.name}
              />
            </label>

            <label className="form-label d-grid gap-1 mb-0">
              Descricao
              <textarea
                className={controlClass}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, description: event.target.value }))
                }
                required
                rows={3}
                value={newItem.description}
              />
            </label>

            <label className="form-label d-grid gap-1 mb-0">
              Preco
              <input
                className={controlClass}
                min={0}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, price: Number(event.target.value) }))
                }
                required
                step="0.01"
                type="number"
                value={newItem.price}
              />
            </label>

            <label className="form-label d-grid gap-1 mb-0">
              Imagens do produto (arraste uma ou mais)
              <div
                className="dropzone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  void uploadMany(event.dataTransfer.files)
                    .then((urls) =>
                      appendImages(urls, (incomingImages) =>
                        setNewItem((prev) => {
                          const images = [...new Set([...prev.images, ...incomingImages])];
                          return {
                            ...prev,
                            images,
                            image: images[0] ?? prev.image
                          };
                        })
                      )
                    )
                    .catch((error: Error) => setUploadStatus(error.message));
                }}
              >
                <input
                  accept="image/*"
                  multiple
                  type="file"
                  onChange={(event) => {
                    const files = event.target.files;
                    if (!files) return;

                    void uploadMany(files)
                      .then((urls) =>
                        appendImages(urls, (incomingImages) =>
                          setNewItem((prev) => {
                            const images = [...new Set([...prev.images, ...incomingImages])];
                            return {
                              ...prev,
                              images,
                              image: images[0] ?? prev.image
                            };
                          })
                        )
                      )
                      .catch((error: Error) => setUploadStatus(error.message));
                  }}
                />
                <p>Solte aqui os arquivos ou clique para selecionar</p>
                <span className="muted">
                  A primeira imagem vira capa. Minimo obrigatorio: 3 imagens.
                </span>
              </div>
            </label>

            {newItem.images.length > 0 && (
              <div className="image-list">
                {newItem.images.map((image, index) => (
                  <div className="image-list-item" key={`${image}-${index}`}>
                    <Image alt={`Imagem ${index + 1}`} height={72} src={image} width={72} />
                    <span>{index === 0 ? "Capa" : `Imagem ${index + 1}`}</span>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() =>
                        setNewItem((prev) => {
                          const nextImages = prev.images.filter(
                            (_, imageIndex) => imageIndex !== index
                          );
                          return {
                            ...prev,
                            images: nextImages,
                            image: nextImages[0] ?? "/images/official/hero.png"
                          };
                        })
                      }
                      type="button"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="form-label d-grid gap-1 mb-0">
              Categoria
              <select
                className={selectClass}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, category: event.target.value as MenuCategory }))
                }
                value={newItem.category}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="check-row form-check">
              <input
                className="form-check-input"
                checked={newItem.featured}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, featured: event.target.checked }))
                }
                type="checkbox"
              />
              <span className="form-check-label">Mostrar na vitrine</span>
            </label>

            <label className="check-row form-check">
              <input
                className="form-check-input"
                checked={newItem.available}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, available: event.target.checked }))
                }
                type="checkbox"
              />
              <span className="form-check-label">Disponivel para venda</span>
            </label>

            <button className="primary-btn btn btn-warning text-dark fw-semibold" type="submit">
              Adicionar anuncio
            </button>
            {uploadStatus && <p className="feedback-text">{uploadStatus}</p>}
          </form>
        </article>

        <article className="admin-card reveal-up col-12 col-xl-7 shadow-sm">
          <h2>Anuncios atuais</h2>
          <p className="muted-text">Edite, atualize ou remova anuncios de perfumes em tempo real.</p>

          <div className="admin-menu-list">
            {orderedMenu.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <div className="admin-menu-item" key={item.id}>
                  {isEditing ? (
                    <>
                      <input
                        className={controlClass}
                        onChange={(event) =>
                          setEditingDraft((prev) => ({ ...prev, name: event.target.value }))
                        }
                        type="text"
                        value={editingDraft.name}
                      />
                      <textarea
                        className={controlClass}
                        onChange={(event) =>
                          setEditingDraft((prev) => ({ ...prev, description: event.target.value }))
                        }
                        rows={2}
                        value={editingDraft.description}
                      />
                      <div className="admin-inline-grid">
                        <input
                          className={controlClass}
                          min={0}
                          onChange={(event) =>
                            setEditingDraft((prev) => ({ ...prev, price: Number(event.target.value) }))
                          }
                          step="0.01"
                          type="number"
                          value={editingDraft.price}
                        />
                        <select
                          className={selectClass}
                          onChange={(event) =>
                            setEditingDraft((prev) => ({
                              ...prev,
                              category: event.target.value as MenuCategory
                            }))
                          }
                          value={editingDraft.category}
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div
                        className="dropzone"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          void uploadMany(event.dataTransfer.files)
                            .then((urls) =>
                              appendImages(urls, (incomingImages) =>
                                setEditingDraft((prev) => {
                                  const images = [...new Set([...prev.images, ...incomingImages])];
                                  return {
                                    ...prev,
                                    images,
                                    image: images[0] ?? prev.image
                                  };
                                })
                              )
                            )
                            .catch((error: Error) => setUploadStatus(error.message));
                        }}
                      >
                        <input
                          accept="image/*"
                          multiple
                          type="file"
                          onChange={(event) => {
                            const files = event.target.files;
                            if (!files) return;

                            void uploadMany(files)
                              .then((urls) =>
                                appendImages(urls, (incomingImages) =>
                                  setEditingDraft((prev) => {
                                    const images = [...new Set([...prev.images, ...incomingImages])];
                                    return {
                                      ...prev,
                                      images,
                                      image: images[0] ?? prev.image
                                    };
                                  })
                                )
                              )
                              .catch((error: Error) => setUploadStatus(error.message));
                          }}
                        />
                        <p>Adicione mais imagens</p>
                        <span className="muted">A primeira imagem da lista sera usada na vitrine.</span>
                      </div>

                      {editingDraft.images.length > 0 && (
                        <div className="image-list">
                          {editingDraft.images.map((image, index) => (
                            <div className="image-list-item" key={`${image}-${index}`}>
                              <Image alt={`Imagem ${index + 1}`} height={72} src={image} width={72} />
                              <span>{index === 0 ? "Capa" : `Imagem ${index + 1}`}</span>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() =>
                                  setEditingDraft((prev) => {
                                    const nextImages = prev.images.filter(
                                      (_, imageIndex) => imageIndex !== index
                                    );
                                    return {
                                      ...prev,
                                      images: nextImages,
                                      image: nextImages[0] ?? "/images/official/hero.png"
                                    };
                                  })
                                }
                                type="button"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="admin-inline-grid">
                        <label className="check-row form-check">
                          <input
                            className="form-check-input"
                            checked={editingDraft.featured}
                            onChange={(event) =>
                              setEditingDraft((prev) => ({ ...prev, featured: event.target.checked }))
                            }
                            type="checkbox"
                          />
                          <span className="form-check-label">Destaque</span>
                        </label>

                        <label className="check-row form-check">
                          <input
                            className="form-check-input"
                            checked={editingDraft.available}
                            onChange={(event) =>
                              setEditingDraft((prev) => ({ ...prev, available: event.target.checked }))
                            }
                            type="checkbox"
                          />
                          <span className="form-check-label">Disponivel</span>
                        </label>
                      </div>
                      <div className="admin-inline-grid">
                        <button className="btn btn-warning text-dark fw-semibold" onClick={() => saveEdit(item.id)} type="button">
                          Salvar
                        </button>
                        <button className="btn btn-outline-dark" onClick={() => setEditingId(null)} type="button">
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <strong>{item.name}</strong>
                        <p>{item.description}</p>
                      </div>
                      <div className="admin-inline-grid compact">
                        <span>{adminCurrency.format(item.price)}</span>
                        <span>{item.category}</span>
                        <span>{item.featured ? "Destaque" : "Padrao"}</span>
                        <span>{item.available ? "Disponivel" : "Indisponivel"}</span>
                      </div>
                      <div className="admin-inline-grid">
                        <button className="btn btn-outline-dark" onClick={() => startEditing(item)} type="button">
                          Editar
                        </button>
                        <button className="btn btn-warning text-dark fw-semibold" onClick={() => deleteItem(item.id, item.name)} type="button">
                          Remover
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </article>
      </section>

      {message && <p className="feedback-text">{message}</p>}
    </main>
  );
}

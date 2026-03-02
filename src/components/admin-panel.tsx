"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MenuCategory, MenuItem } from "@/lib/types";

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

  const orderedMenu = useMemo(() => {
    return [...menu].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [menu]);

  async function refreshMenu() {
    const response = await fetch("/api/admin/menu", { cache: "no-store" });

    if (response.status === 401) {
      setLoggedIn(false);
      return;
    }

    const payload = (await response.json()) as MenuItem[];
    setMenu(payload);
    setLoggedIn(true);
  }

  useEffect(() => {
    refreshMenu().catch(() => setLoggedIn(false));
  }, []);

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
      await refreshMenu();
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
    setMessage("Sessao encerrada.");
  }

  async function uploadSingleImage(file: File) {
    const data = new FormData();
    data.append("file", file);
    const response = await fetch("/api/upload", {
      method: "POST",
      body: data
    });

    const payload = (await response.json()) as { url?: string; error?: string };

    if (!response.ok || !payload.url) {
      throw new Error(payload.error ?? "Falha no upload.");
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

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(data.error ?? "Nao foi possivel criar o item.");
      return;
    }

    setNewItem(emptyItem);
    setUploadStatus("");
    setMessage("Item adicionado no catalogo.");
    await refreshMenu();
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

  async function deleteItem(id: string) {
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
      <main className="admin-shell">
        <section className="admin-login-card reveal-up">
          <h1>Admin | Elite Aromas</h1>
          <p>Entre com as credenciais definidas no arquivo .env.local</p>

          <form onSubmit={handleLogin}>
            <label>
              Usuario
              <input
                onChange={(event) => setUsername(event.target.value)}
                required
                type="text"
                value={username}
              />
            </label>

            <label>
              Senha
              <div className="password-field">
                <input
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  className="secondary-btn password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  type="button"
                >
                  {showPassword ? "Ocultar" : "Ver senha"}
                </button>
              </div>
            </label>

            <button className="primary-btn" disabled={loading} type="submit">
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
    <main className="admin-shell">
      <header className="admin-topbar reveal-up">
        <h1>Painel administrativo</h1>
        <div className="admin-actions">
          <Link href="/">Ver loja</Link>
          <button onClick={handleLogout} type="button">
            Sair
          </button>
        </div>
      </header>

      <section className="admin-grid">
        <article className="admin-card reveal-up">
          <h2>Novo perfume</h2>
          <form className="admin-form" onSubmit={handleCreate}>
            <label>
              Nome
              <input
                onChange={(event) => setNewItem((prev) => ({ ...prev, name: event.target.value }))}
                required
                type="text"
                value={newItem.name}
              />
            </label>

            <label>
              Descricao
              <textarea
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, description: event.target.value }))
                }
                required
                rows={3}
                value={newItem.description}
              />
            </label>

            <label>
              Preco
              <input
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

            <label>
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
                <span className="muted">A primeira imagem da lista vira a capa do produto.</span>
              </div>
            </label>

            {newItem.images.length > 0 && (
              <div className="image-list">
                {newItem.images.map((image, index) => (
                  <div className="image-list-item" key={`${image}-${index}`}>
                    <Image alt={`Imagem ${index + 1}`} height={72} src={image} width={72} />
                    <span>{index === 0 ? "Capa" : `Imagem ${index + 1}`}</span>
                    <button
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

            <label>
              Categoria
              <select
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

            <label className="check-row">
              <input
                checked={newItem.featured}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, featured: event.target.checked }))
                }
                type="checkbox"
              />
              Mostrar na vitrine
            </label>

            <label className="check-row">
              <input
                checked={newItem.available}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, available: event.target.checked }))
                }
                type="checkbox"
              />
              Disponivel para venda
            </label>

            <button className="primary-btn" type="submit">
              Adicionar item
            </button>
            {uploadStatus && <p className="feedback-text">{uploadStatus}</p>}
          </form>
        </article>

        <article className="admin-card reveal-up">
          <h2>Catalogo atual</h2>

          <div className="admin-menu-list">
            {orderedMenu.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <div className="admin-menu-item" key={item.id}>
                  {isEditing ? (
                    <>
                      <input
                        onChange={(event) =>
                          setEditingDraft((prev) => ({ ...prev, name: event.target.value }))
                        }
                        type="text"
                        value={editingDraft.name}
                      />
                      <textarea
                        onChange={(event) =>
                          setEditingDraft((prev) => ({ ...prev, description: event.target.value }))
                        }
                        rows={2}
                        value={editingDraft.description}
                      />
                      <div className="admin-inline-grid">
                        <input
                          min={0}
                          onChange={(event) =>
                            setEditingDraft((prev) => ({ ...prev, price: Number(event.target.value) }))
                          }
                          step="0.01"
                          type="number"
                          value={editingDraft.price}
                        />
                        <select
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
                        <label className="check-row">
                          <input
                            checked={editingDraft.featured}
                            onChange={(event) =>
                              setEditingDraft((prev) => ({ ...prev, featured: event.target.checked }))
                            }
                            type="checkbox"
                          />
                          Destaque
                        </label>

                        <label className="check-row">
                          <input
                            checked={editingDraft.available}
                            onChange={(event) =>
                              setEditingDraft((prev) => ({ ...prev, available: event.target.checked }))
                            }
                            type="checkbox"
                          />
                          Disponivel
                        </label>
                      </div>
                      <div className="admin-inline-grid">
                        <button onClick={() => saveEdit(item.id)} type="button">
                          Salvar
                        </button>
                        <button onClick={() => setEditingId(null)} type="button">
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
                        <button onClick={() => startEditing(item)} type="button">
                          Editar
                        </button>
                        <button onClick={() => deleteItem(item.id)} type="button">
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

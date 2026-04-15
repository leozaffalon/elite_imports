"use client";

import { useState } from 'react';
import { useCart, CartItem } from '@/contexts/cart-context';
import { MenuItem } from '@/lib/types';

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { items, removeFromCart, updateQuantity, clearCart, getTotalItems, getTotalPrice } = useCart();
  const [isSending, setIsSending] = useState(false);

  const handleSendOrder = async () => {
    if (items.length === 0) return;

    setIsSending(true);

    try {
      const orderMessage = [
        "Olá! Gostaria de fazer um pedido da Elite Aromas:",
        "",
        ...items.map((item, index) =>
          `${index + 1}. ${item.name}\n   Quantidade: ${item.quantity}\n   Preço unitário: ${currency.format(item.price)}\n   Subtotal: ${currency.format(item.price * item.quantity)}`
        ),
        "",
        `Total de itens: ${getTotalItems()}`,
        `Valor total: ${currency.format(getTotalPrice())}`,
        "",
        "Poderia me ajudar com este pedido?"
      ].join("\n");

      const whatsappUrl = `https://wa.me/5519992572980?text=${encodeURIComponent(orderMessage)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      // Limpar carrinho após enviar pedido
      clearCart();
      onClose();
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ea-cart-overlay" onClick={onClose}>
      <div className="ea-cart" onClick={e => e.stopPropagation()}>
        <div className="ea-cart-header">
          <h3>Carrinho de Compras</h3>
          <button className="ea-cart-close" onClick={onClose}>&times;</button>
        </div>

        <div className="ea-cart-items">
          {items.length === 0 ? (
            <div className="ea-cart-empty">
              <p>Seu carrinho está vazio</p>
              <small>Adicione perfumes para continuar</small>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="ea-cart-item">
                <div className="ea-cart-item-info">
                  <h4>{item.name}</h4>
                  <p className="ea-cart-item-price">
                    {currency.format(item.price)} cada
                  </p>
                </div>

                <div className="ea-cart-item-controls">
                  <div className="ea-quantity-controls">
                    <button
                      className="ea-quantity-btn"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="ea-quantity">{item.quantity}</span>
                    <button
                      className="ea-quantity-btn"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="ea-remove-btn"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remover
                  </button>
                </div>

                <div className="ea-cart-item-total">
                  {currency.format(item.price * item.quantity)}
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="ea-cart-footer">
            <div className="ea-cart-summary">
              <div className="ea-cart-total">
                <strong>Total: {currency.format(getTotalPrice())}</strong>
                <small>{getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'}</small>
              </div>
            </div>

            <div className="ea-cart-actions">
              <button
                className="ea-cart-clear-btn"
                onClick={clearCart}
              >
                Limpar Carrinho
              </button>
              <button
                className="ea-cart-order-btn"
                onClick={handleSendOrder}
                disabled={isSending}
              >
                {isSending ? 'Enviando...' : 'Enviar Pedido'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
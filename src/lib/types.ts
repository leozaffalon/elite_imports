export type MenuCategory = "Masculino" | "Feminino" | "Unissex" | "Colecoes";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: MenuCategory;
  featured: boolean;
  available: boolean;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type CustomerData = {
  name: string;
  phone: string;
  address: string;
  notes?: string;
};

export type Order = {
  id: string;
  createdAt: string;
  items: CartItem[];
  customer: CustomerData;
  total: number;
  status: "Recebido" | "Separando" | "Em transporte" | "Entregue";
};

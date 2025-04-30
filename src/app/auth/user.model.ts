export interface AppUser {
  email: string;
  favorites: string[];
  myrecipes: string[];
  name: string;
  password: string;
  shoppingList: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
  }[];
  userId: string;
}

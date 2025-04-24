export interface Ingredient {
  id?: string;
  name: string;
  quantity?: number;
  unit?: string;
}

export interface Recipe {
  id: string;
  title: string;
  imageUrl: string;
  publisher: string;
  ingredients: Ingredient[];
  sourceUrl: string;
  tags: string[];
  likes: number;
  createdAt: string;
}

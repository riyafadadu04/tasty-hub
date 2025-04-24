import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ingredient, Recipe } from './recipe.model';
import { map, switchAll, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private dbUrl = environment.firebaseConfig.databaseURL;

  constructor(private http: HttpClient) {}

  getRecipes(): Observable<Recipe[]> {
    return this.http
      .get<{ [key: string]: Recipe }>(`${this.dbUrl}/recipe.json`)
      .pipe(
        map((res) => {
          if (!res) return [];
          return Object.keys(res).map((key) => ({
            ...res[key],
            id: key,
          }));
        })
      );
  }

  addRecipe(recipe: Omit<Recipe, 'id'>, userId: string): Observable<any> {
    return this.http
      .post<{ name: string }>(`${this.dbUrl}/recipe.json`, recipe)
      .pipe(
        map((res) => {
          const newRecipeId = res.name;
          this.http
            .get<{ myrecipes?: string[] }>(`${this.dbUrl}/users/${userId}.json`)
            .subscribe((userData) => {
              const myrecipes = userData?.myrecipes || [];
              if (!myrecipes.includes(newRecipeId)) {
                myrecipes.push(newRecipeId);
                this.http
                  .patch(`${this.dbUrl}/users/${userId}.json`, { myrecipes })
                  .subscribe();
              }
            });
          return res;
        })
      );
  }
  updateRecipe(recipeId: string, updatedData: Recipe): Observable<any> {
    return this.http.patch(
      `${this.dbUrl}/recipe/${recipeId}.json`,
      updatedData
    );
  }

  deleteRecipe(recipeId: string, userId: string): Observable<any> {
    return this.http.delete(`${this.dbUrl}/recipe/${recipeId}.json`).pipe(
      map(() => {
        // Remove recipeId from myrecipes in user data
        this.http
          .get<any>(`${this.dbUrl}/users/${userId}.json`)
          .subscribe((userData) => {
            const myrecipes = userData?.myrecipes || [];
            const updated = myrecipes.filter((id: string) => id !== recipeId);
            this.http
              .patch(`${this.dbUrl}/users/${userId}.json`, {
                myrecipes: updated,
              })
              .subscribe();
          });
      })
    );
  }

  getRecipeById(recipeId: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.dbUrl}/recipe/${recipeId}.json`).pipe(
      map((recipe) => ({
        ...recipe,
        id: recipeId, // Manually attach the ID
      }))
    );
  }

  // ===================== Favorites ====================================
  getFavoriteRecipes(userId: string): Observable<any> {
    return this.http.get<{ favorites?: string[] }>(
      `${this.dbUrl}/users/${userId}.json`
    );
  }

  addRecipeToFavorites(userId: string, recipeId: string): Observable<any> {
    return this.http.get<any>(`${this.dbUrl}/users/${userId}.json`).pipe(
      map((userData) => {
        const favorites = userData?.favorites || [];
        if (!favorites.includes(recipeId)) {
          favorites.push(recipeId);
        }
        return this.http
          .put(`${this.dbUrl}/users/${userId}.json`, {
            ...userData,
            favorites,
          })
          .subscribe();
      })
    );
  }

  removeRecipeFromFavorites(userId: string, recipeId: string): Observable<any> {
    return this.http.get<any>(`${this.dbUrl}/users/${userId}.json`).pipe(
      map((userData) => {
        const favorites = userData?.favorites || [];
        const index = favorites.indexOf(recipeId);
        if (index !== -1) {
          favorites.splice(index, 1);
        }
        return this.http
          .put(`${this.dbUrl}/users/${userId}.json`, {
            ...userData,
            favorites,
          })
          .subscribe();
      })
    );
  }

  isRecipeInFavorites(userId: string, recipeId: string): Observable<boolean> {
    return this.http.get<any>(`${this.dbUrl}/users/${userId}.json`).pipe(
      map((userData) => {
        const favorites = userData?.favorites || [];
        return favorites.includes(recipeId);
      })
    );
  }

  // ============================ SHOPPING LIST =====================================
  addIngredientToShoppingList(
    userId: string,
    ingredient: Ingredient
  ): Observable<any> {
    const id = this.generateId();
    const ingredientWithId = { ...ingredient, id };
    return this.http
      .get<any>(`${this.dbUrl}/users/${userId}/shoppingList.json`)
      .pipe(
        switchMap((shoppingList) => {
          const updatedList = shoppingList
            ? [...shoppingList, ingredientWithId]
            : [ingredientWithId];
          return this.http.put(
            `${this.dbUrl}/users/${userId}/shoppingList.json`,
            updatedList
          );
        })
      );
  }

  updateIngredientInShoppingList(
    userId: string,
    ingredient: Ingredient
  ): Observable<any> {
    return this.http
      .get<Ingredient[]>(`${this.dbUrl}/users/${userId}/shoppingList.json`)
      .pipe(
        switchMap((list = []) => {
          const index = list.findIndex((ing) => ing.id === ingredient.id);
          if (index !== -1) list[index] = ingredient;
          return this.http.put(
            `${this.dbUrl}/users/${userId}/shoppingList.json`,
            list
          );
        })
      );
  }

  removeIngredientFromShoppingList(
    userId: string,
    ingredientId: string
  ): Observable<any> {
    return this.http
      .get<Ingredient[]>(`${this.dbUrl}/users/${userId}/shoppingList.json`)
      .pipe(
        switchMap((list = []) => {
          const updatedList = list.filter((ing) => ing.id !== ingredientId);
          return this.http.put(
            `${this.dbUrl}/users/${userId}/shoppingList.json`,
            updatedList
          );
        })
      );
  }

  getShoppingList(userId: string): Observable<Ingredient[]> {
    return this.http
      .get<Ingredient[]>(`${this.dbUrl}/users/${userId}/shoppingList.json`)
      .pipe(map((res) => res || []));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 12);
  }
}

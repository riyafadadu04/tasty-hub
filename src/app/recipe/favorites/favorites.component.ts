import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { RecipeService } from '../recipe.service';
import { Recipe } from '../recipe.model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
})
export class FavoritesComponent implements OnInit {
  dataList: Recipe[] = [];
  currentPage = 1;
  itemsPerPage = 12;
  favorites: string[] = [];
  userId: string | null = null;

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUserId();

    if (this.userId) {
      this.recipeService.getFavoriteRecipes(this.userId).subscribe((res) => {
        this.favorites = res?.favorites || [];
        if (this.favorites.length) {
          this.favorites.forEach((fav) => {
            this.recipeService.getRecipeById(fav).subscribe((recipe) => {
              if (recipe) this.dataList.push(recipe);
            });
          });
        }
      });
    }
  }

  isFavorite(recipeId: string): boolean {
    return this.favorites.includes(recipeId);
  }

  toggleLike(recipe: Recipe): void {
    if (!this.userId) return;

    const index = this.favorites.indexOf(recipe.id);
    if (index > -1) {
      this.favorites.splice(index, 1);
      recipe.likes--;
      this.dataList = this.dataList.filter((r) => r.id !== recipe.id);
    } else {
      this.favorites.push(recipe.id);
      recipe.likes++;
      this.dataList.push(recipe);
    }

    const updateFavorites$ = this.http.patch(
      `${environment.firebaseConfig.databaseURL}/users/${this.userId}.json`,
      { favorites: this.favorites }
    );

    const updateLikes$ = this.http.patch(
      `${environment.firebaseConfig.databaseURL}/recipe/${recipe.id}.json`,
      { likes: recipe.likes }
    );

    updateFavorites$.subscribe({
      next: () => console.log('User favorites updated'),
      error: (err) => console.error('Failed to update user favorites:', err),
    });

    updateLikes$.subscribe({
      next: () => console.log('Recipe likes updated'),
      error: (err) => console.error('Failed to update recipe likes:', err),
    });
  }

  get paginatedRecipes(): Recipe[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.dataList.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.dataList.length / this.itemsPerPage);
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
    }
  }

  getPageArray(): number[] {
    return Array(this.totalPages)
      .fill(0)
      .map((_, i) => i + 1);
  }

  viewRecipeDetail(recipeId: string): void {
    this.router.navigate(['/recipe', recipeId]);
  }
}

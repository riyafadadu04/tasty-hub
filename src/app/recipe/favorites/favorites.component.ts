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
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
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
  isLoading = true;
  isAddedFav = true;

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.userId = this.authService.getCurrentUserId();
    this.getFavRecipe(this.userId);
  }

  getFavRecipe(userId: string) {
    if (this.userId) {
      this.recipeService.getFavoriteRecipes(this.userId).subscribe((res) => {
        this.favorites = res.favorites;
        if (!this.favorites) {
          this.isLoading = false;
          this.isAddedFav = false;
          return;
        }
        this.favorites.forEach((fav) => {
          this.recipeService.getRecipeById(fav).subscribe((recipe) => {
            if (recipe) this.dataList.push(recipe);
          });
        });
      });
    }
    this.isLoading = false;
  }

  isFavorite(recipeId: string): boolean {
    return this.favorites.includes(recipeId);
  }

  toggleLike(recipe: Recipe, event: Event): void {
    event.stopPropagation();
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

  getPageArray(): (number | string)[] {
    const pages: (number | string)[] = [];
    const totalPages = this.totalPages;

    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (this.currentPage > 3) {
        pages.push('...');
      }

      const startPage = Math.max(2, this.currentPage - 1);
      const endPage = Math.min(totalPages - 1, this.currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (this.currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  }

  trackByPage(index: number, item: number | string): any {
    return item;
  }
  onPageClick(page: number | string): void {
    if (page !== '...') {
      this.changePage(page as number);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  viewRecipeDetail(recipeId: string): void {
    this.router.navigate(['/recipe', recipeId]);
  }

  onBackToRecipe() {
    this.router.navigate(['/recipe']);
  }
}

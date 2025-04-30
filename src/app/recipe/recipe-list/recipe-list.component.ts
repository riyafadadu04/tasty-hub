import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RecipeService } from '../recipe.service';
import { Recipe } from '../recipe.model';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  MatFormField,
  MatFormFieldModule,
  MatLabel,
} from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    MatIconModule,
    FormsModule,
    MatFormField,
    MatFormFieldModule,
    MatInputModule,
    MatLabel,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
})
export class RecipeListComponent implements OnInit {
  dataList: Recipe[] = [];
  filteredData: Recipe[] = [];
  currentPage = 1;
  itemsPerPage = 12;
  favorites: string[] = [];
  userId: string = '';
  isLoading = true;

  searchQuery: string = '';
  sortOption: string = '';

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.userId = this.authService.getCurrentUserId();

    this.recipeService.getRecipes().subscribe((data) => {
      this.dataList = data;
      this.applyFilters();
      this.isLoading = false;
    });

    if (this.userId) {
      this.recipeService.getFavoriteRecipes(this.userId).subscribe((res) => {
        this.favorites = res?.favorites || [];
      });
    }
  }

  viewRecipeDetail(recipeId: string): void {
    this.router.navigate(['/recipe', recipeId]);
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
    } else {
      this.favorites.push(recipe.id);
      recipe.likes++;
    }

    const updateFavorites$ = this.http.patch(
      `${environment.firebaseConfig.databaseURL}/users/${this.userId}.json`,
      { favorites: this.favorites }
    );

    const updateLikes$ = this.http.patch(
      `${environment.firebaseConfig.databaseURL}/recipe/${recipe.id}.json`,
      { likes: recipe.likes }
    );

    updateFavorites$.subscribe();
    updateLikes$.subscribe();
  }

  applyFilters(): void {
    this.isLoading = true;
    let filtered = this.dataList.filter((recipe) => {
      const query = this.searchQuery.toLowerCase();
      return (
        recipe.title.toLowerCase().includes(query) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });

    switch (this.sortOption) {
      case 'likes':
        filtered = filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'newest':
        filtered = filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'oldest':
        filtered = filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
    }

    this.isLoading = false;
    this.filteredData = filtered;
    this.currentPage = 1;
  }

  get paginatedRecipes(): Recipe[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredData.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  changePage(newPage: number): void {
    this.isLoading = true;
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
      this.isLoading = false;
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
}

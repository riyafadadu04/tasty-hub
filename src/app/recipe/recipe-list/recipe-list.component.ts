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

    // this.recipeService.getRecipes().subscribe((existingRecipes) => {
    //   const existingTitles = new Set(
    //     existingRecipes.map((r) => r.title.trim().toLowerCase())
    //   );

    //   const incomingRecipes = this.getIncomingRecipes();

    //   incomingRecipes.forEach((recipe, index) => {
    //     if (!existingTitles.has(recipe.title.trim().toLowerCase())) {
    //       setTimeout(() => {
    //         const now = new Date();
    //         const createdAt = `${now.toISOString().slice(0, 10)} ${now
    //           .toTimeString()
    //           .slice(0, 5)}`; // "YYYY-MM-DD HH:mm"

    //         const recipeWithId: Recipe = {
    //           ...recipe,
    //           id: uuidv4(),
    //           createdAt: createdAt,
    //         };

    //         this.recipeService.addRecipe(recipeWithId).subscribe(() => {
    //           console.log(`Added: ${recipeWithId.title} at ${createdAt}`);
    //         });
    //       }, index * 30000); // Delay each by 2 seconds (2000ms)
    //     } else {
    //       console.log(`Duplicate skipped: ${recipe.title}`);
    //     }
    //   });
    // });
  }

  getIncomingRecipes(): Omit<Recipe, 'id'>[] {
    const now = new Date();
    const formattedDateTime = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return [];
  }

  viewRecipeDetail(recipeId: string): void {
    this.router.navigate(['/recipe', recipeId]);
  }

  isFavorite(recipeId: string): boolean {
    return this.favorites.includes(recipeId);
  }

  toggleLike(recipe: Recipe, event: MouseEvent): void {
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

  getPageArray(): number[] {
    return Array(this.totalPages)
      .fill(0)
      .map((_, i) => i + 1);
  }
}

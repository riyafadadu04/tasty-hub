import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RecipeService } from '../recipe.service';
import { Recipe } from '../recipe.model';
import { NavigationEnd, Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { filter } from 'rxjs';

interface AppUser {
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

@Component({
  selector: 'app-my-recipe',
  imports: [
    NgIf,
    NgFor,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  standalone: true,
  templateUrl: './my-recipe.component.html',
  styleUrl: './my-recipe.component.scss',
})
export class MyRecipeComponent implements OnInit {
  myRecipes: any[] = [];
  recipeData: Recipe[] = [];
  userId: string = '';
  userData: any;
  isLoading = true;

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (this.router.url === '/myRecipe') {
          this.loadMyRecipes();
        }
      });
  }

  ngOnInit(): void {
    this.loadMyRecipes();
    this.userId = this.authService.getCurrentUserId();
  }

  loadMyRecipes() {
    this.isLoading = true;
    this.recipeData = [];
    this.authService.getUserById(this.userId).subscribe((user) => {
      const userValues = Object.values(user)[0] as AppUser;
      this.userData = userValues;
      this.myRecipes = userValues.myrecipes;
      this.myRecipes.forEach((recipe) => {
        this.recipeService.getRecipeById(recipe).subscribe((data) => {
          const isDuplicate = this.recipeData.some(
            (recipe) => recipe.id === data.id
          );

          if (!isDuplicate) {
            this.recipeData.push(data);
          }

          if (this.recipeData.length === this.myRecipes.length) {
            this.isLoading = false;
          }
        });
      });
    });
  }

  editRecipe(recipe: Recipe) {
    this.router.navigate([`/edit/${recipe.id}`]);
  }

  deleteRecipe(recipeId: string) {
    this.isLoading = true;
    if (confirm('Are you sure you want to delete this recipe?')) {
      this.recipeService.deleteRecipe(recipeId, this.userId).subscribe(() => {
        this.recipeData = this.recipeData.filter(
          (recipe) => recipe.id !== recipeId
        );
        this.isLoading = false;
        this.router.navigate(['/myRecipe']);
      });
    }
  }

  onAddRecipe() {
    this.router.navigate(['/add']);
  }

  viewRecipeDetail(recipeId: string): void {
    this.router.navigate(['/recipe', recipeId]);
  }
}

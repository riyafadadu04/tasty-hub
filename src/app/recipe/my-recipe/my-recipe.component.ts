import { Component, OnInit } from '@angular/core';
import { RecipeService } from '../recipe.service';
import { Recipe } from '../recipe.model';
import { NavigationEnd, Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { filter } from 'rxjs';

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
  isAddedRecipe = true;

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUserId();
    this.getMyRecipes(this.userId);
  }

  getMyRecipes(userId: string) {
    this.recipeService.getMyRecipes(this.userId).subscribe((user) => {
      this.myRecipes = user.myrecipes;
      if (!this.myRecipes) {
        this.isLoading = false;
        this.isAddedRecipe = false;
        return;
      }
      this.myRecipes.forEach((recipe) => {
        this.recipeService.getRecipeById(recipe).subscribe((data) => {
          const isDuplicate = this.recipeData.some(
            (recipe) => recipe.id === data.id
          );
          if (!isDuplicate) {
            this.recipeData.push(data);
          }
        });
      });
      this.isLoading = false;
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

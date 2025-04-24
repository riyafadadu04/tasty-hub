import { Component, OnInit } from '@angular/core';
import { Recipe } from '../recipe.model';
import { CommonModule, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../recipe.service';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-recipe-detail',
  imports: [
    CommonModule,
    MatButtonModule,
    NgIf,
    MatIconModule,
    MatProgressSpinner,
  ],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss',
})
export class RecipeDetailComponent implements OnInit {
  recipe: Recipe | null = null;
  servings: number = 4;
  baseServings: number = 4;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    const recipeId = this.route.snapshot.paramMap.get('id');
    if (recipeId) {
      this.recipeService.getRecipeById(recipeId).subscribe((data) => {
        this.recipe = data;
        this.isLoading = false;
      });
    }
  }

  adjustServings(change: number): void {
    const newValue = this.servings + change;
    if (newValue >= 1) {
      this.servings = newValue;
    }
  }

  adjustedQuantity(quantity: number): string {
    const factor = this.servings / this.baseServings;
    const adjusted = quantity * factor;
    return Number.isInteger(adjusted)
      ? adjusted.toString()
      : adjusted.toFixed(2);
  }

  onDirection(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  onBack() {
    window.history.back();
  }
}

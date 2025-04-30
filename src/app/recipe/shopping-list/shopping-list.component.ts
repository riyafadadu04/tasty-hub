import { Component, OnInit } from '@angular/core';
import { Ingredient } from '../recipe.model';
import { RecipeService } from '../recipe.service';
import { AuthService } from '../../auth/auth.service';
import { NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-shopping-list',
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIcon,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  standalone: true,
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.scss',
})
export class ShoppingListComponent implements OnInit {
  userId: string = '';
  ingredients: Ingredient[] = [];
  showForm: boolean = false;
  displayedColumns: string[] = ['name', 'quantity', 'unit', 'actions'];
  isLoading = true;
  isAddedIng = true;

  ingredientForm: Ingredient = {
    name: '',
    quantity: 0,
    unit: '',
  };

  editId: string | null = null;
  editForm: Ingredient = {
    name: '',
    quantity: 0,
    unit: '',
  };

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.userId = this.authService.getCurrentUserId();
    this.getAllShoppingList(this.userId);
  }

  getAllShoppingList(userId: string) {
    this.recipeService.getShoppingList(this.userId).subscribe((data) => {
      if (data.length === 0) {
        this.isAddedIng = false;
        this.isLoading = false;
        return;
      }
      this.ingredients = data;
      this.isAddedIng = true;
      this.isLoading = false;
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
    this.ingredientForm = {
      name: '',
      quantity: 0,
      unit: '',
    };
  }

  onAddIngredient() {
    this.isLoading = true;
    this.isAddedIng = true;

    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      ...this.ingredientForm,
    };

    this.recipeService
      .addIngredientToShoppingList(this.userId, newIngredient)
      .subscribe(() => {
        this.getAllShoppingList(this.userId);
        this.isLoading = false;
      });

    this.toggleForm();
  }

  onEdit(ingredient: Ingredient) {
    this.editId = ingredient.id ?? '';
    this.editForm = { ...ingredient };
  }

  cancelEdit() {
    this.editId = null;
  }

  saveEdit(id: string) {
    this.isLoading = true;
    this.isAddedIng = true;

    const index = this.ingredients.findIndex((ing) => ing.id === id);
    if (index !== -1) {
      this.ingredients[index] = {
        id,
        ...this.editForm,
      };

      this.recipeService
        .updateIngredientInShoppingList(this.userId, this.ingredients[index])
        .subscribe(() => {
          this.getAllShoppingList(this.userId);
          this.isLoading = false;
        });
    }

    this.cancelEdit();
  }

  removeIngredient(id?: string) {
    if (!id) return;

    this.isLoading = true;
    this.isAddedIng = true;
    this.ingredients = this.ingredients.filter((ing) => ing.id !== id);

    this.recipeService
      .removeIngredientFromShoppingList(this.userId, id)
      .subscribe(() => {
        this.isAddedIng = false;
        this.getAllShoppingList(this.userId);
        this.isLoading = false;
      });
  }
}

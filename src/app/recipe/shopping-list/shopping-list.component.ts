import { Component, OnInit } from '@angular/core';
import { Ingredient } from '../recipe.model';
import { RecipeService } from '../recipe.service';
import { AuthService } from '../../auth/auth.service';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ChangeDetectorRef } from '@angular/core';

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
    private authService: AuthService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.userId = this.authService.getCurrentUserId();
    this.recipeService.getShoppingList(this.userId).subscribe((data) => {
      this.ingredients = data;
      this.cdr.detectChanges(); // Ensure the view is updated after receiving the data
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
    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      ...this.ingredientForm,
    };

    // Add the new ingredient to the list and update the UI
    this.ingredients.push(newIngredient);

    // Call the service to add the ingredient to the shopping list
    this.recipeService
      .addIngredientToShoppingList(this.userId, newIngredient)
      .subscribe(() => {
        this.cdr.detectChanges(); // Manually trigger change detection after adding
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
    const index = this.ingredients.findIndex((ing) => ing.id === id);
    if (index !== -1) {
      // Update the ingredient in the array
      this.ingredients[index] = {
        id,
        ...this.editForm,
      };

      // Update the ingredient on the backend
      this.recipeService
        .updateIngredientInShoppingList(this.userId, this.ingredients[index])
        .subscribe(() => {
          this.cdr.detectChanges(); // Ensure the changes are reflected immediately
        });
    }

    this.cancelEdit();
  }

  removeIngredient(id?: string) {
    if (!id) return;

    // Remove the ingredient from the local list
    this.ingredients = this.ingredients.filter((ing) => ing.id !== id);

    // Call the service to remove the ingredient from the shopping list
    this.recipeService
      .removeIngredientFromShoppingList(this.userId, id)
      .subscribe(() => {
        this.cdr.detectChanges(); // Ensure the UI is updated after removal
      });
  }
}

import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Recipe } from '../recipe.model';
import { RecipeService } from '../recipe.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CommonModule, NgFor } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-edit-recipe-dialog',
  imports: [
    CommonModule,
    NgFor,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './edit-recipe-dialog.component.html',
  styleUrl: './edit-recipe-dialog.component.scss',
})
export class EditRecipeDialogComponent implements OnInit {
  recipeForm!: FormGroup;
  imagePreview: string | null = null;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  editIndex: number | null = null;
  editTagValue: string = '';
  userId: string = '';
  userData: any;
  recipeId: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private recipeService: RecipeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const recipeId = this.route.snapshot.paramMap.get('id');
    if (recipeId) {
      this.recipeService.getRecipeById(recipeId).subscribe((recipe) => {
        this.initForm(recipe);
        const imageType = (recipe as any).imageType || 'url';
        const image = (recipe as any).image || recipe.imageUrl;

        if (imageType === 'file') {
          this.imagePreview = image;
        }
      });
    }
  }

  initForm(recipe: Recipe): void {
    this.recipeForm = this.fb.group({
      title: [recipe.title, Validators.required],
      sourceUrl: [recipe.sourceUrl, Validators.required],
      tags: this.fb.array(
        recipe.tags.map((tag) => this.fb.control(tag, Validators.required))
      ),
      imageType: [(recipe as any).imageType || 'url'],
      image: [(recipe as any).image || recipe.imageUrl, Validators.required],
      ingredients: this.fb.array(
        recipe.ingredients.map((ing) =>
          this.fb.group({
            name: [ing.name, Validators.required],
            quantity: [ing.quantity, Validators.required],
            unit: [ing.unit, Validators.required],
          })
        )
      ),
    });

    // Save recipeId to use during update
    (this.recipeForm as any).recipeId = recipe.id;
  }

  get ingredients(): FormArray {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  get tags(): FormArray {
    return this.recipeForm.get('tags') as FormArray;
  }

  addTag(event: MatChipInputEvent): void {
    const input = event.value?.trim();
    if (input) {
      this.tags.push(this.fb.control(input));
    }
    // Clear input
    event.chipInput?.clear();
  }

  removeTag(index: number): void {
    if (index >= 0) {
      this.tags.removeAt(index);
    }
  }

  newIngredient(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      quantity: [0],
      unit: [''],
    });
  }

  addIngredient(): void {
    this.ingredients.push(
      this.fb.group({
        name: ['', Validators.required],
        quantity: ['', Validators.required],
        unit: ['', Validators.required],
      })
    );
  }

  removeIngredient(index: number): void {
    this.ingredients.removeAt(index);
  }

  onImageFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.recipeForm.patchValue({ image: this.imagePreview });
    };
    reader.readAsDataURL(file);
  }

  uploadImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.readAndSetImage(file);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.readAndSetImage(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault(); // Important: prevent browser default
  }

  readAndSetImage(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.imagePreview = base64;
      this.recipeForm.patchValue({ image: base64 });
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imagePreview = null;
    this.recipeForm.patchValue({ image: '' });
  }

  submitRecipe(): void {
    const updatedRecipe = this.recipeForm.value;
    const recipeId =
      (this.recipeForm as any).recipeId ||
      this.route.snapshot.paramMap.get('id');

    console.log(recipeId);

    this.recipeService.updateRecipe(recipeId, updatedRecipe).subscribe(() => {
      this.router.navigate(['/myRecipe']);
    });
  }

  onBackToMyRecipe(): void {
    this.router.navigate(['/myRecipe']);
  }

  onBackToRecipe(): void {
    this.router.navigate(['/recipe']);
  }
}

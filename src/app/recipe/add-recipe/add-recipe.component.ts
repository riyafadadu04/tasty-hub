import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { CommonModule, NgFor } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { RecipeService } from '../recipe.service';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-recipe',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatIcon,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './add-recipe.component.html',
  styleUrls: ['./add-recipe.component.scss'],
})
export class AddRecipeComponent implements OnInit {
  recipeForm: FormGroup;
  imagePreview: string | null = null;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  editIndex: number | null = null;
  editTagValue: string = '';
  userId: string = '';
  userData: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private recipeService: RecipeService
  ) {
    this.recipeForm = this.fb.group({
      title: ['', Validators.required],
      sourceUrl: ['', Validators.required],
      imageType: ['url'],
      image: ['', Validators.required],
      tags: this.fb.array([]),
      ingredients: this.fb.array([this.newIngredient()]),
    });
  }

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUserId();
    this.authService.getUserById(this.userId).subscribe((user) => {
      this.userData = user;
    });
  }

  get ingredients(): FormArray {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  get imageType(): string {
    return this.recipeForm.get('imageType')?.value;
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
    this.ingredients.push(this.newIngredient());
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
    if (this.recipeForm.invalid) {
      this.recipeForm.markAllAsTouched(); // highlight invalid fields
      return; // stop here if form is invalid
    }

    const value = this.recipeForm.value;
    const now = new Date();
    const createdAt = `${now.toISOString().slice(0, 10)} ${now
      .toTimeString()
      .slice(0, 5)}`;

    const recipe = {
      title: value.title,
      publisher: this.userData.name,
      sourceUrl: value.sourceUrl,
      imageUrl: value.image,
      tags: value.tags,
      ingredients: value.ingredients,
      likes: 0,
      createdAt: createdAt,
    };

    this.recipeService.addRecipe(recipe, this.userId).subscribe(() => {
      this.resetForm();
      this.recipeForm.setErrors(null);
      alert('Recipe added!');
      this.router.navigate(['/myRecipe']);
    });
  }

  resetForm(): void {
    this.recipeForm.reset({
      imageType: 'url',
    });

    this.ingredients.clear();
    this.ingredients.push(this.newIngredient());
    this.tags.clear();
    this.imagePreview = null;

    setTimeout(() => {
      this.recipeForm.markAsPristine();
      this.recipeForm.markAsUntouched();
      this.recipeForm.updateValueAndValidity();
    });

    this.ingredients.controls.forEach((control) => {
      control.markAsPristine();
      control.markAsUntouched();
    });
  }

  onBackToRecipe() {
    this.router.navigate(['/recipe']);
  }

  onBack() {
    this.router.navigate(['/myRecipe']);
  }
}

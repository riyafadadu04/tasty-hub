import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
  },
  {
    path: 'signup',
    component: SignupComponent,
  },
  {
    path: 'recipe',
    loadComponent: () =>
      import('./recipe/recipe.component').then((m) => m.RecipeComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'recipe/:id',
    loadComponent: () =>
      import('./recipe/recipe-detail/recipe-detail.component').then(
        (m) => m.RecipeDetailComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./recipe/add-recipe/add-recipe.component').then(
        (m) => m.AddRecipeComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./recipe/edit-recipe-dialog/edit-recipe-dialog.component').then(
        (m) => m.EditRecipeDialogComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'favorites',
    loadComponent: () =>
      import('./recipe/favorites/favorites.component').then(
        (m) => m.FavoritesComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'myRecipe',
    loadComponent: () =>
      import('./recipe/my-recipe/my-recipe.component').then(
        (m) => m.MyRecipeComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'shopping-list',
    loadComponent: () =>
      import('./recipe/shopping-list/shopping-list.component').then(
        (m) => m.ShoppingListComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

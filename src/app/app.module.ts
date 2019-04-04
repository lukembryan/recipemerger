import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { RecipeMasonryComponent } from './recipe-masonry/recipe-masonry.component';
import { MenuComponent } from './menu/menu.component';
import { SearchComponent } from './search/search.component';
import { HomeComponent } from './home/home.component';
import { BrowseComponent } from './browse/browse.component';
import { CookComponent } from './cook/cook.component';
import { HowItWorksComponent } from './how-it-works/how-it-works.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { LandingPanelComponent } from './landing-panel/landing-panel.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    RecipeMasonryComponent,
    MenuComponent,
    SearchComponent,
    HomeComponent,
    BrowseComponent,
    CookComponent,
    HowItWorksComponent,
    NotFoundComponent,
    LandingPanelComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot([
      {
        path: '',
        component: HomeComponent
      },
      {
        path: 'browse/:recipeId',
        component: BrowseComponent
      },
      {
        path: 'browse',
        component: BrowseComponent
      },
      {
        path: 'cook',
        component: CookComponent
      },
      {
        path: 'how-it-works',
        component: HowItWorksComponent
      },
      {
        path: '**',
        component: NotFoundComponent
      }
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

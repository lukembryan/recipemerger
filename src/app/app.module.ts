import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TemplateHeaderComponent } from './template-header/template-header.component';
import { RecipeMasonryComponent } from './recipe-masonry/recipe-masonry.component';

@NgModule({
  declarations: [
    AppComponent,
    TemplateHeaderComponent,
    RecipeMasonryComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

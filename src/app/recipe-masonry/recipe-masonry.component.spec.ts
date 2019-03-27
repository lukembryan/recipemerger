import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipeMasonryComponent } from './recipe-masonry.component';

describe('RecipeMasonryComponent', () => {
  let component: RecipeMasonryComponent;
  let fixture: ComponentFixture<RecipeMasonryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecipeMasonryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipeMasonryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

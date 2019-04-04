import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private route = new BehaviorSubject('/');
  private showMenu = new BehaviorSubject(false);
  currentRoute = this.route.asObservable();
  currentShowMenu = this.showMenu.asObservable();

  constructor() { }

  setRoute(url: string) {
    this.route.next(url);
  }

  toggleMenu(show: boolean) {
    this.showMenu.next(show);
  }
}

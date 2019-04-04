import { trigger, transition, style, animate } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { ConfigService } from '../../app/config.service';

@Component({
  selector: 'menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.less'],
  animations: [
    trigger('fade', [
      transition('void => *', [
        style({
          opacity: 0
        }),
        animate(300)
      ]),
      transition('* => void', [
        animate(300, style({
          opacity: 0
        }))
      ])
    ]),
    trigger('slide', [
      transition('void => *', [
        style({
          right: '-100%',
          opacity: 0
        }),
        animate(300)
      ]),
      transition('* => void', [
        animate(300, style({
          right: '-100%',
          opacity: 0
        }))
      ])
    ])
  ]
})
export class MenuComponent implements OnInit {
  showMenu:boolean;

  options = [
    {
      label: 'browse recipes',
      route: '/browse'
    },
    {
      label: 'cook',
      route: '/cook'
    },
    {
      label: 'how it works',
      route: '/how-it-works'
    }
  ];

  constructor(private config: ConfigService) { }

  ngOnInit() {
    this.config.currentShowMenu.subscribe(show => this.showMenu = show);
  }

  toggle(show){
    this.config.toggleMenu(show);
  }
}

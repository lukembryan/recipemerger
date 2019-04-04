import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'div.landing-panel',
  templateUrl: './landing-panel.component.html',
  styleUrls: ['./landing-panel.component.less']
})
export class LandingPanelComponent implements OnInit {
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

  constructor() { }

  ngOnInit() {
  }
}

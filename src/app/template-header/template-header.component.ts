import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'template-header',
  templateUrl: './template-header.component.html',
  styleUrls: ['./template-header.component.less']
})
export class TemplateHeaderComponent implements OnInit {
  title = 'sous';
  
  constructor() { }

  ngOnInit() {
  }
}

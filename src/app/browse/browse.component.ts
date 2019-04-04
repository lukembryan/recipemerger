import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: '.browse',
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.less']
})
export class BrowseComponent implements OnInit {

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      console.log(params.get('recipeId'));
    })
  }

}

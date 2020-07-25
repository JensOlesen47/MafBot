import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'maf-player-chip',
  templateUrl: './player-chip.component.html',
  styleUrls: ['./player-chip.component.scss'],
})
export class PlayerChipComponent implements OnInit {
  @Input() team: string;
  @Input() name: string;
  @Input() size: 1 | 2 | 3 | 4 = 1;

  constructor() {}

  ngOnInit(): void {
    if (this.name.length > 12) {
      this.name = this.name.substring(0, 12);
    }
  }
}

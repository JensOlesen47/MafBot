import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface EndgameDialogData {
  winningTeam: string;
}

@Component({
  selector: 'maf-endgame',
  templateUrl: './endgame.component.html',
  styleUrls: ['./endgame.component.scss'],
})
export class EndgameComponent {
  constructor(
    public dialogRef: MatDialogRef<EndgameComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EndgameDialogData
  ) {}
}

import { Component, EventEmitter, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface FormalDialogData {
  formalledPlayer: string;
  timeRemaining: number;
  isVoting: boolean;
  isVoting$: EventEmitter<boolean>;
}

@Component({
  selector: 'maf-game-state-formal',
  templateUrl: './game-state-formal.component.html',
  styleUrls: ['./game-state-formal.component.scss'],
})
export class GameStateFormalComponent {
  constructor(
    public dialogRef: MatDialogRef<GameStateFormalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FormalDialogData
  ) {}
}

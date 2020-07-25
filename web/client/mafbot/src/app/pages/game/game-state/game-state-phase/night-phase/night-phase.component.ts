import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface NightPhaseDialogData {
  timeRemaining: number;
}

@Component({
  selector: 'maf-night-phase',
  templateUrl: './night-phase.component.html',
  styleUrls: ['./night-phase.component.scss'],
})
export class NightPhaseComponent {
  constructor(
    public dialogRef: MatDialogRef<NightPhaseComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NightPhaseDialogData
  ) {}
}

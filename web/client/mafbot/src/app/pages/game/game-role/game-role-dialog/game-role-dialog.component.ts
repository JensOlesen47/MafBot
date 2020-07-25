import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Role } from '../../../../services/websocket.service';

@Component({
  selector: 'maf-game-role-dialog',
  templateUrl: '../game-role.component.html',
  styleUrls: ['../game-role.component.scss'],
})
export class GameRoleDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<GameRoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public role: Role
  ) {}
}

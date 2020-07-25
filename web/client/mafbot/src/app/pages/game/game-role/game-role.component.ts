import { Component, OnDestroy, OnInit } from '@angular/core';
import { Role, WebsocketService } from '../../../services/websocket.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { GameRoleDialogComponent } from './game-role-dialog/game-role-dialog.component';

@Component({
  selector: 'maf-game-role',
  templateUrl: './game-role.component.html',
  styleUrls: ['./game-role.component.scss'],
})
export class GameRoleComponent implements OnInit, OnDestroy {
  role: Role;
  private rolesStreamSubscription: Subscription;

  constructor(
    private websocketService: WebsocketService,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.rolesStreamSubscription = this.websocketService.rolesStream.subscribe(
      (data) => {
        this.role = data;
        this.matDialog.open(GameRoleDialogComponent, { data: this.role });
      }
    );
  }

  ngOnDestroy() {
    this.rolesStreamSubscription.unsubscribe();
  }
}

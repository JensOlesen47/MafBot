import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { skip } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private basePath = '../../assets/material_product_sounds';

  public notification = new Audio(
    `${this.basePath}/hero/hero_simple-celebration-03.ogg`
  );
  public phaseshift = new Audio(
    `${this.basePath}/alert/notification_ambient.ogg`
  );
  public role = new Audio(
    `${this.basePath}/primary/navigation_forward-selection.ogg`
  );
  public formal = new Audio(
    `${this.basePath}/alert/notification_decorative-02.ogg`
  );
  public endgame = new Audio(
    `${this.basePath}/hero/hero_decorative-celebration-01.ogg`
  );

  constructor(private websocketService: WebsocketService) {
    this.websocketService.rolesStream.subscribe(() => this.role.play());
    this.websocketService.formalsStream.subscribe(() => this.formal.play());
    this.websocketService.phasesStream
      .pipe(skip(1))
      .subscribe(() => this.phaseshift.play());
    this.websocketService.revealsStream.subscribe(() =>
      this.notification.play()
    );
    this.websocketService.statesStream.pipe(skip(1)).subscribe((state) => {
      if (state === '') {
        this.endgame.play();
      }
    });
  }
}

import { Component } from '@angular/core';
import { AudioService } from './services/audio.service';

@Component({
  selector: 'maf-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'mafbot';

  constructor(private audioService: AudioService) {}
}

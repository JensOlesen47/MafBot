import { Component, Input, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'maf-countdown-timer',
  templateUrl: './countdown-timer.component.html',
  styleUrls: ['./countdown-timer.component.scss'],
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  @Input() totalDuration: number;
  @Input() durationRemaining: number;

  timeRemaining: number;
  percentRemaining: number;
  spinnerColor = 'primary';
  private interval: number;

  constructor() {}

  ngOnInit(): void {
    this.timeRemaining = this.durationRemaining;
    this.percentRemaining = (this.durationRemaining / this.totalDuration) * 100;
    const step = 100 / this.totalDuration;

    this.interval = window.setInterval(() => {
      if (this.timeRemaining === 0) {
        window.clearInterval(this.interval);
        return;
      }
      this.percentRemaining =
        Math.floor((this.percentRemaining - step) * 1000) / 1000;
      if (this.percentRemaining <= 17) {
        this.spinnerColor = 'warn';
      }
      if (--this.timeRemaining === 0 && this.interval) {
        window.clearInterval(this.interval);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.interval) {
      window.clearInterval(this.interval);
    }
  }
}

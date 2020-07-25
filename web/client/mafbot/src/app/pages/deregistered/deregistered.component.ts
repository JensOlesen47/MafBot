import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'maf-deregistered',
  templateUrl: './deregistered.component.html',
  styleUrls: ['./deregistered.component.scss'],
})
export class DeregisteredComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.authenticationService.deleteAuthentication();

    window.setTimeout(() => this.router.navigateByUrl('/home'), 3000);
  }
}

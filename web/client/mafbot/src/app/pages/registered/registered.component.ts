import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'maf-registered',
  templateUrl: './registered.component.html',
  styleUrls: ['./registered.component.scss'],
})
export class RegisteredComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('id');
    const username = this.route.snapshot.queryParamMap.get('username');
    const hash = this.route.snapshot.queryParamMap.get('hash');
    const avatar = this.route.snapshot.queryParamMap.get('avatar');

    this.authenticationService.setAuthentication({
      id,
      username,
      hash,
      avatar,
    });
    window.setTimeout(() => this.router.navigateByUrl('/home'), 3000);
  }
}

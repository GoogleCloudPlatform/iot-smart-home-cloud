/**
 * Copyright 2019, Google LLC
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-root',
  template: `
    <mat-toolbar>
      <span>{{ title }}</span>
      <span class="spacer"></span>
      <button *ngIf="authService.authState | async as user" (click)="logout()" mat-icon-button>
        <mat-icon aria-label="Log out">exit_to_app</mat-icon>
      </button>
    </mat-toolbar>
    <div>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: []
})
export class AppComponent {
  title = 'Device Manager';

  constructor(public authService: AngularFireAuth,
    private router: Router) { }

  logout() {
    this.authService.auth.signOut().then(() => {
      this.router.navigate(['login']);
    });
  }
}

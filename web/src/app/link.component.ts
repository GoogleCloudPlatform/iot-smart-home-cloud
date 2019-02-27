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

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from "firebase/app";

@Component({
  selector: 'app-link',
  template: `
    <div style="text-align:center; padding:16px">
      <div *ngIf="authService.user | async as user; else showLogin">
        <h3>Logged in as {{ user.displayName }}</h3>
        <p>
          Click 'Link this Account' to authorize the Google Assistant
          to control your Smart Home devices.
        </p>
        <button (click)="linkAccount()" mat-raised-button style="margin-right: 8px;">
          Link this Account
        </button>
        <button (click)="logout()" mat-raised-button>
          Sign out
        </button>
      </div>
    </div>

    <ng-template #showLogin>
      <h1>Link Smart Home Account</h1>
      <p>Sign in with your Google account to link your devices to the Google Assistant.</p>
      <button (click)="login()" mat-raised-button>
        Sign in with Google
      </button>
    </ng-template>
  `,
  styles: []
})
export class LinkAccountComponent implements OnInit {
  redirectUri: string;
  state: string;
  idToken: string;
  constructor(private authService: AngularFireAuth,
    private route: ActivatedRoute) { }

  ngOnInit() {
    this.authService.idToken.subscribe((token) => {
      this.idToken = token;
    });

    this.route.queryParamMap.subscribe((params) => {
      this.redirectUri = params.get('redirect_uri');
      this.state = params.get('state');
    });
  }

  login() {
    this.authService.auth.setPersistence(firebase.auth.Auth.Persistence.NONE).then(() => {
      const provider = new firebase.auth.GoogleAuthProvider();
      this.authService.auth.signInWithRedirect(provider);
    });
  }

  logout() {
    this.authService.auth.signOut();
  }

  linkAccount() {
    const next = new URL(this.redirectUri);
    next.searchParams.append('code', this.idToken);
    next.searchParams.append('state', this.state);
    window.location.href = next.toString();
  }
}

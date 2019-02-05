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
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from "firebase/app";

@Component({
  selector: 'app-login',
  template: `
    <div style="text-align:center;">
      <h1>Smart Home Device Manager</h1>
      <p>Sign in with your Google account to view and manage your IoT devices.</p>
      <button (click)="login()" mat-raised-button>
        Sign in with Google
      </button>
    </div>
  `,
  styles: []
})
export class LoginComponent implements OnInit {

  constructor(private authService: AngularFireAuth,
    private router: Router) { }

  ngOnInit() {
    // Redirect only on successful login
    this.authService.authState.subscribe((user) => {
      if (user) {
        this.router.navigate(['devices']);
      }
    });
  }

  login() {
    const provider = new firebase.auth.GoogleAuthProvider();
    this.authService.auth.signInWithRedirect(provider);
  }
}

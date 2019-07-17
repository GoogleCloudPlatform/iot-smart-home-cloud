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

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { environment } from "../environments/environment";

@Injectable()
export class LinkGuard implements CanActivate {
  constructor(private router: Router) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean {
    const params = next.queryParamMap;

    const allowedHosts = [
      'https://oauth-redirect.googleusercontent.com',
      'https://developers.google.com'
    ];

    // Validate account linking request parameters
    if (!params.has('client_id')
        || !params.has('response_type')
        || !params.has('redirect_uri')
        // Client id matches expected value
        || params.get('client_id') !== environment.clientId
        // Client is requesting an authorization code
        || params.get('response_type') !== 'code'
        // Client requests a redirect to a known host
        || !allowedHosts.some((element, _index, _array) => params.get('redirect_uri').startsWith(element))) {
          console.error('Invalid Link Request', state.url)
          this.router.navigate(['error']);
          return false;
        }

    return true;
  }
}

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

    // Validate account linking request parameters
    if (!params.has('client_id')
        || !params.has('response_type')
        || !params.has('redirect_uri')
        || params.get('client_id') !== environment.clientId
        || params.get('response_type') !== 'code'
        || !params.get('redirect_uri').startsWith('https://oauth-redirect.googleusercontent.com')) {
          this.router.navigate(['error']);
          return false;
        }

    return true;
  }
}

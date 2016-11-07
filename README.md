# metry-angular2-sdk

The Angular 2 version of the Metry API SDK.

## Installation

SDK is distributed through npm, so install using `npm i --save metry-angular2-sdk` or `yarn add metry-angular2-sdk` if you're into that kind of thing.


## Adding to your application

*These docs will be updated as we learn more best practices using Angular 2.*

Provide the MetryBaseUrl and MetryAuthConfig constants to your Angular bootstrap method.

MetryBaseUrl should probably point to `https://app.metry.io` unless you've recieved other information.

In your main.ts:

```javascript
const metryAuthConfig: MetryAuthConfigOptions = {
  disabled: false, // not really needed if set to false
  clientId: '<your client_id>',
  clientSecret: '<your client secret>',
  redirectUri: '<your redirect_uril>',
  scope: 'basic' // not needed if set to basic, which it most likely should be
}

platformBrowserDynamic([
  { provide: 'MetryBaseUrl', useValue: 'https://app.metry.io' },
  { provide: 'MetryAuthConfig', useValue: metryAuthConfig }
])
  .bootstrapModule(AppModule); // your AppModule
])
```

In your app module:

```javascript
import { MetrySDKModule, Metry, MetryAuth } from 'metry-angular2-sdk/src/index'

@ngModule({
  declarations: [...],
  imports: [
    ..., // Your other imports
    MetrySDKModule
  ],
  providers: [
    ..., // Your other providers
    Metry, // We're currently not sure whether this is needed or if our module takes care of the providing of a single instance
    MetryAuth // We're currently not sure whether this is needed or if our module takes care of the providing of a single instance
  ]
})
```

## Usage

We will update this documentation shortly. For now, please the documentation for [our angular 1 sdk](https://github.com/metry-io/metry-angular-sdk), but instead of injecting the `mry` function, inject `Metry` service in your constructor and get a metry resource through the `resource` method.

Things that were previously set using a setter method (e.g. `setPrivateToken(myToken)` on MetryAuth) is now replaced with a public class variable, so the syntax is now e.g. `auth.privateToken = myToken`

```javascript
import { Component, OnInit } from '@angular/core';
import { Metry, MetryAuth } from 'metry-angular2-sdk/src/index'


export class MetryTestComponent implements OnInit {
  meters: Array<any>
  pagination: any

  constructor(private metry: Metry, private auth: MetryAuth) { }

  ngOnInit() {
    // Create the needed resource
    const Meters = this.metry.resource('meters')

    this.auth.privateToken = 'abc123Iwillnotcommitthissecrettokenanywhere'

    // Query the api
    Meters
      .query({
        box: 'active',
        revoked: false
      })
      .then((res) => {
        this.meters = res.data
        this.pagination = res.pagination
      })
  }
}
```


Please see [the angular 1 sdk documentation](https://github.com/metry-io/metry-angular-sdk/blob/master/README.md) for syntax on other methods, such as `get`, `getData`, `save`, and `delete`.

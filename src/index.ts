import { NgModule } from '@angular/core'
import { HttpModule } from '@angular/http'
import { Metry } from './metry'
import { MetryAuth, MetryAuthConfigOptions } from './auth'
import * as DateUtil from './util/date-util'

@NgModule({
  imports: [HttpModule],
  providers: [
    Metry,
    MetryAuth
  ]
})
export class MetrySDKModule {}
export { Metry, MetryAuth, MetryAuthConfigOptions, DateUtil }

import { RequestOptions } from '@angular/http'

export function isValidToken (token: any) {
  return (token && token.expires_at > Date.now())
}

export function subaccountHeader (subaccount: string): Object {
  return subaccount ? {'X-Subaccount': subaccount} : {}
}

export function organizationHeader (organization: string): Object {
  return organization ? {'X-Organization': organization} : {}
}


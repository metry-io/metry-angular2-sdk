import 'rxjs/add/operator/toPromise';
import { Http, Request } from '@angular/http';
export interface TokenRequestCallback {
    (token: string): void;
}
export interface MetryAuthConfigOptions {
    disabled?: boolean;
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    scope?: string;
}
export declare class MetryAuth {
    private http;
    private baseUrl;
    config: MetryAuthConfigOptions;
    requestQueue: TokenRequestCallback[];
    fetchingAccessToken: boolean;
    constructor(http: Http, baseUrl: string, config: MetryAuthConfigOptions);
    authorizeUrl(): string;
    handleAuthCode(code: string): Promise<void>;
    privateToken: string;
    refreshToken: string;
    accessToken: any;
    organization: string;
    subaccount: string;
    getToken(key: string): any;
    setToken(token: any, key: string): void;
    isAuthenticated(): boolean;
    authorize(request: Request): Promise<Request>;
    ensureAccessToken(refreshToken: string): Promise<any>;
    fetchAccessTokenIfNeeded(refreshToken: string): void;
    processRequestQueue(): void;
    fetchAccessToken(refreshToken: string): Promise<void>;
    accountHeaders(request: Request): Object;
}

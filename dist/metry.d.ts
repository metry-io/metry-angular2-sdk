import { Http, Request } from '@angular/http';
import { MetryResource } from './metry-resource';
import { MetryAuth } from './auth';
export declare class Metry {
    private http;
    private auth;
    private baseUrl;
    apiPath: string;
    constructor(http: Http, auth: MetryAuth, baseUrl: string);
    resource(resource: string): MetryResource;
    request(req: Request): Promise<any>;
    parseResponse(res: any): any;
    handleError(res: any, status: number): Promise<any>;
}

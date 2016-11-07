import { RequestOptions, URLSearchParams } from '@angular/http';
import { Metry } from './metry';
export declare class MetryResource {
    private metry;
    resource: string;
    parent: string;
    parentId: string;
    constructor(metry: Metry, resource: string, parent?: string, parentId?: string);
    get(id: string, options?: RequestOptions): Promise<any>;
    getData(id: string, granularity: string, ranges: Array<string> | string, metrics?: Array<string> | string, extraParams?: URLSearchParams): Promise<any>;
    query(params?: Object, options?: RequestOptions): Promise<any>;
    save(object: any, options?: RequestOptions): Promise<any>;
    delete(id: string, options?: RequestOptions): Promise<any>;
    batch(path: string, ids: Array<string>, data: any, options?: RequestOptions): Promise<any>;
    action(action: string, id?: string, data?: any, options?: RequestOptions): Promise<any>;
    of(parent: string, parentId?: string): MetryResource;
}

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { MetryResource } from './metry-resource';
import { makeUrl } from './util/make-url';
import { MetryAuth } from './auth';
export let Metry = class Metry {
    constructor(http, auth, baseUrl) {
        this.http = http;
        this.auth = auth;
        this.baseUrl = baseUrl;
        this.apiPath = 'api/v2';
    }
    resource(resource) {
        return new MetryResource(this, resource);
    }
    request(req) {
        req.url = makeUrl([this.baseUrl, this.apiPath, req.url]);
        return this.auth
            .authorize(req)
            .then((authorizedRequest) => {
            return this.http
                .request(authorizedRequest)
                .toPromise()
                .then((res) => {
                return this.parseResponse(res.json());
            }, (res) => {
                return this.handleError(res.json(), res.status);
            });
        });
    }
    parseResponse(res) {
        if (!(res.data && 'count' in res && 'limit' in res && 'skip' in res)) {
            return res.data;
        }
        else {
            return {
                data: res.data,
                pagination: {
                    skip: res.skip,
                    limit: res.limit,
                    count: res.count,
                    page: 1 + (res.skip / res.limit),
                    from: (res.count === 0) ? 0 : res.skip + 1,
                    to: (res.skip + res.limit > res.count) ? res.count : res.skip + res.limit
                }
            };
        }
    }
    handleError(res, status) {
        if (typeof res === 'object' && status === 401) {
            this.auth.privateToken = null;
        }
        return (!res || status === 401)
            ? Promise.reject(res)
            : Promise.reject((res && res.data && res.data.errors) ? res.data.errors : res);
    }
};
Metry = __decorate([
    Injectable(),
    __param(2, Inject('MetryBaseUrl')), 
    __metadata('design:paramtypes', [Http, MetryAuth, String])
], Metry);

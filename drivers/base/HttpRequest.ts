import {combineObjects} from '../../lib/shared.functions';

const {Mixin} = require('../../lib/foibles');
const request = require('request');

export interface HttpRequestOptions {
  mainGroup?: string;
  mainUrl: string;
  token?: string;
  timeout?: number;
}

export const HttpRequest = Mixin(parent => class HttpRequest extends parent {

  options: HttpRequestOptions;

  get fullAddress() {
    return `http://${this.address}/${this.path ? this.path : ''}`;
  }

  get timeout() {
    return 10000;
  }

  get mainGroup() {
    return this.class_name;
  }

  initDeviceEx(resolve, reject) {
    this.device = this.setHttpOptions({
      mainUrl: this.fullAddress,
      timeout: this.timeout,
    });
    resolve({});
  }

  deviceParamsChangedEx(resolve, reject) {
    this.options.mainUrl = this.fullAddress;
    resolve({});
  }

  setHttpOptions(options: HttpRequestOptions) {
    return this.options = options;
  }

  baseRequest(name, method, url, body, params = null, headers = {}, status = 200, json = true, optionsEx = null) {
    const mainOptions = {
      name, method, url, body, params, headers, status, json
    };
    if (optionsEx) {
      combineObjects(mainOptions, optionsEx);
    }
    combineObjects(mainOptions, this.options, true);
    return this.baseRequestEx(mainOptions);
  }

  baseRequestEx(mainOptions) {
    return new Promise((resolve, reject) => {
      mainOptions.status = mainOptions.status ? mainOptions.status : 200;
      mainOptions.mainGroup = this.mainGroup;
      mainOptions.url = `${mainOptions.mainUrl}${mainOptions.url}`;
      if (mainOptions.params) {
        const keys = Object.keys(mainOptions.params);
        for (let i = 0; i < keys.length; i++) {
          mainOptions.url += `${i === 0 ? '?' : '&'}${keys[i]}=${encodeURI(mainOptions.params[keys[i]])}`;
        }
      }
      const options: any = {
        url: mainOptions.url,
        method: mainOptions.method,
        async: true,
        json: mainOptions.json === undefined ? true : mainOptions.json,
        timeout: mainOptions.timeout ? mainOptions.timeout : 10000,
        headers: mainOptions.headers,
        rejectUnauthorized: false
      };
      // options['proxy'] = 'http://127.0.0.1:8000'
      if (mainOptions.body) {
        if (options.json && options.headers['Content-Type'] !== 'application/x-www-form-urlencoded') {
          options.body = mainOptions.body;
          if (!options.headers['Content-Type']) {
            options.headers['Content-Type'] = 'application/json; charset=utf-8';
          }
        } else {
          if (options.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
            options.body = '';
            const keys = Object.keys(mainOptions.body);
            for (let i = 0; i < keys.length; i++) {
              options.body += `${i === 0 ? '' : '&'}${keys[i]}=${mainOptions.notEncodeBody ? mainOptions.body[keys[i]] : encodeURIComponent(mainOptions.body[keys[i]])}`;
            }
          } else {
            options.body = mainOptions.body;
          }
        }
      }
      if (mainOptions.token) {
        options.headers['Authorization'] = mainOptions.token;
      }
      if (mainOptions.jar) {
        options.jar = mainOptions.jar;
      }
      if (mainOptions.encoding !== undefined) {
        options.encoding = mainOptions.encoding;
      }
      this.app.log(options, 'request', mainOptions.mainGroup, mainOptions.name);
      try {
        request(options, (error, response, body) => {
          if (response && response.statusCode === mainOptions.status) {
            this.app.log(`${options.url} ${body && options.json ? JSON.stringify(body) : ''}`, 'response', mainOptions.mainGroup, mainOptions.name);
            resolve(mainOptions.rawResponse ? response : body);
          } else {
            this.app.log(`${options.url} ${body && mainOptions.json ? JSON.stringify(body) : (error ? `${error.code} ${error.message}` : '')}`, 'error', mainOptions.mainGroup, mainOptions.name);
            reject(response ? response : error);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

});

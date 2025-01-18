import {combineObjects, parseJson} from '../../lib/shared.functions';

const {Mixin} = require('../../lib/foibles');

const objectToString = (obj, separator, func = null) => {
  let result = '';
  let keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    result += `${i === 0 ? '' : separator}${keys[i]}=${func ? func(obj[keys[i]]) : obj[keys[i]]}`;
  }
  return result;
};

export const Request = Mixin(parent => class Request extends parent {

  get parameters() {
    return [];
  }

  connectEx(resolve, reject) {
    if (this.parameters && this.parameters.find(item => item.command === 'connect')) {
      this.request(() => {
        resolve({});
      }, (error) => {
        reject(error);
      }, {command: 'connect'}).catch((error) => {
        reject(error)
      })
    } else {
      resolve({});
    }
  }

  async request(resolve, reject, params: any = {}) {
    if (!params) {
      params = {};
    }
    const options = {
      headers: {
        'User-Agent': 'PostmanRuntime/7.6.0'
      }
    };
    let response;
    const parameters = this.parameters;
    for (let i = 0; i < parameters.length; i++) {
      const parameter: any = parameters[i];
      if (parameter.saveToken && !parameter.saveToken.force && this.getParam('token')) {
        continue;
      }
      if (params.command) {
        if (!parameter.isAuth && parameter.command !== params.command) {
          continue;
        }
      } else if (parameter.command) {
        continue;
      }
      let mainOptions: any = {};
      combineObjects(mainOptions, parameter.optionsEx);
      combineObjects(mainOptions, parameter.request);
      combineObjects(mainOptions, options);
      combineObjects(mainOptions, this.options);
      if (parameter.command === params.command && params.body) {
        combineObjects(mainOptions.body, params.body);
      }
      if (typeof mainOptions.url === 'function') {
        mainOptions.url = mainOptions.url(params.device ? params.device : this);
      }
      if (typeof mainOptions.body === 'function') {
        mainOptions.body = mainOptions.body(params.device ? params.device : this, params.body);
      }
      if (parameter.token) {
        mainOptions.token = parameter.token();
      }
      if (parameter.request.mainUrl) {
        if (typeof parameter.request.mainUrl === 'function') {
          mainOptions.mainUrl = parameter.request.mainUrl(params.device ? params.device : this, params.body);
        } else {
          mainOptions.mainUrl = parameter.request.mainUrl;
        }
      }
      if (this.userAgent) {
        mainOptions.headers['User-Agent'] = this.userAgent;
      }
      if (typeof mainOptions.jar === 'function') {
        mainOptions.jar = mainOptions.jar();
      }
      if (typeof mainOptions.headers === 'function') {
        mainOptions.headers = mainOptions.headers(params.device ? params.device : this, params.body);
      }
      if (mainOptions.cookies && typeof mainOptions.cookies === 'function') {
        const cookies = mainOptions.cookies();
        mainOptions['headers']['Cookie'] = objectToString(cookies, '; ');
      }
      try {
        response = await this.baseRequestEx(mainOptions);
        if (parameter.saveCookies) {
          const cookies = response && response.headers && response.headers['set-cookie'] ? response.headers['set-cookie'] : null;
          if (cookies) {
            if (parameter.saveCookies.cookieIndex !== undefined) {
              options.headers['Cookie'] = cookies[parameter.saveCookies.cookieIndex];
            } else {
              options.headers['Cookie'] = cookies;
            }
            if (parameter.saveCookie) {
              this.dbDevice.setParam('cookie', options.headers['Cookie']);
              this.saveDeviceParams();
            }
          }
        }
        if (parameter.parse) {
          parameter.parse(options, response.body, response);
        }
        if (parameter.saveToken) {
          if (parameter.request.json === false) {
            response = JSON.parse(response);
          }
          if (parameter.saveToken.key) {
            this.dbDevice.setParam('token', response[parameter.saveToken.key]);
          } else if (parameter.saveToken.keys) {
            parameter.saveToken.keys.forEach(key => {
              this.dbDevice.setParam(key, response[key]);
            });
          }
          this.saveDeviceParams();
        }
        if (parameter.saveBody) {
          const body = {};
          parseJson(body, response);
          parameter.saveBody.forEach(param => {
            this.emit(`update_${param.ident}`, body[param.key]);
            this.emit('update_updated_at_now');
          })
        }
        if (parameter.publish) {
          this.app.publish(this.app.eventTypeStatus(this.class_name), response);
        }
        if (parameter.success) {
          parameter.success(params.device ? params.device : this, mainOptions.body, response);
        }
      } catch (e) {
        if (e && e.statusCode === 401 && !params.iteration) {
          if (this.dbDevice) {
            this.dbDevice.setParam('token', '');
          }
          params.iteration = 1;
          return await this.request(resolve, reject, params);
        } else {
          return reject(e);
        }
      }
    }
    resolve(response);
  }

  statusEx(resolve, reject, update = true) {
    return this.request((response) => {
      if (update) this.queueUpdateEx();
      resolve(response);
    }, reject)
  }

});
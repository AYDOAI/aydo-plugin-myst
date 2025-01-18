import {executeProcess} from './execute-process';
import * as BetterQueue from './better-queue/queue';
import * as fs from 'fs';

export class RequireEx {

  queue;
  modules = {
    // 'curve25519-n2': {version: '^1.1.3', required: false},
    'decimal.js': {version: '^10.2.0', required: true},
    // 'ed25519': {version: '0.0.4', required: false},
    'fast-srp-hap': {version: '^1.0.1', required: true},
    'mdns': {version: '^2.5.1', required: true},
    'modbus-serial': {version: '^7.7.4', required: false},
    'mqtt': {version: '^2.18.8', required: true},
    // 'openzwave-shared': {version: '^1.6.2', required: false},
    'sequelize': {version: '^4.42.0', required: true},
    'serialport': {version: '^9.0.0', required: false},
    'socket.io': {version: '^2.2.0', required: true},
    // 'sodium': {version: '^2.0.3', required: false},
    'sqlite3': {version: '^5.0.0', required: true},
    'zigbee-herdsman': {version: '0.13.26', required: false},
    'ws': {version: '^7.3.1', required: false},
    'generic-pool': {module: 'sequelize', required: false, uninstall: true},
    '../build/Release/sodium': {module: 'sodium', required: false, uninstall: true},
    '../build/Release/dns_sd_bindings': {module: 'mdns', required: false, uninstall: true},
  };

  constructor() {
    this.queue = new BetterQueue(this.onQueue.bind(this));
  }

  requireModule(ident, callback) {
    try {
      callback(null, `TRY: LoadModule(${ident})`, 'log');
      const module = eval(`require('${ident}')`);
      callback(null, `DONE: LoadModule(${ident})`, 'log');
      callback(null, module);
    } catch (e) {
      callback(e);
    }
  }

  onQueue(input, callback) {
    const callback1 = (error, data, name) => {
      // console.log(error, data, name);
      switch (name) {
        case 'log':
          console.log(data);
          break;
        case 'require':
          if (data.module && typeof data.module === 'string') {
            this.requireModule(data.module, callback1);
          }
          break;
        case 'error':
          callback(error);
          break;
        default:
          if (error) {
            this.checkError(input, error, callback1);
          } else {
            callback(null, data);
          }
      }
    };
    if (input.error) {
      this.checkError(input, input.module, callback1);
    } else {
      this.requireModule(input.module, callback1);
    }
  }

  install(input, module, callback, action = 'install') {
    callback(null, `TRY: ${action}Module(${module})`, 'log');
    executeProcess('npm', [action, module, '--unsafe-perm'], {}, true, 30 * 60000).then(() => {
      callback(null, `DONE: ${action}Module(${module})`, 'log');
      if (action === 'uninstall') {
        if (this.modules[module] && this.modules[module].version) {
          module += '@' + this.modules[module].version;
        }
        this.install(input, module, callback);
      } else {
        callback(null, input, 'require');
      }
    }).catch(e => {
      this.checkError(input, e, callback);
    });
  }

  checkError(input, error, callback) {
    callback(null, error, 'log');
    const version = (module) => {
      if (this.modules[module] && this.modules[module].version) {
        module += '@' + this.modules[module].version;
      }
      return module;
    }
    let module;
    let action = 'install';
    if (error) {
      if (error.code === 'MODULE_NOT_FOUND' || (error.message && error.message.indexOf('Could not locate the bindings file.') !== -1)) {
        module = error.message.substring(error.message.indexOf('\'') + 1);
        module = module.substring(0, module.indexOf('\''));
        if (this.modules[module] && this.modules[module].module) {
          input.module = this.modules[module].module;
          action = 'uninstall';
          module = input.module;
        } else if (input.module) {
          action = 'uninstall';
          module = input.module;
        } else {
          module = version(module);
        }
      } else if (typeof error === 'string') {
        const strings = [
          {
            startStr: 'Cannot find module \'',
            endStr: '\''
          }, {
            startStr: 'Refusing to delete ',
            endStr: ':',
            action: 'delete'
          }];
        strings.forEach(str => {
          const index = error.indexOf(str.startStr);
          if (index !== -1) {
            const index2 = error.indexOf(str.endStr, index + str.startStr.length);
            error = error.substring(index + str.startStr.length, index2);
            console.log(str.action, error);
            switch (str.action) {
              case 'delete':
                if (fs.existsSync(error)) {
                  fs.unlinkSync(error);
                  module = version(input.module);
                }
                break;
            }
          }
        })
      }
    }
    if (module) {
      this.install(input, module, callback, action);
    } else {
      callback(error, null, 'error');
    }
  }

  checkModule(module, error = false) {
    return new Promise((resolve, reject) => {
      this.queue.push({module, error}, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }

  checkRequired() {
    const promises = [];
    Object.keys(this.modules).forEach(key => {
      const module = this.modules[key];
      if (module.required !== false) {
        promises.push(this.checkModule(key));
      }
    });
    return Promise.all(promises);
  }

}
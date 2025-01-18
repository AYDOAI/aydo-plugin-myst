import * as path from 'path';
import * as fs from 'fs';
import {EventTypes} from '../enums/EventTypes';
import {baseModule} from './base-module';
import * as moment from 'moment';
import {combineObjects} from '../lib/shared.functions';

const {toExtendable} = require('../lib/foibles');

export const baseDriverModule = toExtendable(class baseDriverModule extends baseModule {

  lastMemoryUsage;
  lastMemoryUsageTime;
  params;
  config;
  ident;
  path;
  environment;
  cloud;
  queue = {};
  pluginName;
  pluginTemplate;
  statusCache = {};
  logging;
  logConfig = {'request': false, 'response': false};
  app = {
    log: (...optionalParameters) => {
      if (optionalParameters.length < 1 || this.logConfig[optionalParameters[1]] !== false) {
        console.log(this.datetime(), this.memoryUsage(), ...optionalParameters);
      }
    },
    errorEx: (...optionalParameters) => {
      console.error(this.datetime(), this.memoryUsage(), ...optionalParameters);
    }
  };

  constructor() {
    super();
    this.pluginName = process.argv[1].replace(path.extname(process.argv[1]), '.json');
    if (fs.existsSync(this.pluginName)) {
      this.pluginTemplate = eval(`require('${this.pluginName}')`);
    } else {
      this.pluginTemplate = {};
    }
  }

  get loadConfig() {
    return false;
  }

  get configFile() {
    return false;
  }

  get id() {
    return `driver-${process.argv[2]}`;
  }

  get device_id() {
    return parseInt(process.argv[2]);
  }

  get statusKeys() {
    return {
      counter: {interval: 15000, max_interval: 15000},
      voltage: {interval: 15000},
      amperage: {interval: 15000},
      power_usage: {interval: 15000},
      power_load: {interval: 15000, max_interval: 15000},
      temperature: {interval: 15000},
      humidity: {interval: 15000},
      co2: {interval: 15000},
      voc: {interval: 15000},
      sound_level: {interval: 15000},
      illuminance: {interval: 15000},
      motion: {},
      motion_value: {interval: 60000000, min_interval: 60000000},
    };
  }

  datetime() {
    return moment(new Date()).format('HH:mm:ss');
  }

  updateEvents() {
    this.events.push({
      name: 'install-device',
      method: this.installDevice.bind(this)
    });
    this.events.push({
      name: 'init-device',
      method: this.initDevice.bind(this)
    });
    this.events.push({
      name: 'connect-device',
      method: this.connect.bind(this)
    });
    this.events.push({
      name: 'device-command',
      method: this.command.bind(this)
    });
    this.events.push({
      name: 'device-sub-devices',
      method: this.subDevices.bind(this)
    });
  }

  // templatesPath2(ident, name = null) {
  //   return path.join('../../', 'templates', ident, name ? name : '');
  // }

  templatesPath(ident, name = null) {
    return path.join(__dirname, '../', '../', 'templates', ident, name ? name : '');
  }

  applicationPath(root, needRoot = false) {
    let length = 0;
    switch (__dirname.split(path.sep).pop()) {
      case 'dist':
        length++;
        break;
      case 'core':
        length += needRoot ? 2 : -1;
        break;
    }
    // length += __dirname.split(path.sep).pop() === 'src' ? 0 : (root.split(path.sep).length - __dirname.split(path.sep).length);
    length += root.split(path.sep).length - __dirname.split(path.sep).length;
    if (length < 0) {
      length = 0;
    }
    let result = needRoot ? path.join(root, '../'.repeat(length)) : '../'.repeat(length);
    if (__dirname.split(path.sep).pop() === 'core') {
      // result = `./${result}`;
    }
    return result;
  }

  loadTemplate(ident, name, options = null) {
    // const path = '../templates/';
    const path1 = path.join(process.cwd(), 'templates', ident, name ? name : '');
    try {
      if (options) {
        // return name ? require(`../../templates/${ident}/${name}`)(options) : null;
        return name ? eval(`require('${path1}')`)(options) : null;
      } else {
        // return name ? require(`../../templates/${ident}/${name}`) : null;
        return name ? eval(`require('${path1}')`) : null;
      }
    } catch (e) {
      console.error(`${path1} ${process.cwd()}`);
      // console.error(`${__dirname} ${path} ${JSON.stringify(fs.readdirSync('./templates/homebridge'))}`);
      throw e;
    }
  }

  installDevice(params) {
    if (this.logging) {
      this.log('installDevice-try', params);
    }
    return new Promise((resolve, reject) => {
      this.params = params && params.params ? params.params : {};
      this.environment = params ? params.environment : {};
      this.cloud = params ? params.cloud : false;
      this.ident = params ? params.ident : null;
      this.path = params ? params.path : null;
      
      this.installDeviceEx(() => {
        if (this.logging) {
          this.log('installDevice-done');
        }
        this.ipc.of.app.emit('install-device', { id: params.id });
        resolve({});
      }, (error) => {
        this.ipc.of.app.emit('install-device', { id: params.id, error });
        reject(error);
      });
    });
  }
  
  initDevice(params) {
    if (this.logging) {
      this.log('initDevice-try', params);
    }
    return new Promise((resolve, reject) => {
      this.params = params && params.params ? params.params : {};
      this.environment = params ? params.environment : {};
      this.cloud = params ? params.cloud : false;
      this.ident = params ? params.ident : null;
      this.path = params ? params.path : null;

      this.initDeviceEx(() => {
        if (this.logging) {
          this.log('initDevice-done');
        }
        this.ipc.of.app.emit('init-device', { id: params.id });
        resolve({});
      }, (error) => {
        this.ipc.of.app.emit('init-device', { id: params.id, error });
        reject(error);
      });
    }).catch(error => {
      this.log('initDevice-try', 'error', error);
    });
  }

  connect(params) {
    if (this.logging) {
      this.log('connect-try', params);
    }
    return new Promise((resolve, reject) => {
      this.connectEx(() => {
        if (this.logging) {
          this.log('connect-done');
        }
        this.ipc.of.app.emit('connect-device', {id: params.id});
        resolve({});
      }, (error) => {
        this.ipc.of.app.emit('connect-device', {id: params.id, error});
        reject(error);
      });
    });
  }

  command(params) {
    if (this.logging) {
      this.log('command-try', params);
    }
    return new Promise((resolve, reject) => {
      // console.log('TRY: device-command', params ? JSON.stringify(params) : '');
      this.commandEx(params.command, params.value, params.params, params.options, (result) => {
        // console.log('DONE: device-command', params ? JSON.stringify(params) : '', result ? JSON.stringify(result) : '');
        if (this.logging) {
          this.log('command-done', result);
        }
        this.ipc.of.app.emit('device-command', {id: params.id, result});
        resolve(result);
      }, (error) => {
        try {
          console.error('ERROR: device-command', params ? params.command : '', JSON.stringify(error));
        } catch (e) {
          console.error('ERROR: device-command', params ? params.command : '', error);
        }
        this.ipc.of.app.emit('device-command', {
          id: params.id,
          error: {ignore: error ? error.ignore : false, message: error ? error.message : ''}
        });
        reject(error);
      }, params.status);
    });
  }

  subDevices(params) {
    return new Promise((resolve, reject) => {
      this.getSubDevicesEx((result) => {
        this.ipc.of.app.emit('device-sub-devices', {id: params.id, result});
        resolve(result);
      }, (error) => {
        console.error('ERROR: device-sub-devices', params ? JSON.stringify(params) : '', error);
        this.ipc.of.app.emit('device-sub-devices', {id: params.id, error: {message: error.message}});
        reject(error);
      }, params.zones);
    });
  }

  installDeviceEx(resolve, reject) {
    const promises = [];
    if (this.pluginTemplate && this.pluginTemplate.dependencies) {
      Object.keys(this.pluginTemplate.dependencies).forEach(key => {
        if (!this.requireEx.modules[key]) {
          this.requireEx.modules[key] = { version: this.pluginTemplate.dependencies[key] };
        }
        promises.push(this.require(key));
      });
    }
    Promise.all(promises).then((libs) => {
      resolve(libs);
    }).catch(error => {
      reject(error)
    });
  }

  initDeviceEx(resolve, reject) {
    const promises = [];
    if (this.pluginTemplate && this.pluginTemplate.dependencies) {
      Object.keys(this.pluginTemplate.dependencies).forEach(key => {
        if (!this.requireEx.modules[key]) {
          this.requireEx.modules[key] = {version: this.pluginTemplate.dependencies[key]};
        }
        promises.push(this.require(key));
      });
    }
    Promise.all(promises).then((libs) => {
      resolve(libs);
    }).catch(error => {
      reject(error)
    });
  }

  commandEx(command, value, params, options, resolve, reject, status) {
    // console.log('commandEx.1', command, value, params, options);
    resolve({});
  }

  connectEx(resolve, reject) {
    resolve({});
  }

  getSubDevicesEx(resolve, reject, zones) {
    resolve({});
  }

  startQueue(ident) {
    console.log('startQueue', ident)
    this.queue[ident] = {
      items: 0,
      iterator: 0,
      errors: 0,
    };
  }

  countQueue(ident) {
    // console.log('countQueue', ident)
    this.queue[ident].items++;
  }

  doneQueue(ident, resolve, reject, inc = 1, error = null) {
    this.queue[ident].iterator += inc;
    console.log('doneQueue', ident, this.queue[ident].iterator, this.queue[ident].items, error)
    if (error && !this.queue[ident].errors) {
      console.log(error);
      this.queue[ident].errors++;
      reject(error);
    } else if (!this.queue[ident].errors && this.queue[ident].iterator === this.queue[ident].items) {
      resolve({});
    }
  }

  checkSubDevice(model, key, name, params, zone_id = null) {
    return this.request('check-sub-device', {model, key, name, params, zone_id, device_id: process.argv[2]});
  }

  publish(eventType: EventTypes, ...optionalParams: any[]) {
    // console.log('publish', eventType, ...optionalParams);
    this.requestEx('publish', {eventType, optionalParams});
    // this.emit('publish', eventType, ...optionalParams);
  }

  publishStatus(eventType: EventTypes, status) {
    // console.log(eventType, status);
    if (!this.statusCache[eventType]) {
      this.statusCache[eventType] = {status: {}, timestamps: {}};
    }
    if (status && typeof status === 'object') {
      const timestamp = new Date().getTime();
      const keys = Object.keys(status);
      let send = false;
      keys.forEach(key => {
        const key1 = key !== 'motion_value' ? key.split('_').slice(0, -1).join('_') : key;
        const needSend = () => {
          send = true;
          this.statusCache[eventType]['status'][key] = status[key];
          this.statusCache[eventType]['timestamps'][key] = timestamp;
        };
        const diff = this.statusCache[eventType]['timestamps'][key] ? timestamp - this.statusCache[eventType]['timestamps'][key] : 60000;
        let changed = typeof status[key] === 'object' ?
          JSON.stringify(status[key]) !== JSON.stringify(this.statusCache[eventType]['status'][key]) :
          status[key] !== this.statusCache[eventType]['status'][key];
        const status_key = this.statusKeys[key1];
        const max_interval = status_key && status_key.max_interval ? status_key.max_interval : 60000;
        if (key1 === 'motion' && changed && !status[key] && this.statusCache[eventType]['status'][key] &&
          timestamp - this.statusCache[eventType]['timestamps'][key] < 15000) {
          changed = false;
        }
        if (changed || diff >= 60000) {
          if (typeof status[key] === 'number' && this.statusCache[eventType]['status'][key] && diff < max_interval) {
            const percent = Math.abs(100 - status[key] * 100 / this.statusCache[eventType]['status'][key]);
            const min_percent = status_key && status_key.min_percent ? status_key.min_percent : 1;
            const max_percent = status_key && status_key.max_percent ? status_key.max_percent : 10;
            const interval = status_key && status_key.interval ? status_key.interval : 15000;
            const min_interval = status_key && status_key.min_interval ? status_key.min_interval : 3000;
            if ((percent > min_percent && diff >= interval) || (percent > max_percent && diff > min_interval)) {
              // console.log(key, status[key], this.statusCache[eventType]['status'][key], percent);
              needSend();
            }
          } else {
            needSend();
          }
        }
      });
      if (send) {
        const result = {};
        Object.keys(this.statusCache[eventType]['status']).forEach(key => {
          if (this.statusCache[eventType]['timestamps'][key] === timestamp) {
            result[key] = this.statusCache[eventType]['status'][key];
            if (key === 'motion' && status['motion_value']) {
              result['motion_value'] = status['motion_value'];
            }
          }
        });
        this.publish(eventType, result);
      }
    }
  }

  eventTypeStatus(className, identifier = null, key = null) {
    return `status->${className}${identifier ? `->${identifier}` : ''}${key ? `->${key}` : ''}`;
  }

  sendNotify(message) {
    this.requestEx('notify', {message});
  }

  getDevices() {
    return this.request('application->getDevices', {});
  }

  getConfig() {
    return this.request('application->getConfig', {});
  }

  deviceCommand(ident, command, data, value) {
    return this.request('application->deviceCommand', {ident, command, data, value});
  }

  getDisplay(ident) {
    return this.request('application->getDisplay', {ident});
  }

  memoryUsage() {
    const time = new Date().getTime();
    if (!this.lastMemoryUsage || time - this.lastMemoryUsageTime >= 1000) {
      this.lastMemoryUsage = process.memoryUsage();
      this.lastMemoryUsageTime = time;
    }
    const formatMem = (ident) => {
      return `${ident}: ${Math.round(this.lastMemoryUsage[ident] / 1024 / 1024 * 100) / 100}MB`;
    };

    // return `${formatMem('rss')}; ${formatMem('heapTotal')}; ${formatMem('heapUsed')}; ${formatMem('external')};`;
    return `${formatMem('rss')};`;
  }

  log(...optionalParameters) {
    this.app.log(...optionalParameters);
  }

  error(...optionalParameters) {
    this.app.errorEx(...optionalParameters);
  }

  request(eventName, params = {}) {
    if (this.logging) {
      this.log('request', eventName, params);
    }
    return super.request(eventName, params);
  }

  requestEx(eventName, params = {}) {
    if (this.logging) {
      const logParams = {};
      combineObjects(logParams, params);
      if (logParams && logParams['optionalParams'] && logParams['optionalParams'][0] && logParams['optionalParams'][0]['preview']) {
        logParams['optionalParams'][0]['preview'] = '<<<DATA>>>';
      }
      this.log('requestEx', eventName, logParams);
    }
    return super.requestEx(eventName, params);
  }

});

import {EventEmitter} from 'events';
import {RequireEx} from '../lib/require-ex';

const {toExtendable} = require('../lib/foibles');

const config = {host: '', port: '', logging: ''};

export const baseModule = toExtendable(class baseModule extends EventEmitter {
  config;
  ipc;
  requestId = 0;
  events = [];
  requireEx;

  constructor() {
    super();
    
    if (this.loadConfig) {
      if (this.configFile) {
        this.config = eval(`require('${process.cwd()}${this.configFile}')`);
      } else {
        this.config = eval(`require('${process.cwd()}/config/config')`);
      }
    }

    this.requireEx = new RequireEx();
    this.ipc = require('node-ipc');

    this.ipc.config.id = this.id;
    this.ipc.config.retry = 1500;
    this.ipc.config.logger = (p1, p2, p3) => {
      // console.log(p1, p2, p3)
    };

    const handle = () => {
      this.updateEvents();
      // console.log(this.id, 'connected', this.events.length);
      this.onAppConnected();

      this.ipc.of.app.on('connect', () => {
        console.log('connected')
        this.onConnect();
        this.ipc.of.app.emit('hello', {id: this.id});
      });

      this.events.forEach(event => {
        // console.log('subscribe', event.name)
        this.ipc.of.app.on(event.name, (p1, p2, p3) => {
          // console.log('base-module', event.name)
          const result = event.method(p1, p2, p3);
          if (result && result.constructor && result.constructor.name === 'Promise') {
            result.then(() => {
            }).catch(() => {
            })
          }
        });
      });
    };

    if (this.config && this.config['logging']) {
      // @ts-ignore
      this.logging = true;
    }

    if (this.config && this.config['host'] && this.config['port']) {
      console.log(`Connecting to ${this.config['host']}:${this.config['port']}`);
      this.ipc.connectToNet('app', this.config['host'], parseInt(this.config['port']), handle.bind(this));
    } else {
      console.log(`Connecting to localhost:8000`);
      this.ipc.connectToNet('app', handle.bind(this));
    }
  }

  get configFile() {
    return false;
  }

  get loadConfig() {
    return true;
  }

  get id() {
    return '';
  }

  updateEvents() {

  }

  onAppConnected() {

  }

  onConnect() {

  }

  request(eventName, params = {}) {
    return new Promise((resolve, reject) => {
      this.requestId++;
      const id = `${this.id}_${this.requestId}`;
      this.ipc.of.app.emit(eventName, Object.assign({id}, params));
      const event = (response) => {
        if (response && response.id === id) {
          resolve(response['result']);
          this.ipc.of.app.off(eventName, event);
        }
      };
      this.ipc.of.app.on(eventName, event);
    });
  }

  requestEx(eventName, params = {}) {
    this.requestId++;
    const id = this.requestId;
    this.ipc.of.app.emit(eventName, Object.assign({id}, params));
  }

  log(message) {
    console.log(message);
  }

  error(message) {
    console.error(message);
  }

  require(ident, require = false) {
    return this.requireEx.checkModule(ident, require);
  }


});

process.argv.forEach(arg => {
  Object.keys(config).forEach(key => {
    if (arg.indexOf(`${key}=`) !== -1) {
      config[key] = arg.split('=')[1];
      console.log(`Set param ${key}=${config[key]}`)
    }
  })
});

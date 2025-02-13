import {baseDriverModule} from '../core/base-driver-module';
import {inspect} from 'util';

const os = require('os');
const path = require('path');
const mystDir = path.join(os.homedir(), '.aydo', 'myst').replace(/\\/g, '/');

let aydoMystProcess: any;


class Myst extends baseDriverModule {
  mystDir = mystDir;
  mystVersion = "1.31.4";
  mystBaseUrl = "https://github.com/mysteriumnetwork/node/releases/download";

  // get configFile() {
  //   return '/config/myst';
  // }

  // get loadConfig() {
  //   return false;
  // }

  installDeviceEx(resolve, reject) {
    const fs = require('fs');
    const os = require('os');
    const platform = os.platform();
    const arch = os.arch();

    if (
      fs.existsSync(`${this.mystDir}/myst`)
    ) {
      this.app.log('Myst already installed');
      return resolve({});
    }

    super.installDeviceEx(() => {
      let arch2 = arch
      if (arch == 'x64') {
        arch2 = 'amd64'
      }

      if (platform == 'linux' && arch == 'arm64') {
        arch2 = 'arm'
      }

      const mystFile = `myst_${platform}_${arch2}.tar.gz`
      const mystFileUrl = `${this.mystBaseUrl}/${this.mystVersion}/${mystFile}`

      if (this.logging) {
        this.log('Myst install, platform: ', platform, ', arch: ', arch);
        this.log('Myst file: ', mystFile);
        this.log('Myst file url: ', mystFileUrl);
      }

      const http = require('follow-redirects').https;

      fs.mkdirSync(this.mystDir, {recursive: true});

      let that = this;

      const file = fs.createWriteStream(`${this.mystDir}/${mystFile}`);
      const request = http.get(mystFileUrl, function (response) {
        response.pipe(file);

        file.on("finish", () => {
          file.close();
          if (that.logging) {
            that.log('Download Myst completed');
          }

          const tar = require('tar');
          tar.x({
            gzip: true,
            C: `${that.mystDir}/`,
            file: `${that.mystDir}/${mystFile}`,
            sync: true
          });

          if (that.logging) {
            that.log('Myst decompressed');
          }

          fs.unlink(`${that.mystDir}/${mystFile}`, (err) => {
            if (err) throw err;

            if (that.logging) {
              that.log('Myst archive was deleted');
            }

            // that.createConfig();
            resolve({});
          });
        });
      });
    }, reject);
  }

  initDeviceEx(resolve, reject) {
    this.log('initDeviceEx-try');
    const fs = require('fs');

    if (
      fs.existsSync(`${this.mystDir}/myst`) === false
    ) {
      this.app.log('Myst not installed');
      return resolve({});
    }

    super.initDeviceEx(() => {
      this.createConfig().then(() => {
        this.startService();

        if (this.checkRun() == false) {
          this.app.log('Myst not running');
        }

        resolve({});
      });
    }, reject);
  }

  async createConfig(): Promise<void> {
    const fs = require('fs');

    const configFilePath = `${this.mystDir}/config/config-mainnet.toml`;

    try {
      const configData = `active-services = ""

[mmn]
  api-key = "06X15Y8aXDTa8aUAzRxod8Yej2KJ2tQTAQGNKSzm"

[node]
  version = "11908038475"

[terms]
  consumer-agreed = true
  provider-agreed = true
  version = "0.0.53"

[ui-terms]
  agreedat = "2025-01-04"
  agreedtoversion = "0.0.53"
`;

      await fs.promises.writeFile(configFilePath, configData, 'utf8');
      this.app.log('Configuration file updated successfully.');

      return;
    } catch (error) {
      this.app.error('An error occurred while updating the configuration file:', error);
    }
  }

  startService(): void {
    this.app.log('Myst will be start');

    const {spawn} = require('child_process');
    aydoMystProcess = spawn(
      `${this.mystDir}/myst`,
      [
        `--config-dir=${this.mystDir}/config`,
        `--script-dir=${this.mystDir}/config`,
        `--data-dir=${this.mystDir}/data`,
        `--runtime-dir=${this.mystDir}/run`,
        `--keystore.lightweight`,
        `--vendor.id=AYDO`,
        `daemon`
      ],
      {
        shell: true,
      }
    );

    if (this.logging) {
      this.app.log('Myst was started');
    }

    aydoMystProcess.stdout.on('data', (data: any) => {
      console.log(`MYST: ${data}`);
    });

    aydoMystProcess.stderr.on('data', (data: any) => {
      console.error(`MYST: Error - ${data}`);
    });

    aydoMystProcess.on('close', (code: any) => {
      console.log(`MYST: exited with code - ${code}`);
    });
  }

  checkRun() {
    const ps = require('ps-node');

    ps.lookup({
      command: `${this.mystDir}/myst`,
      psargs: ''
    }, function (err, resultList) {
      if (err) {
        throw new Error(err);
      }

      resultList.forEach(function (process) {
        if (process && process.command == `${this.mystDir}/myst`) {
          return true;
        }
      });
    });

    return false;
  }

  connectEx(resolve, reject) {
    const status: any = {connected: true};

    this.capabilities = [];

    this.capabilities.push({ident: 'status', index: 1, display_name: 'Status'});

    this.counter = 0;
    status.capabilities = this.capabilities;
    this.publish(this.eventTypeStatus(this.pluginTemplate.class_name, `${this.id}`), status);

    this.getDevices().then(devices => {
      this.app.log(devices);
    });

    setInterval(() => {
      this.commandEx('status', null, null, null, () => {
      }, () => {
      }, null);
    }, 15000);

    resolve({});
  }

  commandEx(command, value, params, options, resolve, reject, status) {
    const between = (min, max) => {
      return Math.floor(Math.random() * (max - min) + min);
    }

    const update = () => {
      (async () => {
        const status: any = {
          connected: true,
          status_1: await this.getServiceStatus(4449),
        };
        this.publish(this.eventTypeStatus(this.pluginTemplate.class_name, `${this.id}`), status);
      })();
    }

    switch (command) {
      case 'status':
        this.index++;
        this.counter++;
        update()
        resolve({});
        break;
      default:
        this.currentStatus[command] = value;
        update()
        resolve({});
    }
  }

  async getServiceStatus(port, host = '127.0.0.1') {
    const isInUse = await this.isPortInUse(port, host);
    return isInUse ? 'Online' : 'Offline';
  }

  isPortInUse(port, host) {
    const net = require('net');
    return new Promise((resolve) => {
      const socket = new net.Socket();

      socket.setTimeout(2000);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        resolve(false);
      });

      socket.connect(port, host);
    });
  }
}

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Terminating all processes.');

  aydoMystProcess.kill('SIGTERM');

  aydoMystProcess.on('exit', () => {
    console.log('Myst process terminated. Terminating application.');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error(`${err ? err.message : inspect(err)}`);
});

const app = new Myst();
app.logging = true;
// app.installDevice({
//   params: {}
// }).then(() => {
//   app.initDevice({
//     params: {}
//   }).then(() => { });
// });
// app.initDevice({
//   params: {}
// }).then(() => { });

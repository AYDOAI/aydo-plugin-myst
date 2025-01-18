import {baseDriverModule} from '../core/base-driver-module';
import {inspect} from 'util';


class Myst extends baseDriverModule {
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
      fs.existsSync(`/etc/default/mysterium-node`) && 
      fs.existsSync(`/usr/bin/myst`) &&
      fs.existsSync(`/etc/mysterium-node/config-mainnet.toml`) 
    ) {
      this.app.log('Myst already installed');
      return resolve({});
    }

    super.installDeviceEx(() => {
      this.app.log('Myst will be install');

      const {exec} = require('child_process');
      const command = 'wget -qO- "https://raw.githubusercontent.com/mysteriumnetwork/node/master/install.sh" | bash'

      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.app.log(`Error executing command:\n${error.message}`);
        }

        if (stderr) {
          this.app.log(`Error during execution:\n${stderr}`);
        }

        this.app.log(`Execution result:\n${stdout}`);

        resolve({});
      });
    }, reject);
  }

  initDeviceEx(resolve, reject) {
    this.log('initDeviceEx-try');
    const fs = require('fs');

    if (
      fs.existsSync(`/etc/default/mysterium-node`) === false ||
      fs.existsSync(`/usr/bin/myst`) === false ||
      fs.existsSync(`/etc/mysterium-node/config-mainnet.toml`) === false
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

    const configFilePath = '/etc/default/mysterium-node';
    const vendorOption = '--vendor.id=AYDO';

    try {
      const fileContent = await fs.promises.readFile(configFilePath, 'utf8');

      const lines = fileContent.split('\n');
      let updated = false;

      const updatedLines = lines.map(line => {
        if (line.startsWith('DAEMON_OPTS=')) {
          if (!line.includes(vendorOption)) {
            const updatedLine = line.replace(
              /DAEMON_OPTS="(.*?)"/,
              `DAEMON_OPTS="$1 ${vendorOption}"`
            );
            updated = true;
            return updatedLine;
          }
        }
        return line;
      });

      if (!updated) {
        this.app.log('No changes needed. The file already contains the required parameters.');
        return;
      }

      const updatedContent = updatedLines.join('\n');

      await fs.promises.writeFile(configFilePath, updatedContent, 'utf8');
      this.app.log('Configuration file updated successfully.');
    } catch (error) {
      this.app.error('An error occurred while updating the configuration file:', error);
    }
  }

  createService(): void {
    const {spawn} = require('child_process');
    spawn('systemctl daemon-reload');
    spawn('systemctl start mysterium-node');
    spawn('systemctl enable mysterium-node.service');
  }

  startService(): void {
    const {spawn} = require('child_process');
    const myst = spawn(
      'service',
      ['mysterium-node', 'restart']
    );

    if (this.logging) {
      this.app.log('Myst was started');
    }
  }

  checkRun() {
    const ps = require('ps-node');

    ps.lookup({
      command: `/usr/bin/myst`,
      psargs: ''
    }, function (err, resultList) {
      if (err) {
        throw new Error(err);
      }

      resultList.forEach(function (process) {
        if (process && process.command == `/usr/bin/myst`) {
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

import {exec} from 'child_process';
import {promisify} from 'util';

const execAsync = promisify(exec);

interface ServiceInfo {
    id: string;
    providerId: string;
    type: string;
}

interface NodeStatus {
    status: string;
    sid: string;
    ip: string;
    location: string;
}

interface HealthInfo {
    uptime: string;
    process: string;
    version: string;
    branch: string;
    buildId: string;
    commit: string;
}

interface NatInfo {
    monitoringStatus: string;
    natType: string;
}

export class MystCliService {
    private static parseServiceList(output: string): ServiceInfo[] {
        const services: ServiceInfo[] = [];
        const lines = output.split('\n');

        for (const line of lines) {
            if (line.includes('[Running]')) {
                const match = line.match(/ID: (\S+).*ProviderID: (\S+).*Type: (\S+)/);
                if (match) {
                    services.push({
                        id: match[1],
                        providerId: match[2],
                        type: match[3]
                    });
                }
            }
        }

        return services;
    }

    private static parseStatus(output: string): NodeStatus {
        const lines = output.split('\n');
        const status: NodeStatus = {
            status: '',
            sid: '',
            ip: '',
            location: ''
        };

        for (const line of lines) {
            if (line.includes('Status:')) status.status = line.split(':')[1].trim();
            if (line.includes('SID:')) status.sid = line.split(':')[1].trim();
            if (line.includes('IP:')) status.ip = line.split(':')[1].trim();
            if (line.includes('Location:')) status.location = line.split(':')[1].trim();
        }

        return status;
    }

    private static parseHealthCheck(output: string): HealthInfo {
        const lines = output.split('\n');
        const health: HealthInfo = {
            uptime: '',
            process: '',
            version: '',
            branch: '',
            buildId: '',
            commit: ''
        };

        for (const line of lines) {
            if (line.includes('Uptime:')) health.uptime = line.split(':')[1].trim();
            if (line.includes('Process:')) health.process = line.split(':')[1].trim();
            if (line.includes('Version:')) health.version = line.split(':')[1].trim();
            if (line.includes('Branch:')) health.branch = line.split(':')[1].trim();
            if (line.includes('Build id:')) health.buildId = line.split(':')[1].trim();
            if (line.includes('Commit:')) health.commit = line.split(':')[1].trim();
        }

        return health;
    }

    private static parseNatInfo(output: string): NatInfo {
        const lines = output.split('\n');
        const natInfo: NatInfo = {
            monitoringStatus: '',
            natType: ''
        };

        for (const line of lines) {
            if (line.includes('Node Monitoring Status:')) {
                natInfo.monitoringStatus = line.split(':')[1].trim().replace(/"/g, '');
            }
            if (line.includes('NAT type:')) {
                natInfo.natType = line.split(':')[1].trim();
            }
        }

        return natInfo;
    }

    async getProviderId(): Promise<string> {
        const {stdout} = await execAsync('myst cli service list');
        const services = MystCliService.parseServiceList(stdout);
        return services[0]?.providerId || '';
    }

    async getRunningServices(): Promise<string[]> {
        const {stdout} = await execAsync('myst cli service list');
        const services = MystCliService.parseServiceList(stdout);
        return services.map(service => service.type);
    }

    async getHealthInfo(): Promise<HealthInfo> {
        const {stdout} = await execAsync('myst cli healthcheck');
        return MystCliService.parseHealthCheck(stdout);
    }

    async getLocation(): Promise<string> {
        const {stdout} = await execAsync('myst cli location');
        return stdout.split(':')[1].trim();
    }

    async getNodeStatus(): Promise<NodeStatus> {
        const {stdout} = await execAsync('myst cli status');
        return MystCliService.parseStatus(stdout);
    }

    async getNatInfo(): Promise<NatInfo> {
        const {stdout} = await execAsync('myst cli nat');
        return MystCliService.parseNatInfo(stdout);
    }
} 
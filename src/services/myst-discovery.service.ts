import axios from 'axios';

interface Proposal {
    id: number;
    format: string;
    compatibility: number;
    provider_id: string;
    service_type: string;
    location: {
        continent: string;
        country: string;
        region: string;
        city: string;
        asn: number;
        isp: string;
        ip_type: string;
    };
    contacts: {
        type: string;
        definition: {
            broker_addresses: string[];
        };
    }[];
    access_policies: {
        id: string;
        source: string;
    }[];
    quality: {
        quality: number;
        latency: number;
        bandwidth: number;
        uptime: number;
        packetLoss: number;
    };
}

export class MystDiscoveryService {
    private readonly baseUrl = 'https://discovery.mysterium.network/api/v3';

    async getProposals(providerId?: string): Promise<Proposal[]> {
        try {
            const url = `${this.baseUrl}/proposals`;
            const params: Record<string, string> = {
                access_policy: 'all'
            };

            if (providerId) {
                params.provider_id = providerId;
            }

            const response = await axios.get<Proposal[]>(url, {params});
            return response.data;
        } catch (error) {
            console.error('Error fetching proposals:', error);
            throw error;
        }
    }

    async getProposalsByProviderId(providerId: string): Promise<Proposal[]> {
        return this.getProposals(providerId);
    }
} 
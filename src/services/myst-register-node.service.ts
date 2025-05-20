import axios from 'axios';


export class MystRegisterNodeService {
    async getIdentityId(passphrase: string = ""): Promise<string> {
        const response = await axios.put(
            'http://127.0.0.1:4050/identities/current',
            {passphrase},
            {headers: {'Content-Type': 'application/json'}}
        );
        return response.data.id;
    }

    async registerIdentity(identityId: string): Promise<boolean> {
        const response = await axios.post(
            'https://cloud.aydo.ai/backend/v2/myst/register-node',
            {identityId: identityId},
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                validateStatus: () => true
            }
        );

        return response.status === 201 && response.data == true;
    }

    async registerBeneficiary(identityId: string, beneficiary: string, stake: number = 0): Promise<boolean> {
        const response = await axios.post(
            `http://127.0.0.1:4050/identities/${identityId}/register`,
            {beneficiary, stake},
            {
                headers: {'Content-Type': 'application/json'},
                validateStatus: () => true
            }
        );
        return response.status === 202;
    }

    async setUiPassword(username: string, oldPassword: string, newPassword: string): Promise<boolean> {
        const response = await axios.put(
            'http://127.0.0.1:4050/auth/password',
            {
                username,
                old_password: oldPassword,
                new_password: newPassword
            },
            {
                headers: {'Content-Type': 'application/json'},
                validateStatus: () => true
            }
        );
        return response.status === 200;
    }

    async getNodeState(): Promise<any> {
        const response = await axios.get('http://127.0.0.1:4050/events/state', {
            responseType: 'stream',
            headers: {'Accept': 'text/event-stream'}
        });

        return new Promise((resolve, reject) => {
            response.data.on('data', (chunk: Buffer) => {
                const str = chunk.toString();
                const matches = str.match(/^data: (.*)$/gm);
                if (matches) {
                    for (const line of matches) {
                        const jsonStr = line.replace(/^data: /, '').trim();
                        if (!jsonStr) continue;
                        try {
                            const parsed = JSON.parse(jsonStr);
                            resolve(parsed);
                            response.data.destroy();
                            return;
                        } catch (e) {
                            continue;
                        }
                    }
                }
            });
            response.data.on('error', reject);
        });
    }

    async run(beneficiaryWallet: string): Promise<{
        identityId: string,
        identityRegistered: boolean,
        beneficiaryRegistered: boolean
    }> {
        const identityId = await this.getIdentityId();
        console.log('Identity ID:', identityId);

        const identityRegistered = await this.registerIdentity(identityId);
        console.log('Identity registered:', identityRegistered);

        const beneficiaryRegistered = await this.registerBeneficiary(identityId, beneficiaryWallet, 0);
        console.log('Beneficiary registered:', beneficiaryRegistered);

        return {
            identityId,
            identityRegistered,
            beneficiaryRegistered
        };
    }
}

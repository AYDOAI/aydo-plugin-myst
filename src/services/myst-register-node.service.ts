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

    async monitorAndRun(beneficiaryWallet, registrationTriggered, monitorInterval) {
        try {
            const identityId = await this.getIdentityId();
            const state = await this.getNodeState();

            const identities = state?.payload?.identities || [];
            const found = identities.find((i: any) => i.id === identityId);

            if (!found) {
                console.log(`[monitor] Identity ${identityId} not found in node state`);
                return;
            }

            console.log(`[monitor] Identity found:`, found);

            if (found.registration_status === 'Unregistered') {
                if (!registrationTriggered) {
                    registrationTriggered = true;
                    console.log(`[monitor] Identity ${identityId} is Unregistered, running registration...`);
                    try {
                        const result = await this.run(beneficiaryWallet);
                        console.log('[monitor] Registration result:', result);
                    } catch (err) {
                        console.error('[monitor] Registration failed:', err);
                    }
                } else {
                    console.log('[monitor] Registration already triggered, skipping...');
                }
            } else if (
                found.registration_status === 'InProgress' ||
                found.registration_status === 'Registered'
            ) {
                console.log(`[monitor] Registration status is ${found.registration_status}, stopping monitor interval.`);
                if (monitorInterval) {
                    clearInterval(monitorInterval);
                    monitorInterval = null;
                }
            } else {
                console.log(`[monitor] Identity ${identityId} status: ${found.registration_status}`);
            }
        } catch (err) {
            console.error('[monitor] Error in monitorAndRun:', err);
        }
    }
}

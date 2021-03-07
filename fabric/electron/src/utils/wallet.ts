import { readFileSync } from 'fs';
import path from 'path';

import { Gateway } from 'fabric-network';

import ccp1 from '../../assets/connection-org1.json';

export const getContract = async (id: string) => {
    const user = JSON.parse(readFileSync(path.join(__dirname, '../../../wallet', `${id}.id`)).toString());
    const gateway = new Gateway();
    await gateway.connect(ccp1, {
        identity: user,
        discovery: {
            enabled: true,
            asLocalhost: true,
        },
    });

    const network = await gateway.getNetwork('channel');
    return network.getContract('GraDAuth');
};

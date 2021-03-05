import path from 'path';

import { Gateway, Wallets } from 'fabric-network';

import ccp1 from '../../assets/connection-org1.json';

const getWallet = async () => {
    return await Wallets.newFileSystemWallet(path.join(process.cwd(), 'wallet'));
};

export const getContract = async (id: string) => {
    const wallet = await getWallet();
    const user = await wallet.get(id);
    if (!user) {
        throw new Error(`User ${id} doesn't exist.`);
    }

    const gateway = new Gateway();
    await gateway.connect(ccp1, {
        wallet,
        identity: id,
        discovery: {
            enabled: true,
            asLocalhost: true,
        },
    });

    const network = await gateway.getNetwork('channel');
    return network.getContract('GraDAuth');
};

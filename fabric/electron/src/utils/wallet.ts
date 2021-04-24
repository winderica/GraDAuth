import { Gateway, Identity } from 'fabric-network';

export const getContract = async (connection: Record<string, unknown>, user: Identity) => {
    const gateway = new Gateway();
    await gateway.connect(connection, {
        identity: user,
        discovery: {
            enabled: false,
        },
    });
    const network = await gateway.getNetwork('channel');
    return network.getContract('GraDAuth');
};

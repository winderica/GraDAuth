import path from 'path';

import FabricCAServices, { IKeyValueAttribute } from 'fabric-ca-client';
import { Wallets, X509Identity } from 'fabric-network';

import ccp1 from '../assets/connection-org1.json';
import ccp2 from '../assets/connection-org2.json';

const getWallet = async () => {
    return await Wallets.newFileSystemWallet(path.join(process.cwd(), '../electron/wallet'));
};

const addAdmin = async (org: 1 | 2 = 1) => {
    const caInfo = [
        ccp1.certificateAuthorities['ca.org1.example.com'],
        ccp2.certificateAuthorities['ca.org2.example.com'],
    ][org - 1];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

    const wallet = await getWallet();

    if (await wallet.get(`admin${org}`)) {
        return;
    }

    const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
    const x509Identity: X509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: `Org${org}MSP`,
        type: 'X.509',
    };

    await wallet.put(`admin${org}`, x509Identity);
};

const addUser = async (id: string, attrs?: IKeyValueAttribute[], org: 1 | 2 = 1) => {
    const caURL = [
        ccp1.certificateAuthorities['ca.org1.example.com'],
        ccp2.certificateAuthorities['ca.org2.example.com'],
    ][org - 1].url;
    const ca = new FabricCAServices(caURL);

    const wallet = await getWallet();
    if (await wallet.get(id)) {
        return;
    }

    const admin = await wallet.get(`admin${org}`);
    if (!admin) {
        throw new Error('Admin does not exist.');
    }

    const provider = wallet.getProviderRegistry().getProvider(admin.type);
    const adminUser = await provider.getUserContext(admin, 'admin');

    const secret = await ca.register({
        affiliation: `org${org}.department1`,
        enrollmentID: id,
        role: 'client',
        attrs,
    }, adminUser);
    const enrollment = await ca.enroll({ enrollmentID: id, enrollmentSecret: secret });
    const x509Identity: X509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: `Org${org}MSP`,
        type: 'X.509',
    };
    await wallet.put(id, x509Identity);
};

void (async () => {
    await addAdmin(1);
    await addAdmin(2);
    await addUser('user');
})();

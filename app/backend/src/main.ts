import { promises } from 'dns';
import { hostname } from 'os';

import cors from 'cors';
import express, { json, urlencoded, Request } from 'express';
import { v4 } from 'uuid';

import { Bob } from './utils/bob';
import { PRE } from './utils/pre';
import { getContract } from './utils/wallet';

const PORT = 4001;

const app = express();
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(json());
app.use(urlencoded({ extended: true }));

const pre = new PRE();

const fakeDB: Record<string, Record<string, string>> = {};
const fakeTokenMap: Record<string, string> = {};

const getToken = (req: Request) => req.header('cookie')?.match(/(?<=token=)(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})/g)?.[0];

void (async () => {
    const { address } = await promises.lookup(hostname());
    await pre.init();
    const contract = await getContract('app');
    const result = await contract.evaluateTransaction('getGH');
    const { g, h } = JSON.parse(result.toString('utf8'));
    const bob = new Bob(pre, g, h);

    app.get('/appInfo', (req, res) => {
        const accessToken = getToken(req) || v4();
        const decryptToken = v4();
        fakeTokenMap[decryptToken] = accessToken;
        res.cookie('token', accessToken).json({
            pk: bob.pk,
            data: ['name', 'avatar', 'city', 'bio'],
            callback: `http://${address}:${PORT}/decrypt/${decryptToken}`,
        });
    });

    app.get('/data', (req, res) => {
        res.json({ data: fakeDB[getToken(req)!] });
    });

    app.get('/status', (req, res) => {
        res.json({ loggedIn: !!fakeDB[getToken(req)!] });
    });

    app.post<{ token: string }, never, { data: string; key: Record<'cb0' | 'cb1', string>; iv: string }[]>(
        '/decrypt/:token',
        (req, res) => {
            try {
                const decrypted: Record<string, string> = {};
                for (const { data, key, iv } of req.body) {
                    const kv: { key: string; value: string } = JSON.parse(bob.reDecrypt(data, key, iv));
                    decrypted[kv.key] = kv.value;
                }
                if (fakeTokenMap[req.params.token]) {
                    fakeDB[fakeTokenMap[req.params.token]] = {
                        name: decrypted.name || '',
                        avatar: decrypted.avatar || '',
                        bio: decrypted.bio || '',
                        city: decrypted.city || '',
                        id: v4(),
                    };
                    delete fakeTokenMap[req.params.token];
                    res.sendStatus(200);
                } else {
                    res.sendStatus(400);
                }
            } catch {
                res.sendStatus(500);
            }
        }
    );

    app.listen(PORT, '0.0.0.0');
})();

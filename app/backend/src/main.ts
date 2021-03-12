import { lookup } from 'dns';
import { hostname } from 'os';
import { promisify } from 'util';

import cors from 'cors';
import express, { json, urlencoded } from 'express';
import session from 'express-session';
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
app.use(session({
    secret: 'F4k3P@ssw0rd',
    resave: false,
    saveUninitialized: true,
    cookie: {
        sameSite: 'lax',
    },
}));

const pre = new PRE();

const fakeDB: Record<string, Record<string, string>> = {};
const fakeTokenMap: Record<string, string> = {};

void (async () => {
    const { address } = await promisify(lookup)(hostname());
    await pre.init();
    const contract = await getContract('app');
    const result = await contract.evaluateTransaction('getGH');
    const { g, h } = JSON.parse(result.toString('utf8'));
    const bob = new Bob(pre, g, h);

    app.get('/appInfo', (req, res) => {
        if (!req.session.token) {
            req.session.token = v4();
        }
        const decryptToken = v4();
        fakeTokenMap[decryptToken] = req.session.token;
        res.json({
            pk: bob.pk,
            data: ['name', 'avatar', 'city', 'bio'],
            callback: `http://${address}:${PORT}/decrypt/${decryptToken}`,
        });
    });

    app.get('/data', (req, res) => {
        res.json({ data: fakeDB[req.session.token] });
    });

    app.get('/status', (req, res) => {
        res.json({ loggedIn: !!fakeDB[req.session.token] });
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

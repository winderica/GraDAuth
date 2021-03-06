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

    app.post('/decrypt/:token', (req, res) => {
        try {
            const data: { data: string; key: { cb0: string; cb1: string }; iv: string }[] = req.body;
            const { name, avatar, bio, city, id } = data
                .map(({ data, key, iv }) => JSON.parse(bob.reDecrypt(data, key, iv)) as Record<string, string>)
                .reduce((i, j) => ({ ...i, ...j }), { id: v4() });
            if (name && avatar && bio && city && id && fakeTokenMap[req.params.token]) {
                fakeDB[fakeTokenMap[req.params.token]] = { name, avatar, bio, city, id };
                res.sendStatus(200);
            } else {
                res.sendStatus(400);
            }
        } catch {
            res.sendStatus(500);
        }
    });

    app.listen(PORT, '0.0.0.0');
})();

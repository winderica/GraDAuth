import cors from 'cors';
import { config } from 'dotenv';
import express, { json, urlencoded } from 'express';
import session from 'express-session';
import got from 'got';
import { v4 } from 'uuid';

import { Bob } from './utils/bob';
import { PRE } from './utils/pre';

config();
const GRADAUTH_BACKEND = process.env.GRADAUTH_BACKEND;
const APP_BACKEND = process.env.APP_BACKEND;

if (!GRADAUTH_BACKEND || !APP_BACKEND) {
    throw new Error('env not specified');
}

const app = express();
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(session({
    secret: 'F4k3P@ssw0rd',
}));

const pre = new PRE();

const fakeDB: Record<string, Record<string, string>> = {};

void (async () => {
    try {
        await pre.init();
        const { payload: { g, h } } = await got(`${GRADAUTH_BACKEND}/auth/generators`).json(); // TODO: fix me
        const bob = new Bob(pre, g, h);

        app.get('/appInfo', (req, res) => {
            if (!req.session.token) {
                req.session.token = v4();
            }
            res.json({
                pk: bob.pk,
                data: ['name', 'avatar', 'city', 'bio'],
                callback: `${APP_BACKEND}/decrypt/${req.session.token}`,
            });
        });

        app.get('/data', (req, res) => {
            res.json({ data: fakeDB[req.session.token] });
        });

        app.get('/status', (req, res) => {
            res.json({ loggedIn: !!fakeDB[req.session.token] });
        });

        app.post('/decrypt/:token', (req, res) => {
            const data: { data: string; key: { cb0: string; cb1: string }; iv: string }[] = req.body;
            const { name, avatar, bio, city, id } = data
                .map(({ data, key, iv }) => JSON.parse(bob.reDecrypt(data, key, iv)) as Record<string, string>)
                .reduce((i, j) => ({ ...i, ...j }), { id: v4() });
            if (name && avatar && bio && city && id) {
                fakeDB[req.params.token] = { name, avatar, bio, city, id };
            }
            res.sendStatus(200);
        });

        app.listen(4001, '0.0.0.0');
    } catch (e) {
        console.log(e);
    }
})();

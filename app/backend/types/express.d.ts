declare namespace Express {
    interface Request {
        session: {
            token: string;
        };
    }
}

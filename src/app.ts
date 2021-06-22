import express, { NextFunction, Request, Response } from 'express';

import { public_path } from './utils/path';
import { mongoConnect } from './configs/database';

const app = express();
const port = process.env.APP_PORT;

app.use(express.json());
app.use(express.static(public_path()));

app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    
    next();
});

app.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ message: `Hello There! Running at: ${process.env.APP_BASE_URL}` });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json({ message: err.message });
});

(async () => {
    const { status, message } = await mongoConnect();
    
    if (status === 'success') {
        app.listen(port);
    }
    
    console.log(message);
})();
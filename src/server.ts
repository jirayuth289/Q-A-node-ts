import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import http, { IncomingMessage } from 'http';
import config from './config';
import { Answer } from './interfact';
import HttpException from './HttpException';

const app = express();

app.get('/', (req: Request, res: Response) => {
    res.send('Q&A REST API');
});

app.get('/question', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filePath = path.join(__dirname, 'data', 'question.json');
        await  fs.access(filePath);

        const fileContent = await fs.readFile(filePath, { encoding: 'utf-8' });

        res.json({ object: 'question', rows: JSON.parse(fileContent) });
    } catch (error: unknown) {
        if (error instanceof Error) {
            next(new HttpException(500, '', error.message));
        } else {
            next(error);
        }
    }
});

app.get('/question/:id/answer', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const questionId = req.params.id ?? undefined;
        if (questionId) {
            const filePath = path.join(__dirname, 'data', 'answer.json');

            const fileContent = await fs.readFile(filePath, { encoding: 'utf-8' });

            const awnserList = JSON.parse(fileContent) as Answer[];

            const answer = awnserList.find((item: Answer) => item.questionId === parseInt(questionId));

            res.json({ object: 'answer', row: answer });
        } else {
            res.status(400).json({ object: 'error', message: 'could not found the requested questionId' });
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            next(new HttpException(500, '', error.message));
        } else {
            next(error);
        }
    }
});

app.use((req: Request, res: Response) => {
    res.status(404).json({ object: 'error', message: 'Not Found' });
});

app.use(
    (error: HttpException, req: Request, res: Response, next: NextFunction) => {
        const status: number = error.status || 500;
        const message: string = error.message || "Something went wrong";

        res.status(status).json({
            status,
            success: false,
            message,
        });
    }
);


let port = config.port;

const hostname = config.hostname;
http.request({
    hostname,
    port,
    method: 'get'
}, (res: IncomingMessage) => {
    res.on('data', () => {
        app.listen(++port, () => {
            console.log('the server is running at:', port);
        });
    });

    res.on('error', (error: HttpException) => {
        console.log('the response have an error;', error);
    });
})
    .on('error', (error: HttpException) => {
        if (error.code === 'ECONNREFUSED') {
            app.listen(port, () => {
                console.log('the server is running at:', port);
            });
        }
    })
    .end();



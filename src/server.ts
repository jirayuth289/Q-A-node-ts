import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
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
        await new Promise((resolve, reject) => {
            fs.access(filePath, (errAccess: NodeJS.ErrnoException | null) => {
                if (errAccess) {
                    reject(errAccess);
                } else {
                    resolve(true);
                }
            });
        });

        const fileReadResult = await new Promise((resolve, reject) => {
            fs.readFile(filePath, (errReadFile: NodeJS.ErrnoException | null, data: Buffer) => {
                if (errReadFile) {
                    reject(errReadFile);
                } else {
                    resolve(JSON.parse(data.toString('utf-8')));
                }
            });
        });

        res.json({ object: 'question', rows: fileReadResult });
    } catch (error: unknown) {
        if (error instanceof Error) {
            next(new HttpException(500, '', error.message));
        }
    }
});

app.get('/question/:id/answer', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const questionId = req.params.id ?? undefined;
        if (questionId) {
            const filePath = path.join(__dirname, 'data', 'answer.json');

            const fileReadResult = await new Promise((resolve, reject) => {
                fs.readFile(filePath, (errReadFile: NodeJS.ErrnoException | null, data: Buffer) => {
                    if (errReadFile) {
                        reject(errReadFile);
                    } else {
                        resolve(JSON.parse(data.toString('utf-8')));
                    }
                });
            }) as Answer[];


            const answer = fileReadResult.find((item: Answer) => item.questionId === parseInt(questionId));

            res.json({ object: 'answer', row: answer });
        } else {
            res.status(400).json({ object: 'error', message: 'could not found the requested questionId' });
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            next(new HttpException(500, '', error.message));
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



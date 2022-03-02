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

app.get('/question', (req: Request, res: Response, next: NextFunction) => {
    const filePath = path.join(__dirname, 'data', 'question.json');
    fs.access(filePath, (errAccess: NodeJS.ErrnoException | null) => {
        if (errAccess) {
            next(new HttpException(500, errAccess.code ?? 'nocode', errAccess.message));
        } else {
            fs.readFile(filePath, (errReadFile: NodeJS.ErrnoException | null, data: Buffer) => {
                if (errReadFile) {

                    next(new HttpException(500, errReadFile.code ?? '', errReadFile.message));
                } else {
                    res.json({ object: 'question', rows: JSON.parse(data.toString('utf-8')) });
                }
            });
        }
    });
});

app.get('/question/:id/answer', (req: Request, res: Response, next: NextFunction) => {
    const questionId = req.params.id ?? undefined;
    if (questionId) {
        const filePath = path.join(__dirname, 'data', 'answer.json');
        fs.readFile(filePath, (errReadFile: NodeJS.ErrnoException | null, data: Buffer) => {
            if (errReadFile) {

                next(new HttpException(500, errReadFile.code ?? 'nocode', errReadFile.message));
            } else {
                const answerList: Answer[] = JSON.parse(data.toString('utf-8'));

                const answer = answerList.find((item: Answer) => item.questionId === parseInt(questionId));

                res.json({ object: 'answer', row: answer });
            }
        });
    } else {
        res.status(400).json({ object: 'error', message: 'could not found the requested questionId' });
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



import express, { Request, Response } from 'express';
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

app.get('/question', (req: Request, res: Response) => {
    const questionList = fs.readFileSync(path.join(__dirname, 'data', 'question.json'), { encoding: 'utf-8' });

    res.json({ object: 'question', rows: JSON.parse(questionList) });
});

app.get('/question/:id/answer', (req: Request, res: Response) => {
    const questionId = req.params.id ?? undefined;
    if (questionId) {
        const data = fs.readFileSync(path.join(__dirname, 'data', 'answer.json'), { encoding: 'utf-8' });

        const answerList: Answer[] = JSON.parse(data);

        const answer = answerList.find((item: Answer) => item.questionId === parseInt(questionId));

        res.json({ object: 'answer', row: answer });
    } else {
        res.status(400).json({ object: 'error', message: 'could not found the requested questionId' });
    }
});

app.use((req: Request, res: Response) => {
    res.status(404).json({ object: 'error', message: 'Not Found' });
});

app.use((error: Error, req: Request, res: Response) => {
    res.status(500).json({ object: 'error', message: error.message || 'Backend Error' });
});

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



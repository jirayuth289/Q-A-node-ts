import express, { Request, Response } from 'express';
import { questionList, answerList } from './data';

const app = express();

app.get('/', (req: Request, res:Response) => {
    res.send('Q&A REST API');
});

app.get('/question', (req: Request, res:Response) => {
    res.json({ object: 'question', rows: questionList });
});

app.get('/question/:id/answer', (req: Request, res: Response) => {
    const questionId = req.params.id ?? undefined;
    if (questionId) {
        const answer = answerList.find(item => item.questionId === parseInt(questionId));
        res.json({ object: 'answer', answer });
    } else {
        res.status(400).json({ object: 'error', message: 'could not found the requested questionId' });
    }
});

const port = 9000;
app.listen(port, () => {
    console.log('Server is running at:', port);
});



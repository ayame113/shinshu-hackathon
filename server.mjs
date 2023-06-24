import express from "express"
import { Configuration, OpenAIApi } from "openai"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv'

config();

const questionJson = await fs.readFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'question.json'), 'utf-8');
const questionData = JSON.parse(questionJson)

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY, // replace with your actual OpenAI key
});

const openai = new OpenAIApi(configuration);




const app = express();
app.use('*', (req, _res, next) => {
  console.log(req.method, req.url);
  next();
})
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.get("/pushQuestion", async (req, res) => {
  res.json({ question: questionData[0].question });
});

app.post("/umigame", async (req, res) => {
  console.log(req.body);
  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{
      role: `system`,
      content:`${questionData[0].prompt}\n質問に対して、「はい」か「いいえ」か「わかりません」とだけで答えて下さい`
    },{
      role: 'user',
      content: req.body.prompt
    }]
  });
  res.json({ answer: response.data.choices[0].message.content });
});

app.post("/answer", async (req, res) => {
  //console.log(req.body);
  const userAnswer = req.body.AnswerStr;
  const realAnswer = questionData[0].answer;
  console.log({ userAnswer, realAnswer });
  const response = await openai.createChatCompletion({
    // model: 'gpt-3.5-turbo-0613',
    model: 'gpt-3.5-turbo',
    messages: [{
      role: 'user',
      content: `「${userAnswer}」は「${realAnswer}」の類似度を100点満点で数字だけで答えて下さい`
    }],
  });
  res.json({ answer: response.data.choices[0].message.content });
});

app.listen(3001, () => {
  console.log("listening http://localhost:3001/")
});


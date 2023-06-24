import express from "express"
import { Configuration, OpenAIApi } from "openai"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv'

config();

const questionJson = await fs.readFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'questions.json'), 'utf-8');
const questionData = JSON.parse(questionJson)
const length = questionData.length;




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
  const randomNumber = Math.floor(Math.random() * length);
  res.json({ question: questionData[randomNumber].question ,questionIndex:randomNumber});
});

app.post("/umigame", async (req, res) => {
  console.log(req.body);
  const {questionIndex} = req.body
  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{
      role: `system`,
      content:`${questionData[questionIndex].prompt}\n質問に対して、「はい」か「いいえ」か「わかりません」とだけで答えて下さい`
    },{
      role: 'user',
      content: req.body.prompt
    }]
  });
  res.json({ answer: response.data.choices[0].message.content });
});

app.post("/answer", async (req, res) => {
  //console.log(req.body);
  const {questionIndex} = req.body
  const userAnswer = req.body.AnswerStr;
  const realAnswer = questionData[questionIndex].answer;
  console.log({ userAnswer, realAnswer });
  const response = await openai.createChatCompletion({
    // model: 'gpt-3.5-turbo-0613',
    model: 'gpt-3.5-turbo',
    messages: [{
      role: 'user',
      content: `「${userAnswer}」は「${realAnswer}」の類似度を100点満点で数字だけで答えて下さい`
    }],
  });
  const chatGptAnswer = response.data.choices[0].message.content;
  res.json({ answer: getPointFromSentence(chatGptAnswer) });
});

app.listen(3000, () => {
  console.log("listening http://localhost:3000/")
});

/** ChatGPTの返答から点数部分を抜き出す */
function getPointFromSentence(text) {
  const result = text.match(/\d+\.?\d点/g);
  if (result && result.length) {
    return result[0]
  }
  return "0点"
}

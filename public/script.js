const conversationDiv = document.getElementById("history");
// const promptInput = document.getElementById("question-textarea");
// const answerInput = document.getElementById("answer-form-textarea");
const questionBox = document.getElementById("current-question");
const answerButton = document.getElementById("answer-form-button");
const questionButton = document.getElementById("question-button");
const giveupButton = document.getElementById("giveup-button");
const requestQuestionButton = document.getElementById("request-new-question");
const form = document.getElementById("form-textarea");
const outputDialog = document.getElementById("output-dialog");
const dialogContentBox = document.getElementById("output-dialog-content");
const dialogCloseButton = document.getElementById("output-dialog-close");
const giveupDialog = document.getElementById("giveup-dialog");
const dialogGiveup = document.getElementById("yes-giveup-button");
const dialogNoGiveup = document.getElementById("no-giveup-button");
const answerDialog = document.getElementById("answer-dialog");
const dialogAnswer = document.getElementById("answer-output");
const dialogAnswerCloseButton = document.getElementById("answer-dialog-close");

const RETRY_MESSAGE =
  "通信エラーが発生しました。少し待ってから再度お試しください。";

// 現在どの質問を処理しているか保存する変数
let currentQuestionIndex;

// 現在の問題の答えを保存する変数
let currentQuestionAnswer;

// 最初に問題を生成する
pushQuestion();

// ダイアログを閉じるボタン
dialogCloseButton.addEventListener("click", () => {
  outputDialog.close();
});

// ダイアログの外側を押したらダイアログを閉じる
outputDialog.addEventListener("click", (e) => {
  if (e.target !== dialogCloseButton) {
    outputDialog.close();
  }
});

// 降参ボタンを押した際の処理
giveupButton.addEventListener("click", () => {
  giveupDialog.showModal();
});

// 降参しない場合
dialogNoGiveup.addEventListener("click", () => {
  giveupDialog.close();
});

// 降参した場合
dialogGiveup.addEventListener("click", () => {
  giveupDialog.close();
  dialogAnswer.innerText = currentQuestionAnswer;
  answerDialog.showModal();
});

// 答え表示時の閉じるボタンの処理
dialogAnswerCloseButton.addEventListener("click", () => {
  answerDialog.close();
});

// 最初に問題を生成する
async function pushQuestion() {
  // 最初に「入力してください」メッセージを出す
  appendMessage("こんにちは！質問を入力してください！", "history-response");

  const response = await fetch("/pushQuestion");
  if (!response.ok) {
    questionBox.innerText = "質問の取得に失敗しました。";
    return;
  }
  const data = await response.json();
  console.log(data.question);
  currentQuestionIndex = data.questionIndex;
  currentQuestionAnswer = data.answer;
  questionBox.innerText = data.question;
}

// 質問する
async function ask() {
  const prompt = form.value;
  // 何も入力されていない場合は何もしない
  if (!prompt) {
    return;
  }
  // カウントダウンが終了するまでボタン押すの禁止
  if (!isAnsweringAllowed) return;
  startCountdown();
  appendMessage(prompt, "history-question");
  // レスポンス待機中の「...」コメントを生成
  const waiting = appendMessage("......", "history-waiting");
  form.value = "";
  const response = await fetch("/umigame", {
    method: "POST",
    body: JSON.stringify({ prompt, questionIndex: currentQuestionIndex }),
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    console.error(await response.text());
    waiting.remove();
    appendMessage(RETRY_MESSAGE, "history-response");
    return;
  }
  const data = await response.json();
  console.log(data);
  waiting.remove();
  appendMessage(data.answer, "history-response");
}

// 回答を送信して正しいかを判定する
async function answer() {
  const answerStr = form.value;
  // 何も入力されていない場合は何もしない
  if (!answerStr) {
    return;
  }
  // カウントダウンが終了するまでボタン押すの禁止
  if (!isAnsweringAllowed) return;
  startCountdown();
  appendMessage(answerStr, "history-question");
  // レスポンス待機中の「...」コメントを生成
  const waiting = appendMessage("......", "history-waiting");
  form.value = "";
  const response = await fetch("/answer", {
    method: "POST",
    body: JSON.stringify({
      answerStr,
      questionIndex: currentQuestionIndex,
    }),
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    console.error(await response.text());
    waiting.remove();
    appendMessage(RETRY_MESSAGE, "history-response");
    return;
  }
  const answerData = await response.json();
  waiting.remove();
  appendMessage(answerData.answer, "history-response");
  outputDialog.showModal();
  dialogContentBox.innerText = answerData.answer;
}

// メッセージを追加する
function appendMessage(text, className) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add(className);
  messageDiv.textContent = text;
  conversationDiv.appendChild(messageDiv);
  messageDiv.scrollIntoView();
  return messageDiv;
}

// 質問ボタンと回答ボタンのクリックイベントを設定
questionButton.addEventListener("click", () => {
  ask();
});

answerButton.addEventListener("click", () => {
  answer();
});

// 新しい問題の出題ボタンのクリックイベントを設定
requestQuestionButton.addEventListener("click", () => {
  conversationDiv.innerText = "";
  pushQuestion();
});

// 回答と質問ボタンの制御
let isAnsweringAllowed = true;
let countdownInterval;
let countdown = 0;

function startCountdown() {
  isAnsweringAllowed = false;
  disableButtons();
  countdown = 6;
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}

function updateCountdown() {
  countdown--;
  document.getElementById("countdown").textContent =
    countdown.toString().padStart(2, "0") + "秒";
  if (countdown <= 0) {
    clearInterval(countdownInterval);
    isAnsweringAllowed = true;
    document.getElementById("countdown").textContent = "";
    enableButtons();
  } else {
    disableButtons();
  }
}

function disableButtons() {
  questionButton.disabled = true;
  answerButton.disabled = true;
  questionButton.classList.add("disabled");
  answerButton.classList.add("disabled");
}

function enableButtons() {
  questionButton.disabled = false;
  answerButton.disabled = false;
  questionButton.classList.remove("disabled");
  answerButton.classList.remove("disabled");
}

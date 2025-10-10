// ========== Black Force 007 — script.js ==========

// CONFIG
const TIME_PER_QUESTION = 15; // seconds
const POINTS_PER_CORRECT = 10;
const COINS_PER_CORRECT = 5;
const SOUND_PATH = 'sounds/';

// STATE
let questionsPool = [];
let currentIndex = 0;
let score = 0;
let correctCount = 0;
let wrongCount = 0;
let coins = 0;
let timer = null;
let timeLeft = TIME_PER_QUESTION;
let locked = false;

// DOM
const qTotalEl = document.getElementById('qTotal');
const qTotalEl2 = document.getElementById('qTotal2');
const qIndexEl = document.getElementById('qIndex');
const timeEl = document.getElementById('time');

const questionEl = document.getElementById('question');
const optionsDiv = document.getElementById('options');

const statScore = document.getElementById('stat-score');
const statCorrect = document.getElementById('stat-correct');
const statWrong = document.getElementById('stat-wrong');
const statCoins = document.getElementById('stat-coins');

const resultScreen = document.getElementById('result-screen');
const finalCorrect = document.getElementById('final-correct');
const finalWrong = document.getElementById('final-wrong');
const finalScore = document.getElementById('final-score');
const finalCoins = document.getElementById('final-coins');
const bestScoreEl = document.getElementById('bestScore');

const skipBtn = document.getElementById('skipBtn');
const playAgainBtn = document.getElementById('playAgain');

// Sounds
const soundClick = new Audio(SOUND_PATH + 'click.mp3');
const soundCorrect = new Audio(SOUND_PATH + 'correct.mp3');
const soundWrong = new Audio(SOUND_PATH + 'wrong.mp3');

// UTIL
function shuffleArr(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function safePlay(audio){
  if(!audio) return;
  audio.currentTime = 0;
  audio.play().catch(()=>{/* ignore autoplay block */});
}

function lockOptions(){
  locked = true;
  optionsDiv.querySelectorAll('.option').forEach(o=>o.classList.add('disabled'));
}
function unlockOptions(){
  locked = false;
  optionsDiv.querySelectorAll('.option').forEach(o=>o.classList.remove('disabled'));
}

// GAME
function startGame(){
  // reset
  score=0; correctCount=0; wrongCount=0; coins=0; currentIndex=0;
  // clone and shuffle questions
  questionsPool = shuffleArr([...QUESTIONS]);
  qTotalEl.textContent = questionsPool.length;
  qTotalEl2.textContent = questionsPool.length;
  showQuestion();
}

function showQuestion(){
  clearInterval(timer);
  unlockOptions();
  locked = false;
  timeLeft = TIME_PER_QUESTION;
  timeEl.textContent = timeLeft;

  if(currentIndex >= questionsPool.length){
    endGame();
    return;
  }

  const q = questionsPool[currentIndex];
  qIndexEl.textContent = currentIndex + 1;
  questionEl.textContent = q.question;

  // build options
  const opts = shuffleArr([...q.options]);
  optionsDiv.innerHTML = '';
  opts.forEach(optText=>{
    const btn = document.createElement('div');
    btn.className = 'option';
    btn.tabIndex = 0;
    btn.textContent = optText;
    btn.addEventListener('click', ()=> handleSelect(btn, q));
    btn.addEventListener('keydown', (e)=> { if(e.key==='Enter' || e.key===' ') handleSelect(btn,q); });
    optionsDiv.appendChild(btn);
  });

  // timer
  timer = setInterval(()=>{
    timeLeft--;
    timeEl.textContent = timeLeft;
    if(timeLeft <= 0){
      clearInterval(timer);
      handleTimeUp(q);
    }
  },1000);
  updateStatsUI();
}

function handleSelect(btn, questionObj){
  if(locked) return;
  safePlay(soundClick);
  lockOptions();
  clearInterval(timer);

  const selected = btn.textContent;
  const correct = questionObj.answer;

  if(selected === correct){
    btn.classList.add('correct');
    safePlay(soundCorrect);
    score += POINTS_PER_CORRECT;
    coins += COINS_PER_CORRECT;
    correctCount++;
  } else {
    btn.classList.add('wrong');
    // highlight correct
    Array.from(optionsDiv.children).forEach(child=>{
      if(child.textContent === correct) child.classList.add('correct');
    });
    safePlay(soundWrong);
    wrongCount++;
  }

  updateStatsUI();

  // auto next after short delay
  setTimeout(()=>{
    currentIndex++;
    showQuestion();
  }, 900);
}

function handleTimeUp(questionObj){
  lockOptions();
  // reveal correct
  Array.from(optionsDiv.children).forEach(child=>{
    if(child.textContent === questionObj.answer) child.classList.add('correct');
  });
  safePlay(soundWrong);
  wrongCount++;
  updateStatsUI();
  setTimeout(()=>{
    currentIndex++;
    showQuestion();
  }, 900);
}

function updateStatsUI(){
  statScore.textContent = score;
  statCorrect.textContent = correctCount;
  statWrong.textContent = wrongCount;
  statCoins.textContent = coins;
}

function endGame(){
  clearInterval(timer);
  // show modal
  finalCorrect.textContent = correctCount;
  finalWrong.textContent = wrongCount;
  finalScore.textContent = score;
  finalCoins.textContent = coins;

  const best = Number(localStorage.getItem('bf007_best') || 0);
  if(score > best) {
    localStorage.setItem('bf007_best', score);
    bestScoreEl.textContent = score + ' (New!)';
  } else {
    bestScoreEl.textContent = best;
  }

  resultScreen.classList.remove('hidden');
  document.querySelector('.quiz-container').style.display = 'none';
}

// skip button
skipBtn && skipBtn.addEventListener('click', ()=>{
  safePlay(soundClick);
  clearInterval(timer);
  handleTimeUp(questionsPool[currentIndex]);
});

// play again
document.addEventListener('click', function (e) {
  if(e.target && e.target.id === 'playAgain'){
    resultScreen.classList.add('hidden');
    document.querySelector('.quiz-container').style.display = 'block';
    startGame();
  }
});
const playAgainBtnEl = document.getElementById('playAgain');
if(playAgainBtnEl){
  playAgainBtnEl.addEventListener('click', ()=>{
    resultScreen.classList.add('hidden');
    document.querySelector('.quiz-container').style.display = 'block';
    startGame();
  });
}

// initial start after DOM loaded
window.addEventListener('DOMContentLoaded', ()=>{
  // preload sounds
  [soundClick, soundCorrect, soundWrong].forEach(s=> s.preload='auto');

  // fail-safe if QUESTIONS not loaded
  if(typeof QUESTIONS === 'undefined' || !Array.isArray(QUESTIONS) || QUESTIONS.length===0){
    questionEl.textContent = 'কোন প্রশ্ন পাওয়া যায়নি — questions.js লোড আছে কি চেক করুন।';
    return;
  }

  startGame();
});

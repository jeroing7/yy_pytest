// ====================================================
// static/script.js
// “야 너두 파이썬 할 수 있어” 출력 예측 게임용 JavaScript
// 정답을 맞추면 자동으로 다음 문제로 넘어가며,
// 현재 문제 번호/총 문제 수(progress)를 표시합니다.
// ====================================================

document.addEventListener('DOMContentLoaded', function () {
  // ----------------------------------------------------
  // 1. 문제 데이터 정의 (여러 개 문제 추가)
  // ----------------------------------------------------
  // 각 문제 객체: 
  //   - code: 화면에 보여줄 파이썬 코드 (백틱(`) 안에 작성)
  // ----------------------------------------------------
  const problems = [
    {
      code:
`for i in range(3):
    print(i * 2 + 1)`
    },
    {
      code:
`print("Hello, Python!")`
    },
    {
      code:
`sum_value = 0
for num in range(1, 6):
    sum_value += num
print(sum_value)`
    },
    {
      code:
`numbers = [3, 5, 2, 8, 1]
count = 0
for n in numbers:
    if n % 2 == 0:
        count += 1
print(count)`
    }
    // 필요하면 아래에 쉼표 뒤에 새로운 객체를 계속 추가하세요.
  ];

  // ----------------------------------------------------
  // 2. 전역 변수 및 DOM 요소 가져오기
  // ----------------------------------------------------
  let currentProblemIndex = 0; // 현재 문제 인덱스 (0부터 시작)
  const codeSnippetEl   = document.getElementById('code-snippet');
  const playerAnswerEl  = document.getElementById('player-answer');
  const submitBtn       = document.getElementById('submit-btn');
  const feedbackMsg     = document.getElementById('feedback-message');
  const progressEl      = document.getElementById('progress'); 
  // ※ index.html의 문제 표시 영역(problem-area)에 
  //    <span id="progress"></span> 요소가 있어야 합니다.

  // ----------------------------------------------------
  // 3. 문제 로드 함수: 문제를 화면에 표시하고 입력/피드백 초기화
  // ----------------------------------------------------
  function loadProblem(index) {
    const problem = problems[index];

    // 1) 진도(progress) 업데이트
    //    예: "1 / 4"
    progressEl.textContent = `${index + 1} / ${problems.length}`;

    // 2) 코드 스니펫 표시
    codeSnippetEl.textContent = problem.code;

    // 3) 입력창과 피드백 초기화
    playerAnswerEl.value = '';
    feedbackMsg.textContent = '';
    feedbackMsg.className = ''; // “correct”나 “incorrect” 클래스 제거
  }

  // ----------------------------------------------------
  // 4. 정답 체크 함수: 백엔드로 파이썬 코드 전송 → 실제 출력 반환 → 비교
  //    정답일 경우 다음 문제로 자동 이동
  // ----------------------------------------------------
  async function checkAnswer() {
    const problem = problems[currentProblemIndex];
    const userInputText = playerAnswerEl.value;

    // 1) 사용자 입력을 줄 단위로 분리 후 trim(), 빈 줄은 제거
    const userLines = userInputText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');

    // 2) 백엔드에 code 전송하여 실제 출력 받기
    let actualLines = [];
    try {
      const response = await fetch('/run_code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: problem.code })
      });
      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        // 코드 실행 중 에러가 발생한 경우
        feedbackMsg.textContent = '코드 실행 중 오류가 발생했습니다.';
        feedbackMsg.classList.add('incorrect');
        console.error(data.error);
        return;
      }
      actualLines = data.output.map(line => String(line).trim());
    } catch (err) {
      // 백엔드 호출 또는 파싱 오류 시 사용자에게 알림
      feedbackMsg.textContent = '서버와 통신 중 오류가 발생했습니다.';
      feedbackMsg.classList.add('incorrect');
      console.error(err);
      return;
    }

    // 3) 비교 로직: 실제 출력(actualLines)과 사용자 입력(userLines) 동일 여부
    let isCorrect = false;
    if (userLines.length === actualLines.length) {
      isCorrect = userLines.every((val, idx) => val === actualLines[idx]);
    }

    // 4) 결과에 따라 피드백 표시 및 다음 문제 이동
    if (isCorrect) {
      feedbackMsg.textContent = '정답입니다! 🎉';
      feedbackMsg.classList.add('correct');

      // 잠시 후(예: 1초) 다음 문제 로드
      setTimeout(() => {
        if (currentProblemIndex < problems.length - 1) {
          currentProblemIndex += 1;
          loadProblem(currentProblemIndex);
        } else {
          // 마지막 문제까지 풀었을 때
          feedbackMsg.textContent = '모든 문제를 완료했습니다! 🎊';
          feedbackMsg.className = '';
        }
      }, 1000); // 1000ms = 1초 딜레이

    } else {
      feedbackMsg.textContent = '아쉽네요, 다시 시도해보세요.';
      feedbackMsg.classList.add('incorrect');
    }
  }

  // ----------------------------------------------------
  // 5. 초기 로딩 및 이벤트 연결
  // ----------------------------------------------------
  // 페이지가 준비되면 첫 번째 문제 로드
  loadProblem(currentProblemIndex);

  // 제출 버튼 클릭 시 checkAnswer() 실행
  submitBtn.addEventListener('click', checkAnswer);
});

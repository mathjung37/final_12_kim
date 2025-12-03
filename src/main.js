import './style.css'
import LinearEquationApp from './app.js'

document.querySelector('#app').innerHTML = `
  <div class="container">
    <header>
      <h1>📐 직선의 방정식 학습</h1>
      <p class="subtitle">왼쪽: 방정식 그리기 | 오른쪽: 그래프로 방정식 찾기</p>
    </header>
    
    <div class="split-container">
      <!-- 왼쪽: 방정식 그리기 -->
      <div class="left-panel">
        <div class="equation-section">
          <div class="equation-box">
            <h2>그려야 할 방정식</h2>
            <div class="equation-display" id="equationDisplay">y = 0x + 0</div>
          </div>
        </div>

        <div class="canvas-section">
          <div class="canvas-wrapper">
            <canvas id="coordinateCanvas"></canvas>
            <div class="axis-labels">
              <span id="originLabel" class="axis-label origin-label">O</span>
              <span id="xAxisLabel" class="axis-label x-axis-label">x</span>
              <span id="yAxisLabel" class="axis-label y-axis-label">y</span>
              <div id="numberLabels" class="number-labels"></div>
            </div>
          </div>
          <div class="points-info" id="pointsDisplay">좌표평면에 정수좌표로 두 개의 점을 찍어주세요!</div>
        </div>

        <div class="controls">
          <button id="checkBtn" class="btn btn-primary">✓ 정답 확인</button>
          <button id="hintBtn" class="btn btn-secondary">💡 힌트 보기</button>
          <button id="resetBtn" class="btn btn-outline">🔄 다시 시작</button>
        </div>

        <div class="message-area" id="messageArea"></div>
        
        <div class="hint-section" id="hintArea"></div>
      </div>

      <!-- 오른쪽: 그래프로 방정식 찾기 -->
      <div class="right-panel">
        <div class="equation-section">
          <div class="equation-box right-equation-box">
            <h2>그래프의 방정식 찾기</h2>
            <div class="equation-display right-equation-display" id="graphEquationDisplay">y = ax + b</div>
          </div>
        </div>

        <div class="canvas-section">
          <div class="canvas-wrapper">
            <canvas id="graphCanvas"></canvas>
            <div class="axis-labels">
              <span id="graphOriginLabel" class="axis-label origin-label">O</span>
              <span id="graphXAxisLabel" class="axis-label x-axis-label">x</span>
              <span id="graphYAxisLabel" class="axis-label y-axis-label">y</span>
              <div id="graphNumberLabels" class="number-labels"></div>
            </div>
          </div>
          <div class="graph-info" id="graphInfo">그래프를 보고 방정식을 찾아보세요!</div>
        </div>

        <div class="input-section">
          <div class="input-group-horizontal">
            <label for="inputA">기울기 a =</label>
            <input type="number" id="inputA" class="number-input" placeholder="a 값">
            <span class="input-separator">,</span>
            <label for="inputB">y절편 b =</label>
            <input type="number" id="inputB" class="number-input" placeholder="b 값">
          </div>
        </div>

        <div class="controls">
          <button id="checkGraphBtn" class="btn btn-primary">✓ 정답 확인</button>
          <button id="hintGraphBtn" class="btn btn-secondary">💡 힌트 보기</button>
          <button id="resetGraphBtn" class="btn btn-outline">🔄 다시 시작</button>
        </div>

        <div class="message-area" id="graphMessageArea"></div>
        
        <div class="hint-section" id="graphHintArea"></div>
      </div>
    </div>
  </div>
`

// DOM이 로드된 후 앱 초기화
setTimeout(() => {
  new LinearEquationApp();
}, 0);

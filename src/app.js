// 좌표평면과 직선 그리기 애플리케이션

class LinearEquationApp {
  constructor() {
    // 왼쪽 패널 (기존 기능)
    this.canvas = null;
    this.ctx = null;
    this.points = [];
    this.equation = null; // {a: number, b: number} 형태
    this.canvasSize = 500;
    // -6부터 6까지 표시하려면: 12칸 필요, 여유 공간 고려하여 gridSize 조정
    // (500 - 100) / 12 ≈ 33.3, 32px로 설정하여 6까지 잘 보이도록
    this.gridSize = 32;
    this.originX = this.canvasSize / 2;
    this.originY = this.canvasSize / 2;
    this.isCorrect = false;
    this.hint = null;
    
    // 오른쪽 패널 (새 기능)
    this.graphCanvas = null;
    this.graphCtx = null;
    this.graphEquation = null; // {a: number, b: number} 형태
    this.graphCanvasSize = 500;
    this.graphGridSize = 32;
    this.graphOriginX = this.graphCanvasSize / 2;
    this.graphOriginY = this.graphCanvasSize / 2;
    this.isGraphCorrect = false;
    this.graphHint = null;
    
    // 환경 변수 확인 및 저장
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    // 디버깅: 환경 변수 상세 정보 출력
    console.log('=== 환경 변수 디버깅 ===');
    console.log('VITE_OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY);
    console.log('타입:', typeof import.meta.env.VITE_OPENAI_API_KEY);
    console.log('길이:', import.meta.env.VITE_OPENAI_API_KEY?.length);
    console.log('값이 있는가?', !!import.meta.env.VITE_OPENAI_API_KEY);
    console.log('모든 VITE_ 환경 변수:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
    console.log('전체 import.meta.env:', import.meta.env);
    console.log('========================');
    
    if (this.apiKey && this.apiKey.trim() !== '' && this.apiKey !== 'your_api_key_here') {
      console.log('✅ API Key가 성공적으로 로드되었습니다.');
    } else {
      console.warn('❌ API Key가 로드되지 않았습니다.');
      console.warn('확인 사항:');
      console.warn('1. .env 파일이 프로젝트 루트에 있는지 확인');
      console.warn('2. .env 파일에 VITE_OPENAI_API_KEY=실제_API_키 형식으로 입력했는지 확인');
      console.warn('3. 등호(=) 앞뒤에 공백이 없는지 확인');
      console.warn('4. 개발 서버를 재시작했는지 확인');
    }
    
    this.init();
  }

  init() {
    // 왼쪽 패널 초기화
    this.generateEquation();
    this.setupCanvas();
    this.setupEventListeners();
    this.drawGrid();
    this.updateEquationDisplay();
    this.renderAxisLabels();
    
    // 오른쪽 패널 초기화
    this.generateGraphEquation();
    this.setupGraphCanvas();
    this.setupGraphEventListeners();
    this.drawGraphGrid();
    this.updateGraphEquationDisplay();
    this.renderGraphAxisLabels();
    
    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', () => {
      this.updateAxisLabels();
      this.updateGraphAxisLabels();
    });
  }

  // 랜덤한 1차 방정식 생성 (y = ax + b)
  generateEquation() {
    // a는 -3부터 3까지 정수, b는 -5부터 5까지 정수
    let a = Math.floor(Math.random() * 7) - 3; // -3 ~ 3
    let b = Math.floor(Math.random() * 11) - 5; // -5 ~ 5
    
    // a가 0인 경우 b는 0이 되면 안됨
    if (a === 0 && b === 0) {
      b = Math.floor(Math.random() * 10) + 1; // 1 ~ 10 (양수만)
    }
    
    this.equation = { a, b };
  }

  setupCanvas() {
    this.canvas = document.getElementById('coordinateCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = this.canvasSize;
    this.canvas.height = this.canvasSize;
  }

  setupEventListeners() {
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    document.getElementById('checkBtn').addEventListener('click', () => this.checkAnswer());
    document.getElementById('hintBtn').addEventListener('click', () => this.getHint());
  }

  // 캔버스 좌표를 실제 좌표로 변환
  canvasToCoordinate(canvasX, canvasY) {
    const x = (canvasX - this.originX) / this.gridSize;
    const y = -(canvasY - this.originY) / this.gridSize;
    return { x, y };
  }

  // 실제 좌표를 캔버스 좌표로 변환
  coordinateToCanvas(x, y) {
    const canvasX = x * this.gridSize + this.originX;
    const canvasY = -y * this.gridSize + this.originY;
    return { canvasX, canvasY };
  }

  handleCanvasClick(e) {
    if (this.isCorrect) return;

    const rect = this.canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    const coord = this.canvasToCoordinate(canvasX, canvasY);
    
    // 좌표를 정수로 반올림
    const roundedCoord = {
      x: Math.round(coord.x),
      y: Math.round(coord.y)
    };
    
    // 최대 2개의 점만 허용
    if (this.points.length < 2) {
      this.points.push(roundedCoord);
      this.drawGrid();
      this.updatePointsDisplay();
    } else {
      // 2개 점이 이미 있으면 교체
      this.points = [roundedCoord];
      this.drawGrid();
      this.updatePointsDisplay();
    }
  }

  drawGrid() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);

    // 배경색
    ctx.fillStyle = '#FFF9F0';
    ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

    // 격자 점선 그리기 (좌표에 정확히 맞게)
    ctx.strokeStyle = '#E8E0D6';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]); // 점선 패턴

    // 세로선 (격자점선) - originX를 기준으로 -6부터 6까지
    for (let i = -6; i <= 6; i++) {
      const x = i * this.gridSize + this.originX;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvasSize);
      ctx.stroke();
    }

    // 가로선 (격자점선) - originY를 기준으로 -6부터 6까지
    for (let i = -6; i <= 6; i++) {
      const y = -i * this.gridSize + this.originY;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvasSize, y);
      ctx.stroke();
    }
    
    ctx.setLineDash([]); // 점선 해제

    // 축 그리기
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;

    // X축 (화살표 포함)
    ctx.beginPath();
    ctx.moveTo(0, this.originY);
    ctx.lineTo(this.canvasSize - 15, this.originY);
    ctx.stroke();
    
    // X축 화살표
    ctx.beginPath();
    ctx.moveTo(this.canvasSize - 15, this.originY);
    ctx.lineTo(this.canvasSize - 25, this.originY - 5);
    ctx.moveTo(this.canvasSize - 15, this.originY);
    ctx.lineTo(this.canvasSize - 25, this.originY + 5);
    ctx.stroke();

    // Y축 (화살표 포함)
    ctx.beginPath();
    ctx.moveTo(this.originX, this.canvasSize);
    ctx.lineTo(this.originX, 15);
    ctx.stroke();
    
    // Y축 화살표
    ctx.beginPath();
    ctx.moveTo(this.originX, 15);
    ctx.lineTo(this.originX - 5, 25);
    ctx.moveTo(this.originX, 15);
    ctx.lineTo(this.originX + 5, 25);
    ctx.stroke();

    // 축 라벨은 HTML overlay로 처리 (LaTeX 렌더링을 위해)

    // 눈금 표시 (-6부터 6까지)
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 1;
    for (let i = -6; i <= 6; i++) {
      if (i === 0) continue;
      const pos = i * this.gridSize + this.originX;
      
      // X축 눈금
      ctx.beginPath();
      ctx.moveTo(pos, this.originY - 5);
      ctx.lineTo(pos, this.originY + 5);
      ctx.stroke();
    }

    for (let i = -6; i <= 6; i++) {
      if (i === 0) continue;
      const pos = -i * this.gridSize + this.originY;
      
      // Y축 눈금
      ctx.beginPath();
      ctx.moveTo(this.originX - 5, pos);
      ctx.lineTo(this.originX + 5, pos);
      ctx.stroke();
    }
    
    // 숫자 라벨은 HTML overlay로 처리 (LaTeX 렌더링을 위해)

    // 사용자가 그린 직선과 점 그리기
    this.drawUserLine();
    
    // 정답 직선 그리기 (정답을 맞췄을 때만)
    if (this.isCorrect) {
      this.drawCorrectLine();
    }
    
    // 축 라벨 위치 업데이트
    this.updateAxisLabels();
  }
  
  // 축 라벨 렌더링 (LaTeX)
  renderAxisLabels() {
    const originLabel = document.getElementById('originLabel');
    const xAxisLabel = document.getElementById('xAxisLabel');
    const yAxisLabel = document.getElementById('yAxisLabel');
    
    if (originLabel && window.katex) {
      originLabel.innerHTML = '';
      katex.render('O', originLabel, { throwOnError: false });
    } else if (originLabel) {
      originLabel.textContent = 'O';
    }
    
    if (xAxisLabel && window.katex) {
      xAxisLabel.innerHTML = '';
      katex.render('x', xAxisLabel, { throwOnError: false });
    } else if (xAxisLabel) {
      xAxisLabel.textContent = 'x';
    }
    
    if (yAxisLabel && window.katex) {
      yAxisLabel.innerHTML = '';
      katex.render('y', yAxisLabel, { throwOnError: false });
    } else if (yAxisLabel) {
      yAxisLabel.textContent = 'y';
    }
    
    // 위치 업데이트
    setTimeout(() => this.updateAxisLabels(), 100);
  }
  
  // 축 라벨 위치 업데이트
  updateAxisLabels() {
    const canvas = this.canvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const containerRect = canvas.closest('.canvas-wrapper')?.getBoundingClientRect() || rect;
    
    // 원점 라벨 (O) - 원점의 왼쪽 아래에 바로 위치
    const originLabel = document.getElementById('originLabel');
    if (originLabel) {
      originLabel.style.left = `${this.originX - 20}px`; // 왼쪽
      originLabel.style.top = `${this.originY + 5}px`; // 바로 아래
    }
    
    // X축 라벨 (화살표 아래에 x 표시)
    const xAxisLabel = document.getElementById('xAxisLabel');
    if (xAxisLabel) {
      xAxisLabel.style.left = `${this.canvasSize - 20}px`;
      xAxisLabel.style.top = `${this.originY + 15}px`; // 화살표 아래
    }
    
    // Y축 라벨 (화살표 오른쪽에 y 표시)
    const yAxisLabel = document.getElementById('yAxisLabel');
    if (yAxisLabel) {
      yAxisLabel.style.left = `${this.originX + 10}px`;
      yAxisLabel.style.top = `10px`; // 화살표 오른쪽
    }
    
    // 숫자 라벨 렌더링
    this.renderNumberLabels();
  }
  
  // 숫자 라벨 렌더링 (LaTeX)
  renderNumberLabels() {
    const numberLabelsContainer = document.getElementById('numberLabels');
    if (!numberLabelsContainer) return;
    
    numberLabelsContainer.innerHTML = '';
    
    // X축 숫자 (-6부터 6까지, 0 제외)
    for (let i = -6; i <= 6; i++) {
      if (i === 0) continue;
      const pos = i * this.gridSize + this.originX;
      
      const label = document.createElement('span');
      label.className = 'number-label x-number-label';
      label.style.left = `${pos}px`;
      label.style.top = `${this.originY + 20}px`;
      
      if (window.katex) {
        katex.render(i.toString(), label, { throwOnError: false });
      } else {
        label.textContent = i.toString();
      }
      
      numberLabelsContainer.appendChild(label);
    }
    
    // Y축 숫자 (-6부터 6까지, 0 제외) - 왼쪽에 배치
    for (let i = -6; i <= 6; i++) {
      if (i === 0) continue;
      const pos = -i * this.gridSize + this.originY;
      
      const label = document.createElement('span');
      label.className = 'number-label y-number-label';
      label.style.left = `${this.originX - 30}px`; // 왼쪽으로 더 이동
      label.style.top = `${pos + 4}px`;
      
      if (window.katex) {
        katex.render(i.toString(), label, { throwOnError: false });
      } else {
        label.textContent = i.toString();
      }
      
      numberLabelsContainer.appendChild(label);
    }
  }
  
  // 그래프 축 라벨 렌더링 (LaTeX)
  renderGraphAxisLabels() {
    const originLabel = document.getElementById('graphOriginLabel');
    const xAxisLabel = document.getElementById('graphXAxisLabel');
    const yAxisLabel = document.getElementById('graphYAxisLabel');
    
    if (originLabel && window.katex) {
      originLabel.innerHTML = '';
      katex.render('O', originLabel, { throwOnError: false });
    } else if (originLabel) {
      originLabel.textContent = 'O';
    }
    
    if (xAxisLabel && window.katex) {
      xAxisLabel.innerHTML = '';
      katex.render('x', xAxisLabel, { throwOnError: false });
    } else if (xAxisLabel) {
      xAxisLabel.textContent = 'x';
    }
    
    if (yAxisLabel && window.katex) {
      yAxisLabel.innerHTML = '';
      katex.render('y', yAxisLabel, { throwOnError: false });
    } else if (yAxisLabel) {
      yAxisLabel.textContent = 'y';
    }
    
    // 위치 업데이트
    setTimeout(() => this.updateGraphAxisLabels(), 100);
  }
  
  // 그래프 숫자 라벨 렌더링 (LaTeX)
  renderGraphNumberLabels() {
    const numberLabelsContainer = document.getElementById('graphNumberLabels');
    if (!numberLabelsContainer) return;
    
    numberLabelsContainer.innerHTML = '';
    
    // X축 숫자 (-6부터 6까지, 0 제외)
    for (let i = -6; i <= 6; i++) {
      if (i === 0) continue;
      const pos = i * this.graphGridSize + this.graphOriginX;
      
      const label = document.createElement('span');
      label.className = 'number-label x-number-label';
      label.style.left = `${pos}px`;
      label.style.top = `${this.graphOriginY + 20}px`;
      
      if (window.katex) {
        katex.render(i.toString(), label, { throwOnError: false });
      } else {
        label.textContent = i.toString();
      }
      
      numberLabelsContainer.appendChild(label);
    }
    
    // Y축 숫자 (-6부터 6까지, 0 제외)
    for (let i = -6; i <= 6; i++) {
      if (i === 0) continue;
      const pos = -i * this.graphGridSize + this.graphOriginY;
      
      const label = document.createElement('span');
      label.className = 'number-label y-number-label';
      label.style.left = `${this.graphOriginX - 30}px`; // 왼쪽으로 더 이동
      label.style.top = `${pos + 4}px`;
      
      if (window.katex) {
        katex.render(i.toString(), label, { throwOnError: false });
      } else {
        label.textContent = i.toString();
      }
      
      numberLabelsContainer.appendChild(label);
    }
  }
  
  // 그래프 축 라벨 위치 업데이트
  updateGraphAxisLabels() {
    const canvas = this.graphCanvas;
    if (!canvas) return;
    
    // 원점 라벨 (O) - 원점의 왼쪽 아래에 바로 위치
    const originLabel = document.getElementById('graphOriginLabel');
    if (originLabel) {
      originLabel.style.left = `${this.graphOriginX - 20}px`; // 왼쪽
      originLabel.style.top = `${this.graphOriginY + 5}px`; // 바로 아래
    }
    
    // X축 라벨 (화살표 아래에 x 표시)
    const xAxisLabel = document.getElementById('graphXAxisLabel');
    if (xAxisLabel) {
      xAxisLabel.style.left = `${this.graphCanvasSize - 20}px`;
      xAxisLabel.style.top = `${this.graphOriginY + 15}px`; // 화살표 아래
    }
    
    // Y축 라벨 (화살표 오른쪽에 y 표시)
    const yAxisLabel = document.getElementById('graphYAxisLabel');
    if (yAxisLabel) {
      yAxisLabel.style.left = `${this.graphOriginX + 10}px`;
      yAxisLabel.style.top = `10px`; // 화살표 오른쪽
    }
    
    // 숫자 라벨 렌더링
    this.renderGraphNumberLabels();
  }

  drawUserLine() {
    if (this.points.length === 2) {
      const ctx = this.ctx;
      const p1 = this.coordinateToCanvas(this.points[0].x, this.points[0].y);
      const p2 = this.coordinateToCanvas(this.points[1].x, this.points[1].y);

      // 사용자가 그린 직선
      ctx.strokeStyle = '#FF6B9D';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p1.canvasX, p1.canvasY);
      ctx.lineTo(p2.canvasX, p2.canvasY);
      ctx.stroke();

      // 점 표시
      ctx.fillStyle = '#FF6B9D';
      ctx.beginPath();
      ctx.arc(p1.canvasX, p1.canvasY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p2.canvasX, p2.canvasY, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.points.length === 1) {
      // 점 하나만 있을 때
      const ctx = this.ctx;
      const p = this.coordinateToCanvas(this.points[0].x, this.points[0].y);
      ctx.fillStyle = '#FF6B9D';
      ctx.beginPath();
      ctx.arc(p.canvasX, p.canvasY, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 사용자가 그린 직선의 방정식 계산
  calculateUserEquation() {
    if (this.points.length !== 2) return null;

    const [p1, p2] = this.points;
    const dx = p2.x - p1.x;
    
    if (Math.abs(dx) < 0.001) {
      // 수직선인 경우
      return { type: 'vertical', x: p1.x };
    }

    const a = (p2.y - p1.y) / dx;
    const b = p1.y - a * p1.x;

    return { a, b };
  }

  // 정답 확인
  async checkAnswer() {
    if (this.points.length !== 2) {
      this.showMessage('두 개의 점을 찍어주세요! 😊', 'info');
      return;
    }

    const userEq = this.calculateUserEquation();
    if (!userEq || userEq.type === 'vertical') {
      this.showMessage('직선을 그려주세요! 😊', 'info');
      return;
    }

    // 허용 오차
    const tolerance = 0.2;
    const aDiff = Math.abs(userEq.a - this.equation.a);
    const bDiff = Math.abs(userEq.b - this.equation.b);

    if (aDiff <= tolerance && bDiff <= tolerance) {
      this.isCorrect = true;
      this.showMessage('정답입니다! 🎉 잘하셨어요!', 'success');
      this.drawGrid(); // 정답 직선을 포함하여 다시 그리기
      document.getElementById('checkBtn').disabled = true;
      document.getElementById('hintBtn').disabled = true;
    } else {
      this.showMessage('아직 정답이 아니에요. 힌트를 확인해보세요! 💪', 'error');
      this.hint = null; // 힌트 초기화
    }
  }

  // 정답 직선 그리기
  drawCorrectLine() {
    const ctx = this.ctx;
    const { a, b } = this.equation;

    // 직선의 양 끝점 계산 (-6부터 6까지)
    const x1 = -6;
    const y1 = a * x1 + b;
    const x2 = 6;
    const y2 = a * x2 + b;

    const p1 = this.coordinateToCanvas(x1, y1);
    const p2 = this.coordinateToCanvas(x2, y2);

    // 정답 직선 (반투명)
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(p1.canvasX, p1.canvasY);
    ctx.lineTo(p2.canvasX, p2.canvasY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // GPT를 통한 힌트 제공
  async getHint() {
    if (this.points.length !== 2) {
      this.showMessage('먼저 두 개의 점을 찍어주세요! 😊', 'info');
      return;
    }

    // 저장된 API 키 사용 (없으면 다시 시도)
    let apiKey = this.apiKey || import.meta.env.VITE_OPENAI_API_KEY;
    
    // 빈 문자열이나 undefined 체크
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_api_key_here') {
      console.error('=== 환경 변수 상세 디버깅 ===');
      console.error('import.meta.env.VITE_OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY);
      console.error('저장된 this.apiKey:', this.apiKey);
      console.error('API Key 타입:', typeof import.meta.env.VITE_OPENAI_API_KEY);
      console.error('API Key 길이:', import.meta.env.VITE_OPENAI_API_KEY?.length);
      console.error('모드:', import.meta.env.MODE);
      console.error('개발 모드:', import.meta.env.DEV);
      console.error('프로덕션 모드:', import.meta.env.PROD);
      console.error('모든 VITE_ 환경 변수:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
      console.error('전체 import.meta.env:', import.meta.env);
      console.error('============================');
      
      const hintArea = document.getElementById('hintArea');
      hintArea.innerHTML = `
        <div class="hint-box error">
          <h3>⚠️ API Key 오류</h3>
          <p>API Key가 설정되지 않았습니다.</p>
          <p style="font-size: 0.9em; margin-top: 10px; font-weight: bold;">중요: .env 파일이 비어있거나 내용이 저장되지 않았을 수 있습니다.</p>
          <p style="font-size: 0.9em; margin-top: 10px;">확인 사항:</p>
          <ol style="font-size: 0.85em; margin-top: 5px; text-align: left; display: inline-block;">
            <li>.env 파일을 텍스트 에디터로 열어서 내용이 있는지 확인</li>
            <li>파일 형식: <code>VITE_OPENAI_API_KEY=실제_API_키</code> (등호 앞뒤 공백 없음)</li>
            <li>파일을 저장했는지 확인 (Ctrl+S)</li>
            <li>개발 서버를 완전히 종료하고 재시작</li>
            <li>브라우저를 새로고침 (Ctrl+F5 또는 Ctrl+Shift+R)</li>
          </ol>
          <p style="font-size: 0.85em; margin-top: 10px; color: #999;">브라우저 콘솔(F12)에서 자세한 디버깅 정보를 확인할 수 있습니다.</p>
        </div>
      `;
      return;
    }

    const userEq = this.calculateUserEquation();
    if (!userEq || userEq.type === 'vertical') {
      this.showMessage('직선을 그려주세요! 😊', 'info');
      return;
    }

    // 로딩 표시
    const hintArea = document.getElementById('hintArea');
    hintArea.innerHTML = '<p>힌트를 생각하고 있어요... 🤔</p>';

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: '당신은 친절하고 따뜻한 수학 선생님입니다. 학생들이 수학을 좋아하도록 격려하고, 쉽고 이해하기 쉬운 힌트를 제공합니다.'
            },
            {
              role: 'user',
              content: `학생이 y = ${this.equation.a}x + ${this.equation.b} 방정식을 그려야 하는데 아직 정답이 아닙니다.
                        학생이 그린 그래프의 방정식을 자세히 언급하지 말고, 
                        정답 방정식(y = ${this.equation.a}x + ${this.equation.b})을 그리는 방법에 대한 힌트를 친절하고 따뜻하게 주세요.
                        
                        힌트에는 다음 내용을 포함해주세요:
                        1. 기울기와 y절편을 이용한 설명
                        2. 구체적인 예시: x에 정수값(예: 0, 1, -1 등)을 대입해서 y값을 구하고, 그 좌표를 찍는 방법
                        3. 두 점을 찾아서 직선을 그리는 방법
                        
                        중요: 
                        - 인사말이나 불필요한 서두 없이 바로 핵심 힌트 내용부터 시작해주세요.
                        - 수식을 작성할 때 LaTeX 표기법(예: \\(, \\), $ 등)을 사용하지 말고, 
                          일반 텍스트로 작성해주세요. 예를 들어 "y = -3x - 4"처럼 간단하게 작성해주세요.
                        - 마크다운이나 특수 기호 없이 읽기 쉬운 일반 텍스트로 작성해주세요.
                        - 격려의 말은 마지막에 간단히 한 문장으로만 추가해주세요.
                        
                        한국어로 답변해주세요.`
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API 응답 오류:', response.status, errorData);
        throw new Error(`API 요청 실패 (${response.status}): ${errorData.error?.message || '알 수 없는 오류'}`);
      }

      const data = await response.json();
      const hint = data.choices[0].message.content;
      this.hint = hint;
      
      // 줄바꿈 문자를 <br>로 변환하고, 여러 줄바꿈을 정리
      const formattedHint = hint
        .replace(/\n\n+/g, '\n\n')  // 여러 줄바꿈을 두 개로 정리
        .replace(/\n/g, '<br>');     // 줄바꿈을 <br>로 변환
      
      hintArea.innerHTML = `
        <div class="hint-box">
          <h3>💡 힌트</h3>
          <p>${formattedHint}</p>
        </div>
      `;
    } catch (error) {
      console.error('Error:', error);
      hintArea.innerHTML = `
        <div class="hint-box error">
          <h3>⚠️ 오류</h3>
          <p>힌트를 가져오는 중 오류가 발생했습니다.</p>
          <p style="font-size: 0.9em; margin-top: 10px; color: #666;">${error.message || '알 수 없는 오류'}</p>
          <p style="font-size: 0.85em; margin-top: 10px; color: #999;">브라우저 콘솔(F12)에서 자세한 오류를 확인할 수 있습니다.</p>
        </div>
      `;
    }
  }

  reset() {
    this.points = [];
    this.isCorrect = false;
    this.hint = null;
    this.generateEquation();
    this.drawGrid();
    this.updateEquationDisplay();
    this.updatePointsDisplay();
    document.getElementById('hintArea').innerHTML = '';
    document.getElementById('checkBtn').disabled = false;
    document.getElementById('hintBtn').disabled = false;
    this.showMessage('', '');
  }

  updateEquationDisplay() {
    const eqDisplay = document.getElementById('equationDisplay');
    const { a, b } = this.equation;
    
    let latexText = '';
    
    // a가 0인 경우: y = b
    if (a === 0) {
      latexText = `y = ${b}`;
    }
    // b가 0인 경우: y = ax
    else if (b === 0) {
      if (a === 1) {
        latexText = 'y = x';
      } else if (a === -1) {
        latexText = 'y = -x';
      } else {
        latexText = `y = ${a}x`;
      }
    }
    // a와 b가 모두 0이 아닌 경우
    else {
      const sign = b >= 0 ? '+' : '';
      let aDisplay = '';
      if (a === 1) {
        aDisplay = 'x';
      } else if (a === -1) {
        aDisplay = '-x';
      } else {
        aDisplay = `${a}x`;
      }
      latexText = `y = ${aDisplay} ${sign}${b}`;
    }
    
    // KaTeX로 렌더링
    eqDisplay.innerHTML = '';
    if (window.katex) {
      katex.render(latexText, eqDisplay, {
        throwOnError: false
      });
    } else {
      eqDisplay.textContent = latexText;
    }
  }

  updatePointsDisplay() {
    const pointsDisplay = document.getElementById('pointsDisplay');
    if (this.points.length === 0) {
      pointsDisplay.textContent = '좌표평면에 정수좌표로 두 개의 점을 찍어주세요!';
    } else if (this.points.length === 1) {
      const p = this.points[0];
      pointsDisplay.textContent = `점 1: (${p.x}, ${p.y}) - 정수좌표로 점 하나 더 찍어주세요!`;
    } else {
      const [p1, p2] = this.points;
      pointsDisplay.textContent = `점 1: (${p1.x}, ${p1.y}), 점 2: (${p2.x}, ${p2.y})`;
    }
  }

  showMessage(message, type) {
    const messageArea = document.getElementById('messageArea');
    if (!message) {
      messageArea.innerHTML = '';
      messageArea.className = '';
      return;
    }

    messageArea.textContent = message;
    messageArea.className = `message ${type}`;
    
    if (type === 'success') {
      setTimeout(() => {
        messageArea.innerHTML = '';
        messageArea.className = '';
      }, 5000);
    }
  }

  // ========== 오른쪽 패널 기능 (그래프로 방정식 찾기) ==========

  // 랜덤한 그래프 방정식 생성
  generateGraphEquation() {
    let a = Math.floor(Math.random() * 7) - 3; // -3 ~ 3
    let b = Math.floor(Math.random() * 11) - 5; // -5 ~ 5
    
    if (a === 0 && b === 0) {
      b = Math.floor(Math.random() * 10) + 1;
    }
    
    this.graphEquation = { a, b };
  }

  // 그래프 캔버스 설정
  setupGraphCanvas() {
    this.graphCanvas = document.getElementById('graphCanvas');
    this.graphCtx = this.graphCanvas.getContext('2d');
    this.graphCanvas.width = this.graphCanvasSize;
    this.graphCanvas.height = this.graphCanvasSize;
  }

  // 그래프 이벤트 리스너 설정
  setupGraphEventListeners() {
    document.getElementById('checkGraphBtn').addEventListener('click', () => this.checkGraphAnswer());
    document.getElementById('hintGraphBtn').addEventListener('click', () => this.getGraphHint());
    document.getElementById('resetGraphBtn').addEventListener('click', () => this.resetGraph());
  }

  // 그래프 그리드 그리기
  drawGraphGrid() {
    const ctx = this.graphCtx;
    ctx.clearRect(0, 0, this.graphCanvasSize, this.graphCanvasSize);

    // 배경색
    ctx.fillStyle = '#FFF9F0';
    ctx.fillRect(0, 0, this.graphCanvasSize, this.graphCanvasSize);

    // 격자 점선 그리기 (좌표에 정확히 맞게)
    ctx.strokeStyle = '#E8E0D6';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]); // 점선 패턴

    // 세로선 (격자점선) - graphOriginX를 기준으로 -6부터 6까지
    for (let i = -6; i <= 6; i++) {
      const x = i * this.graphGridSize + this.graphOriginX;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.graphCanvasSize);
      ctx.stroke();
    }

    // 가로선 (격자점선) - graphOriginY를 기준으로 -6부터 6까지
    for (let i = -6; i <= 6; i++) {
      const y = -i * this.graphGridSize + this.graphOriginY;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.graphCanvasSize, y);
      ctx.stroke();
    }
    
    ctx.setLineDash([]); // 점선 해제

    // 축 그리기
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;

    // X축 (화살표 포함)
    ctx.beginPath();
    ctx.moveTo(0, this.graphOriginY);
    ctx.lineTo(this.graphCanvasSize - 15, this.graphOriginY);
    ctx.stroke();
    
    // X축 화살표
    ctx.beginPath();
    ctx.moveTo(this.graphCanvasSize - 15, this.graphOriginY);
    ctx.lineTo(this.graphCanvasSize - 25, this.graphOriginY - 5);
    ctx.moveTo(this.graphCanvasSize - 15, this.graphOriginY);
    ctx.lineTo(this.graphCanvasSize - 25, this.graphOriginY + 5);
    ctx.stroke();

    // Y축 (화살표 포함)
    ctx.beginPath();
    ctx.moveTo(this.graphOriginX, this.graphCanvasSize);
    ctx.lineTo(this.graphOriginX, 15);
    ctx.stroke();
    
    // Y축 화살표
    ctx.beginPath();
    ctx.moveTo(this.graphOriginX, 15);
    ctx.lineTo(this.graphOriginX - 5, 25);
    ctx.moveTo(this.graphOriginX, 15);
    ctx.lineTo(this.graphOriginX + 5, 25);
    ctx.stroke();

    // 축 라벨은 HTML overlay로 처리 (LaTeX 렌더링을 위해)

    // 눈금 표시 (-6부터 6까지)
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 1;
    for (let i = -6; i <= 6; i++) {
      if (i === 0) continue;
      const pos = i * this.graphGridSize + this.graphOriginX;
      
      // X축 눈금
      ctx.beginPath();
      ctx.moveTo(pos, this.graphOriginY - 5);
      ctx.lineTo(pos, this.graphOriginY + 5);
      ctx.stroke();
    }

    for (let i = -6; i <= 6; i++) {
      if (i === 0) continue;
      const pos = -i * this.graphGridSize + this.graphOriginY;
      
      // Y축 눈금
      ctx.beginPath();
      ctx.moveTo(this.graphOriginX - 5, pos);
      ctx.lineTo(this.graphOriginX + 5, pos);
      ctx.stroke();
    }
    
    // 숫자 라벨은 HTML overlay로 처리 (LaTeX 렌더링을 위해)

    // 정답 직선 그리기
    this.drawGraphLine();
  }

  // 그래프 직선 그리기
  drawGraphLine() {
    const ctx = this.graphCtx;
    const { a, b } = this.graphEquation;

    // 직선의 양 끝점 계산 (-6부터 6까지)
    const x1 = -6;
    const y1 = a * x1 + b;
    const x2 = 6;
    const y2 = a * x2 + b;

    const p1 = this.graphCoordinateToCanvas(x1, y1);
    const p2 = this.graphCoordinateToCanvas(x2, y2);

    // 직선 그리기 (오른쪽 패널은 파란색)
    ctx.strokeStyle = '#6BB3FF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p1.canvasX, p1.canvasY);
    ctx.lineTo(p2.canvasX, p2.canvasY);
    ctx.stroke();
  }

  // 그래프 좌표를 캔버스 좌표로 변환
  graphCoordinateToCanvas(x, y) {
    const canvasX = x * this.graphGridSize + this.graphOriginX;
    const canvasY = -y * this.graphGridSize + this.graphOriginY;
    return { canvasX, canvasY };
  }

  // 그래프 방정식 표시 업데이트
  updateGraphEquationDisplay() {
    const eqDisplay = document.getElementById('graphEquationDisplay');
    if (this.isGraphCorrect && this.graphEquation) {
      const { a, b } = this.graphEquation;
      let latexText = '';
      
      if (a === 0) {
        latexText = `y = ${b}`;
      } else if (b === 0) {
        if (a === 1) {
          latexText = 'y = x';
        } else if (a === -1) {
          latexText = 'y = -x';
        } else {
          latexText = `y = ${a}x`;
        }
      } else {
        const sign = b >= 0 ? '+' : '';
        let aDisplay = '';
        if (a === 1) {
          aDisplay = 'x';
        } else if (a === -1) {
          aDisplay = '-x';
        } else {
          aDisplay = `${a}x`;
        }
        latexText = `y = ${aDisplay} ${sign}${b}`;
      }
      
      // KaTeX로 렌더링
      eqDisplay.innerHTML = '';
      if (window.katex) {
        katex.render(latexText, eqDisplay, {
          throwOnError: false
        });
      } else {
        eqDisplay.textContent = latexText;
      }
    } else {
      eqDisplay.innerHTML = '';
      if (window.katex) {
        katex.render('y = ax + b', eqDisplay, {
          throwOnError: false
        });
      } else {
        eqDisplay.textContent = 'y = ax + b';
      }
    }
  }

  // 그래프 정답 확인
  checkGraphAnswer() {
    if (this.isGraphCorrect) return;

    const inputA = document.getElementById('inputA');
    const inputB = document.getElementById('inputB');
    
    const userA = parseInt(inputA.value);
    const userB = parseInt(inputB.value);

    if (isNaN(userA) || isNaN(userB)) {
      this.showGraphMessage('a와 b 값을 모두 입력해주세요! 😊', 'info');
      return;
    }

    if (userA === this.graphEquation.a && userB === this.graphEquation.b) {
      this.isGraphCorrect = true;
      this.showGraphMessage('정답입니다! 🎉 잘하셨어요!', 'success');
      this.updateGraphEquationDisplay();
      document.getElementById('checkGraphBtn').disabled = true;
      document.getElementById('hintGraphBtn').disabled = true;
    } else {
      this.showGraphMessage('아직 정답이 아니에요. 힌트를 확인해보세요! 💪', 'error');
      this.graphHint = null;
    }
  }

  // 그래프 힌트 제공
  async getGraphHint() {
    const inputA = document.getElementById('inputA');
    const inputB = document.getElementById('inputB');
    
    const userA = parseInt(inputA.value) || 0;
    const userB = parseInt(inputB.value) || 0;

    let apiKey = this.apiKey || import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_api_key_here') {
      const hintArea = document.getElementById('graphHintArea');
      hintArea.innerHTML = `
        <div class="hint-box error">
          <h3>⚠️ API Key 오류</h3>
          <p>API Key가 설정되지 않았습니다.</p>
        </div>
      `;
      return;
    }

    const hintArea = document.getElementById('graphHintArea');
    hintArea.innerHTML = '<p>힌트를 생각하고 있어요... 🤔</p>';

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: '당신은 친절하고 따뜻한 수학 선생님입니다. 학생들이 수학을 좋아하도록 격려하고, 쉽고 이해하기 쉬운 힌트를 제공합니다.'
            },
            {
              role: 'user',
              content: `학생이 그래프를 보고 y = ax + b 방정식을 찾아야 합니다.
                        정답은 y = ${this.graphEquation.a}x + ${this.graphEquation.b}입니다.
                        학생이 입력한 값은 a = ${userA}, b = ${userB}입니다.
                        
                        힌트에는 다음 내용을 포함해주세요:
                        1. 그래프의 기울기를 찾는 방법 (y절편에서 얼마나 올라가거나 내려가는지)
                        2. y절편을 찾는 방법 (y축과 만나는 점)
                        3. 구체적인 예시: 그래프가 지나는 정수 좌표를 찾아서 계산하는 방법
                        
                        중요: 
                        - 인사말이나 불필요한 서두 없이 바로 핵심 힌트 내용부터 시작해주세요.
                        - 수식을 작성할 때 LaTeX 표기법을 사용하지 말고 일반 텍스트로 작성해주세요.
                        - 마크다운이나 특수 기호 없이 읽기 쉬운 일반 텍스트로 작성해주세요.
                        - 격려의 말은 마지막에 간단히 한 문장으로만 추가해주세요.
                        
                        한국어로 답변해주세요.`
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error('API 요청 실패');
      }

      const data = await response.json();
      const hint = data.choices[0].message.content;
      this.graphHint = hint;
      
      const formattedHint = hint
        .replace(/\n\n+/g, '\n\n')
        .replace(/\n/g, '<br>');
      
      hintArea.innerHTML = `
        <div class="hint-box right-hint-box">
          <h3>💡 힌트</h3>
          <p>${formattedHint}</p>
        </div>
      `;
    } catch (error) {
      console.error('Error:', error);
      hintArea.innerHTML = `
        <div class="hint-box error">
          <h3>⚠️ 오류</h3>
          <p>힌트를 가져오는 중 오류가 발생했습니다.</p>
        </div>
      `;
    }
  }

  // 그래프 리셋
  resetGraph() {
    this.isGraphCorrect = false;
    this.graphHint = null;
    this.generateGraphEquation();
    this.drawGraphGrid();
    this.updateGraphEquationDisplay();
    this.renderGraphNumberLabels();
    document.getElementById('inputA').value = '';
    document.getElementById('inputB').value = '';
    document.getElementById('graphHintArea').innerHTML = '';
    document.getElementById('checkGraphBtn').disabled = false;
    document.getElementById('hintGraphBtn').disabled = false;
    this.showGraphMessage('', '');
  }

  // 그래프 메시지 표시
  showGraphMessage(message, type) {
    const messageArea = document.getElementById('graphMessageArea');
    if (!message) {
      messageArea.innerHTML = '';
      messageArea.className = '';
      return;
    }

    messageArea.textContent = message;
    messageArea.className = `message ${type}`;
    
    if (type === 'success') {
      setTimeout(() => {
        messageArea.innerHTML = '';
        messageArea.className = '';
      }, 5000);
    }
  }
}

export default LinearEquationApp;


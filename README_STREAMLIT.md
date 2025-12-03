# 직선의 방정식 학습 앱 (Streamlit 버전)

직선의 방정식을 학습할 수 있는 교육용 웹 애플리케이션입니다.

## 기능

### 왼쪽 패널: 방정식 그리기
- 주어진 방정식을 보고 좌표평면에 직선을 그립니다
- 두 점을 선택하여 직선을 그립니다
- 정답 확인 기능
- OpenAI를 활용한 힌트 제공

### 오른쪽 패널: 그래프로 방정식 찾기
- 주어진 그래프를 보고 방정식을 찾습니다
- 기울기(a)와 y절편(b)을 입력합니다
- 정답 확인 기능
- OpenAI를 활용한 힌트 제공

## 설치 및 실행

### 1. 필요한 패키지 설치

```bash
pip install -r requirements.txt
```

### 2. 환경 변수 설정

OpenAI API 키를 설정해야 힌트 기능을 사용할 수 있습니다.

#### 방법 1: Streamlit Secrets 사용 (권장 - 로컬 개발)

`.streamlit/secrets.toml` 파일을 생성하고 다음 내용을 추가:

```toml
OPENAI_API_KEY = "your_api_key_here"
```

#### 방법 2: 환경 변수 사용

```bash
export OPENAI_API_KEY="your_api_key_here"
```

Windows PowerShell:
```powershell
$env:OPENAI_API_KEY="your_api_key_here"
```

### 3. 앱 실행

```bash
streamlit run app.py
```

브라우저에서 자동으로 열리며, 기본 주소는 `http://localhost:8501`입니다.

## Streamlit Cloud 배포

1. GitHub에 이 저장소를 푸시합니다
2. [Streamlit Cloud](https://streamlit.io/cloud)에 로그인합니다
3. "New app"을 클릭합니다
4. 저장소를 선택하고 메인 파일 경로를 `app.py`로 설정합니다
5. Secrets 탭에서 다음을 추가:
   - Key: `OPENAI_API_KEY`
   - Value: 실제 API 키
6. Deploy를 클릭합니다

## 파일 구조

```
.
├── app.py                    # Streamlit 메인 애플리케이션
├── requirements.txt          # Python 패키지 의존성
├── .streamlit/
│   ├── config.toml          # Streamlit 설정
│   └── secrets.toml.example # Secrets 예시 파일
└── README_STREAMLIT.md      # 이 파일
```

## 사용 기술

- **Streamlit**: 웹 애플리케이션 프레임워크
- **Plotly**: 그래프 시각화
- **NumPy**: 수치 계산
- **OpenAI API**: AI 기반 힌트 제공

## 주의사항

- `.env` 파일은 Git에 포함되지 않습니다 (`.gitignore`에 포함됨)
- Streamlit Cloud에 배포할 때는 Secrets를 통해 API 키를 설정해야 합니다
- 로컬 개발 시에는 `.streamlit/secrets.toml` 파일을 사용하는 것을 권장합니다

## 라이선스

MIT License


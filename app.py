import streamlit as st
import plotly.graph_objects as go
import numpy as np
import random
import os
from openai import OpenAI

# 페이지 설정
st.set_page_config(
    page_title="직선의 방정식 학습",
    page_icon="📐",
    layout="wide"
)

# 커스텀 CSS
st.markdown("""
<style>
    .main {
        background: linear-gradient(135deg, #FFF9F0 0%, #FFE4E1 100%);
    }
    .equation-box {
        background: linear-gradient(135deg, #FFB6C1, #FFE4E1);
        border-radius: 15px;
        padding: 20px;
        text-align: center;
        margin-bottom: 20px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    .right-equation-box {
        background: linear-gradient(135deg, #B6E5FF, #E1F4FF);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    .equation-text {
        color: #2C3E50 !important;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.8), -1px -1px 2px rgba(0, 0, 0, 0.3);
        background: rgba(255, 255, 255, 0.7);
        padding: 10px 20px;
        border-radius: 10px;
        display: inline-block;
        margin: 10px 0;
    }
    .stButton>button {
        border-radius: 25px;
        padding: 10px 30px;
        font-weight: 600;
    }
    .hint-box {
        background: linear-gradient(135deg, #FFFACD, #FFE4B5);
        border-left: 5px solid #FFD700;
        border-radius: 10px;
        padding: 20px;
        margin-top: 20px;
    }
    .right-hint-box {
        background: linear-gradient(135deg, #E1F5FE, #B3E5FC);
        border-left: 5px solid #4FC3F7;
    }
</style>
""", unsafe_allow_html=True)

# 세션 상태 초기화
if 'left_equation' not in st.session_state:
    a = random.randint(-3, 3)
    b = random.randint(-5, 5)
    if a == 0 and b == 0:
        b = random.randint(1, 10)
    st.session_state.left_equation = {'a': a, 'b': b}
    st.session_state.left_points = []
    st.session_state.left_correct = False
    st.session_state.left_hint = None
    st.session_state.left_message = None
    st.session_state.left_message_type = None

if 'right_equation' not in st.session_state:
    a = random.randint(-3, 3)
    b = random.randint(-5, 5)
    if a == 0 and b == 0:
        b = random.randint(1, 10)
    st.session_state.right_equation = {'a': a, 'b': b}
    st.session_state.right_user_a = None
    st.session_state.right_user_b = None
    st.session_state.right_correct = False
    st.session_state.right_hint = None
    st.session_state.right_message = None
    st.session_state.right_message_type = None

# 방정식 표시 함수
def format_equation(a, b):
    if a == 0:
        return f"y = {b}"
    elif b == 0:
        if a == 1:
            return "y = x"
        elif a == -1:
            return "y = -x"
        else:
            return f"y = {a}x"
    else:
        sign = '+' if b >= 0 else ''
        a_display = 'x' if a == 1 else ('-x' if a == -1 else f"{a}x")
        return f"y = {a_display} {sign}{b}"

# 좌표평면 그래프 생성 함수 (왼쪽 패널 - 사용자가 점 찍기)
def create_coordinate_plot(points=None, correct_line=None, show_correct=False):
    fig = go.Figure()
    
    # 그리드 배경
    for i in range(-6, 7):
        if i != 0:
            # 세로선
            fig.add_trace(go.Scatter(
                x=[i, i], y=[-6, 6],
                mode='lines',
                line=dict(color='#E8E0D6', width=1, dash='dot'),
                showlegend=False,
                hoverinfo='skip'
            ))
            # 가로선
            fig.add_trace(go.Scatter(
                x=[-6, 6], y=[i, i],
                mode='lines',
                line=dict(color='#E8E0D6', width=1, dash='dot'),
                showlegend=False,
                hoverinfo='skip'
            ))
    
    # 축 그리기
    fig.add_trace(go.Scatter(
        x=[-6, 6], y=[0, 0],
        mode='lines',
        line=dict(color='#8B7355', width=2),
        showlegend=False,
        hoverinfo='skip'
    ))
    fig.add_trace(go.Scatter(
        x=[0, 0], y=[-6, 6],
        mode='lines',
        line=dict(color='#8B7355', width=2),
        showlegend=False,
        hoverinfo='skip'
    ))
    
    # 클릭 가능한 격자점 추가는 제거 (Plotly 클릭 이벤트로 처리)
    
    # 사용자가 그린 직선
    if points and len(points) == 2:
        x_vals = np.linspace(-6, 6, 100)
        p1, p2 = points
        if abs(p2['x'] - p1['x']) > 0.001:
            a_user = (p2['y'] - p1['y']) / (p2['x'] - p1['x'])
            b_user = p1['y'] - a_user * p1['x']
            y_vals = a_user * x_vals + b_user
            fig.add_trace(go.Scatter(
                x=x_vals, y=y_vals,
                mode='lines',
                line=dict(color='#FF6B9D', width=3),
                name='그린 직선',
                hoverinfo='skip'
            ))
        
        # 점 표시
        for p in points:
            fig.add_trace(go.Scatter(
                x=[p['x']], y=[p['y']],
                mode='markers',
                marker=dict(color='#FF6B9D', size=10),
                showlegend=False,
                hoverinfo='skip'
            ))
    
    # 정답 직선 (정답을 맞췄을 때만)
    if show_correct and correct_line:
        a, b = correct_line['a'], correct_line['b']
        x_vals = np.linspace(-6, 6, 100)
        y_vals = a * x_vals + b
        fig.add_trace(go.Scatter(
            x=x_vals, y=y_vals,
            mode='lines',
            line=dict(color='#4CAF50', width=2, dash='dash'),
            name='정답',
            hoverinfo='skip'
        ))
    
    fig.update_layout(
        xaxis=dict(
            range=[-6.5, 6.5],
            showgrid=False,
            zeroline=False,
            tickmode='linear',
            tick0=-6,
            dtick=1,
            title='x'
        ),
        yaxis=dict(
            range=[-6.5, 6.5],
            showgrid=False,
            zeroline=False,
            tickmode='linear',
            tick0=-6,
            dtick=1,
            title='y'
        ),
        plot_bgcolor='#FFF9F0',
        width=500,
        height=500,
        margin=dict(l=50, r=50, t=50, b=50),
        hovermode='closest'
    )
    
    return fig

# 그래프 표시 함수 (오른쪽 패널 - 정답 직선 보여주기)
def create_graph_plot(equation):
    fig = go.Figure()
    
    # 그리드 배경
    for i in range(-6, 7):
        if i != 0:
            fig.add_trace(go.Scatter(
                x=[i, i], y=[-6, 6],
                mode='lines',
                line=dict(color='#E8E0D6', width=1, dash='dot'),
                showlegend=False,
                hoverinfo='skip'
            ))
            fig.add_trace(go.Scatter(
                x=[-6, 6], y=[i, i],
                mode='lines',
                line=dict(color='#E8E0D6', width=1, dash='dot'),
                showlegend=False,
                hoverinfo='skip'
            ))
    
    # 축 그리기
    fig.add_trace(go.Scatter(
        x=[-6, 6], y=[0, 0],
        mode='lines',
        line=dict(color='#8B7355', width=2),
        showlegend=False,
        hoverinfo='skip'
    ))
    fig.add_trace(go.Scatter(
        x=[0, 0], y=[-6, 6],
        mode='lines',
        line=dict(color='#8B7355', width=2),
        showlegend=False,
        hoverinfo='skip'
    ))
    
    # 정답 직선
    a, b = equation['a'], equation['b']
    x_vals = np.linspace(-6, 6, 100)
    y_vals = a * x_vals + b
    fig.add_trace(go.Scatter(
        x=x_vals, y=y_vals,
        mode='lines',
        line=dict(color='#6BB3FF', width=3),
        name='그래프',
        hoverinfo='skip'
    ))
    
    fig.update_layout(
        xaxis=dict(
            range=[-6.5, 6.5],
            showgrid=False,
            zeroline=False,
            tickmode='linear',
            tick0=-6,
            dtick=1,
            title='x'
        ),
        yaxis=dict(
            range=[-6.5, 6.5],
            showgrid=False,
            zeroline=False,
            tickmode='linear',
            tick0=-6,
            dtick=1,
            title='y'
        ),
        plot_bgcolor='#FFF9F0',
        width=500,
        height=500,
        margin=dict(l=50, r=50, t=50, b=50),
        hovermode=False
    )
    
    return fig

# 정답 확인 함수 (왼쪽)
def check_left_answer(points, equation):
    if len(points) != 2:
        return False, None, "두 개의 점을 찍어주세요! 😊"
    
    p1, p2 = points
    dx = p2['x'] - p1['x']
    
    if abs(dx) < 0.001:
        return False, None, "직선을 그려주세요! 😊"
    
    a_user = (p2['y'] - p1['y']) / dx
    b_user = p1['y'] - a_user * p1['x']
    
    tolerance = 0.2
    a_diff = abs(a_user - equation['a'])
    b_diff = abs(b_user - equation['b'])
    
    if a_diff <= tolerance and b_diff <= tolerance:
        return True, {'a': a_user, 'b': b_user}, "정답입니다! 🎉 잘하셨어요!"
    else:
        return False, {'a': a_user, 'b': b_user}, "아직 정답이 아니에요. 힌트를 확인해보세요! 💪"

# OpenAI 힌트 함수
def get_hint_from_openai(equation, user_points=None, is_graph=False):
    # Streamlit Secrets에서 API 키 가져오기
    api_key = st.secrets.get("OPENAI_API_KEY", None)
    
    # Secrets에 없으면 환경 변수에서 가져오기
    if not api_key:
        api_key = os.environ.get("OPENAI_API_KEY")
    
    if not api_key:
        return "⚠️ API Key가 설정되지 않았습니다. Streamlit Secrets에 OPENAI_API_KEY를 설정해주세요."
    
    try:
        client = OpenAI(api_key=api_key)
        
        if is_graph:
            user_a = st.session_state.get('right_user_a', 0)
            user_b = st.session_state.get('right_user_b', 0)
            prompt = f"""학생이 그래프를 보고 y = ax + b 방정식을 찾아야 합니다.
정답은 y = {equation['a']}x + {equation['b']}입니다.
학생이 입력한 값은 a = {user_a}, b = {user_b}입니다.

힌트에는 다음 내용을 포함해주세요:
1. 그래프의 기울기를 찾는 방법 (y절편에서 얼마나 올라가거나 내려가는지)
2. y절편을 찾는 방법 (y축과 만나는 점)
3. 구체적인 예시: 그래프가 지나는 정수 좌표를 찾아서 계산하는 방법

중요: 
- 인사말이나 불필요한 서두 없이 바로 핵심 힌트 내용부터 시작해주세요.
- 수식을 작성할 때 LaTeX 표기법을 사용하지 말고 일반 텍스트로 작성해주세요.
- 마크다운이나 특수 기호 없이 읽기 쉬운 일반 텍스트로 작성해주세요.
- 격려의 말은 마지막에 간단히 한 문장으로만 추가해주세요.

한국어로 답변해주세요."""
        else:
            prompt = f"""학생이 y = {equation['a']}x + {equation['b']} 방정식을 그려야 하는데 아직 정답이 아닙니다.
학생이 그린 그래프의 방정식을 자세히 언급하지 말고, 
정답 방정식(y = {equation['a']}x + {equation['b']})을 그리는 방법에 대한 힌트를 친절하고 따뜻하게 주세요.

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

한국어로 답변해주세요."""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "당신은 친절하고 따뜻한 수학 선생님입니다. 학생들이 수학을 좋아하도록 격려하고, 쉽고 이해하기 쉬운 힌트를 제공합니다."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        return response.choices[0].message.content
    except Exception as e:
        return f"⚠️ 힌트를 가져오는 중 오류가 발생했습니다: {str(e)}"

# 메인 UI
st.title("📐 직선의 방정식 학습")
st.markdown("**왼쪽: 방정식 그리기 | 오른쪽: 그래프로 방정식 찾기**")

col1, col2 = st.columns(2)

# 왼쪽 패널
with col1:
    st.markdown('<div class="equation-box">', unsafe_allow_html=True)
    st.markdown("### 그려야 할 방정식")
    eq_text = format_equation(st.session_state.left_equation['a'], st.session_state.left_equation['b'])
    st.markdown(f"<div class='equation-text' style='text-align: center;'><h2 style='margin: 0;'>{eq_text}</h2></div>", unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)
    
    # 그래프 표시
    points = st.session_state.left_points if len(st.session_state.left_points) > 0 else None
    show_correct = st.session_state.left_correct
    fig_left = create_coordinate_plot(
        points=points,
        correct_line=st.session_state.left_equation,
        show_correct=show_correct,
    )
    
    # 그래프 표시 (모드바 제거)
    config = {
        'displayModeBar': False,  # 모드바 완전히 숨김
        'displaylogo': False
    }
    st.plotly_chart(
        fig_left, 
        use_container_width=True, 
        config=config
    )
    
    # 좌표 입력 안내
    if not st.session_state.left_correct:
        if len(st.session_state.left_points) == 0:
            st.info("💡 **아래에서 정수 좌표를 입력**하여 두 개의 점을 찍어주세요!")
        elif len(st.session_state.left_points) == 1:
            st.info("💡 **아래에서 정수 좌표를 입력**하여 점 하나 더 추가해주세요!")
    
    # 좌표 입력
    st.markdown("### 정수 좌표 입력")
    
    # 점 정보 표시 및 입력
    if len(st.session_state.left_points) == 0:
        st.info("좌표평면에 정수 좌표로 두 개의 점을 입력해주세요! (x, y는 -6부터 6까지의 정수)")
        col_x, col_y = st.columns(2)
        with col_x:
            x = st.number_input("x 좌표", value=0, min_value=-6, max_value=6, step=1, key="left_x")
        with col_y:
            y = st.number_input("y 좌표", value=0, min_value=-6, max_value=6, step=1, key="left_y")
        
        if st.button("점 1 추가하기", key="add_point1_left", use_container_width=True):
            point = {'x': int(x), 'y': int(y)}
            st.session_state.left_points.append(point)
            st.rerun()
    elif len(st.session_state.left_points) == 1:
        p = st.session_state.left_points[0]
        st.info(f"✅ 점 1: ({p['x']}, {p['y']}) - 정수 좌표로 점 하나 더 입력해주세요!")
        col_x, col_y = st.columns(2)
        with col_x:
            x = st.number_input("x 좌표", value=0, min_value=-6, max_value=6, step=1, key="left_x2")
        with col_y:
            y = st.number_input("y 좌표", value=0, min_value=-6, max_value=6, step=1, key="left_y2")
        
        if st.button("점 2 추가하기", key="add_point2_left", use_container_width=True):
            point = {'x': int(x), 'y': int(y)}
            st.session_state.left_points.append(point)
            st.rerun()
    else:
        p1, p2 = st.session_state.left_points
        st.success(f"✅ 점 1: ({p1['x']}, {p1['y']}), 점 2: ({p2['x']}, {p2['y']}) - 이제 정답 확인 버튼을 눌러주세요!")
    
    # 메시지 표시
    if st.session_state.left_message:
        if st.session_state.left_message_type == 'success':
            st.success(st.session_state.left_message)
        elif st.session_state.left_message_type == 'error':
            st.error(st.session_state.left_message)
        elif st.session_state.left_message_type == 'info':
            st.info(st.session_state.left_message)
    
    # 버튼들
    col_btn1, col_btn2, col_btn3 = st.columns(3)
    
    with col_btn1:
        check_disabled = st.session_state.left_correct or len(st.session_state.left_points) != 2
        if st.button("✓ 정답 확인", disabled=check_disabled, key="check_left"):
            is_correct, user_eq, message = check_left_answer(
                st.session_state.left_points,
                st.session_state.left_equation
            )
            st.session_state.left_correct = is_correct
            st.session_state.left_message = message
            st.session_state.left_message_type = 'success' if is_correct else 'error'
            st.rerun()
    
    with col_btn2:
        hint_disabled = st.session_state.left_correct or len(st.session_state.left_points) != 2
        if st.button("💡 힌트 보기", disabled=hint_disabled, key="hint_left"):
            hint = get_hint_from_openai(st.session_state.left_equation)
            st.session_state.left_hint = hint
            st.rerun()
    
    with col_btn3:
        if st.button("🔄 다시 시작", key="reset_left"):
            a = random.randint(-3, 3)
            b = random.randint(-5, 5)
            if a == 0 and b == 0:
                b = random.randint(1, 10)
            st.session_state.left_equation = {'a': a, 'b': b}
            st.session_state.left_points = []
            st.session_state.left_correct = False
            st.session_state.left_hint = None
            st.session_state.left_message = None
            st.session_state.left_message_type = None
            st.rerun()
    
    # 힌트 표시
    if st.session_state.left_hint:
        st.markdown('<div class="hint-box">', unsafe_allow_html=True)
        st.markdown("### 💡 힌트")
        st.markdown(st.session_state.left_hint)
        st.markdown('</div>', unsafe_allow_html=True)

# 오른쪽 패널
with col2:
    st.markdown('<div class="equation-box right-equation-box">', unsafe_allow_html=True)
    st.markdown("### 그래프의 방정식 찾기")
    if st.session_state.right_correct:
        eq_text = format_equation(st.session_state.right_equation['a'], st.session_state.right_equation['b'])
    else:
        eq_text = "y = ax + b"
    st.markdown(f"<div class='equation-text' style='text-align: center;'><h2 style='margin: 0;'>{eq_text}</h2></div>", unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)
    
    # 그래프 표시 (모드바 제거)
    fig_right = create_graph_plot(st.session_state.right_equation)
    config = {
        'displayModeBar': False,  # 모드바 완전히 숨김
        'displaylogo': False
    }
    st.plotly_chart(fig_right, use_container_width=True, config=config)
    st.info("그래프를 보고 방정식을 찾아보세요!")
    
    # 입력
    st.markdown("### 방정식 입력")
    col_a, col_b = st.columns(2)
    with col_a:
        user_a = st.number_input("기울기 a =", value=0, min_value=-10, max_value=10, key="input_a")
    with col_b:
        user_b = st.number_input("y절편 b =", value=0, min_value=-10, max_value=10, key="input_b")
    
    # 메시지 표시
    if st.session_state.right_message:
        if st.session_state.right_message_type == 'success':
            st.success(st.session_state.right_message)
        elif st.session_state.right_message_type == 'error':
            st.error(st.session_state.right_message)
        elif st.session_state.right_message_type == 'info':
            st.info(st.session_state.right_message)
    
    # 버튼들
    col_btn4, col_btn5, col_btn6 = st.columns(3)
    
    with col_btn4:
        if st.button("✓ 정답 확인", disabled=st.session_state.right_correct, key="check_right"):
            if user_a == st.session_state.right_equation['a'] and user_b == st.session_state.right_equation['b']:
                st.session_state.right_correct = True
                st.session_state.right_user_a = user_a
                st.session_state.right_user_b = user_b
                st.session_state.right_message = "정답입니다! 🎉 잘하셨어요!"
                st.session_state.right_message_type = 'success'
            else:
                st.session_state.right_user_a = user_a
                st.session_state.right_user_b = user_b
                st.session_state.right_message = "아직 정답이 아니에요. 힌트를 확인해보세요! 💪"
                st.session_state.right_message_type = 'error'
            st.rerun()
    
    with col_btn5:
        if st.button("💡 힌트 보기", disabled=st.session_state.right_correct, key="hint_right"):
            hint = get_hint_from_openai(st.session_state.right_equation, is_graph=True)
            st.session_state.right_hint = hint
            st.rerun()
    
    with col_btn6:
        if st.button("🔄 다시 시작", key="reset_right"):
            a = random.randint(-3, 3)
            b = random.randint(-5, 5)
            if a == 0 and b == 0:
                b = random.randint(1, 10)
            st.session_state.right_equation = {'a': a, 'b': b}
            st.session_state.right_user_a = None
            st.session_state.right_user_b = None
            st.session_state.right_correct = False
            st.session_state.right_hint = None
            st.session_state.right_message = None
            st.session_state.right_message_type = None
            st.rerun()
    
    # 힌트 표시
    if st.session_state.right_hint:
        st.markdown('<div class="hint-box right-hint-box">', unsafe_allow_html=True)
        st.markdown("### 💡 힌트")
        st.markdown(st.session_state.right_hint)
        st.markdown('</div>', unsafe_allow_html=True)

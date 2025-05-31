from flask import Flask, render_template, request, jsonify
import sys
import io
import traceback

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run_code', methods=['POST'])
def run_code():
    """
    클라이언트에서 받은 JSON { "code": "<파이썬 코드 문자열>" } 을
    exec()로 실행해서 stdout을 캡처한 뒤, JSON 형태로 반환함.
    """
    data = request.get_json()
    code = data.get('code', '')

    # stdout, stderr 캡처를 위해 IO 객체를 생성
    stdout_buffer = io.StringIO()
    stderr_buffer = io.StringIO()

    # 기존 stdout, stderr 백업
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    try:
        # stdout, stderr을 해당 버퍼로 변경
        sys.stdout = stdout_buffer
        sys.stderr = stderr_buffer

        # exec 환경(글로벌/로컬) 정의
        exec_globals = {}
        exec_locals = {}

        try:
            # 안전성을 위해 __builtins__은 그대로 두되, 필요한 경우 제약 추가 가능
            exec(code, exec_globals, exec_locals)
        except Exception:
            # exec 중에 에러가 발생하면 traceback을 stderr에 기록
            traceback.print_exc(file=stderr_buffer)

    finally:
        # 원래 stdout, stderr 복원
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    # 캡처된 stdout/ stderr 값을 가져옴
    std_output = stdout_buffer.getvalue()
    std_error = stderr_buffer.getvalue()

    # stdout을 줄 단위로 분리
    output_lines = [line for line in std_output.splitlines()]

    return jsonify({
        'output': output_lines,
        'error': std_error
    })

if __name__ == '__main__':
    # 호스트를 0.0.0.0으로 지정하여 외부(로컬 네트워크 혹은 라우터 설정 시 인터넷)에서도 접속 가능하도록 함
    app.run(host="0.0.0.0", port=5000, debug=True)

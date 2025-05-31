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
    if not data or 'code' not in data:
        return jsonify({'error': '올바른 요청이 아닙니다.'}), 400

    user_code = data['code']

    # stdout/stderr을 가로채기 위한 버퍼 생성
    stdout_buffer = io.StringIO()
    stderr_buffer = io.StringIO()

    original_stdout = sys.stdout
    original_stderr = sys.stderr
    try:
        sys.stdout = stdout_buffer
        sys.stderr = stderr_buffer

        # 별도의 네임스페이스로 실행
        exec_globals = {}
        exec_locals = {}
        exec(user_code, exec_globals, exec_locals)

    except Exception:
        # 예외 발생 시 stderr_buffer에 traceback 기록
        traceback.print_exc(file=stderr_buffer)
    finally:
        # 원래 stdout/stderr로 복구
        sys.stdout = original_stdout
        sys.stderr = original_stderr

    std_output = stdout_buffer.getvalue()
    std_error = stderr_buffer.getvalue()

    # stdout을 줄 단위로 분리
    output_lines = [line for line in std_output.splitlines()]

    return jsonify({
        'output': output_lines,
        'error': std_error
    })

if __name__ == '__main__':
    app.run(debug=True)

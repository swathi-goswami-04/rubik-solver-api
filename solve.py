import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import kociemba

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def solve_cube():
    try:
        data = request.get_json()
        cube_string = data.get('cube_string', '')

        if not cube_string or len(cube_string) != 54:
            return jsonify({'error': 'cube_string must be exactly 54 characters long'}), 400

        solution = kociemba.solve(cube_string)
        return jsonify({
            'solution': solution.split(),
            'solved': True,
            'move_count': len(solution.split())
        })

    except Exception as e:
        return jsonify({'error': str(e), 'solved': False}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))  # Default to 5000 if $PORT not found
    app.run(debug=True, host='0.0.0.0', port=port)



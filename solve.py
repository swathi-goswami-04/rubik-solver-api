from flask import Flask, request, jsonify
from rubik_solver import utils
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS so your JS frontend can talk to it

@app.route('/solve', methods=['POST'])
def solve_cube():
    try:
        data = request.get_json()
        cube_string = data.get('cubeString', '')
        if not cube_string or len(cube_string) != 54:
            return jsonify({'error': 'Invalid cube string'}), 400

        solution = utils.solve(cube_string, 'Kociemba')
        return jsonify({'solution': solution})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

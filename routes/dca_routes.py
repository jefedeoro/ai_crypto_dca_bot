# routes/dca_routes.py
from flask import Blueprint, render_template, request, jsonify
import json

# Blueprint named 'dca' for cleaner endpoint naming
dca_bp = Blueprint('dca', __name__)

@dca_bp.route('/dca')
def dca():
    return render_template('dca.html')

@dca_bp.route('/api/dca/simulate', methods=['POST'])
def simulate_dca():
    """
    Simulate Dollar Cost Averaging based on user inputs.
    Expects JSON data with:
    - initial_investment: float
    - monthly_investment: float
    - annual_return: float (percentage)
    - years: int
    """
    data = request.get_json()
    try:
        initial_investment = float(data.get('initial_investment', 0))
        monthly_investment = float(data.get('monthly_investment', 0))
        annual_return = float(data.get('annual_return', 0)) / 100  # Convert to decimal
        years = int(data.get('years', 1))

        total_months = years * 12
        monthly_return = annual_return / 12

        balance = initial_investment
        investment_history = []

        for month in range(1, total_months + 1):
            balance += monthly_investment
            balance *= (1 + monthly_return)
            investment_history.append({
                'month': month,
                'balance': round(balance, 2)
            })

        response = {
            'status': 'success',
            'investment_history': investment_history
        }
        return jsonify(response)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

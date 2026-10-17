"""
Response utility helpers for consistent JSON API responses.
"""
from flask import jsonify


def success_response(data=None, message: str = "Success", status_code: int = 200):
    """Return a standardised success JSON response."""
    payload = {"success": True, "message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status_code


def error_response(message: str = "An error occurred", status_code: int = 400):
    """Return a standardised error JSON response."""
    return jsonify({"success": False, "message": message}), status_code

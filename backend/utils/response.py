from flask import jsonify


def success_response(data=None, message="", status=200):
    """Trả về response thành công chuẩn hóa."""
    body = {}
    if message:
        body["message"] = message
    if data is not None:
        if isinstance(data, (list, dict)):
            if isinstance(data, list):
                return jsonify(data), status
            body.update(data)
        else:
            body["data"] = data
    return jsonify(body), status


def error_response(message, status=400):
    """Trả về response lỗi chuẩn hóa."""
    return jsonify({"error": message}), status

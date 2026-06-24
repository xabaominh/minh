from flask import Blueprint, request, session, jsonify
from middleware.auth_middleware import login_required, role_required
from services.chat_service import (
    get_or_create_conversation,
    get_customer_messages,
    send_customer_message,
    get_customer_unread_count,
    get_admin_conversations,
    get_admin_conversation_detail,
    send_admin_message,
    update_conversation_status,
    get_admin_unread_count,
)

chat_bp = Blueprint('chat', __name__)


@chat_bp.route('/api/chat', methods=['GET'])
@login_required
def customer_chat():
    conv, messages, error = get_or_create_conversation(session['user_id'])
    if error:
        return jsonify({"error": error}), 500
    unread, _ = get_customer_unread_count(session['user_id'])
    return jsonify({"conversation": conv, "messages": messages, "unread_count": unread}), 200


@chat_bp.route('/api/chat/messages', methods=['GET'])
@login_required
def customer_poll_messages():
    since_id = request.args.get('since_id', type=int)
    messages, unread, error = get_customer_messages(session['user_id'], since_id=since_id)
    if error:
        return jsonify({"error": error}), 500
    return jsonify({"messages": messages, "unread_count": unread}), 200


@chat_bp.route('/api/chat/messages', methods=['POST'])
@login_required
def customer_send_message():
    data = request.get_json(silent=True) or {}
    message, error, status = send_customer_message(session['user_id'], data.get('body'))
    if error:
        return jsonify({"error": error}), status
    return jsonify({"message": "Đã gửi", "data": message}), status


@chat_bp.route('/api/chat/unread', methods=['GET'])
@login_required
def customer_unread():
    count, error = get_customer_unread_count(session['user_id'])
    if error:
        return jsonify({"error": error}), 500
    return jsonify({"unread_count": count}), 200


@chat_bp.route('/api/admin/chat/conversations', methods=['GET'])
@role_required('ADMIN', 'MANAGER')
def admin_list_conversations():
    status = request.args.get('status')
    conversations, error = get_admin_conversations(status=status)
    if error:
        return jsonify({"error": error}), 500
    return jsonify(conversations), 200


@chat_bp.route('/api/admin/chat/conversations/<int:conversation_id>', methods=['GET'])
@role_required('ADMIN', 'MANAGER')
def admin_get_conversation(conversation_id):
    since_id = request.args.get('since_id', type=int)
    conv, messages, error, status = get_admin_conversation_detail(
        conversation_id, session['user_id'], since_id=since_id
    )
    if error:
        return jsonify({"error": error}), status
    return jsonify({"conversation": conv, "messages": messages}), 200


@chat_bp.route('/api/admin/chat/conversations/<int:conversation_id>/messages', methods=['POST'])
@role_required('ADMIN', 'MANAGER')
def admin_send_message(conversation_id):
    data = request.get_json(silent=True) or {}
    message, error, status = send_admin_message(conversation_id, session['user_id'], data.get('body'))
    if error:
        return jsonify({"error": error}), status
    return jsonify({"message": "Đã gửi", "data": message}), status


@chat_bp.route('/api/admin/chat/conversations/<int:conversation_id>/status', methods=['PUT'])
@role_required('ADMIN', 'MANAGER')
def admin_update_status(conversation_id):
    data = request.get_json(silent=True) or {}
    error, status = update_conversation_status(conversation_id, data.get('status'))
    if error:
        return jsonify({"error": error}), status
    return jsonify({"message": "Cập nhật trạng thái thành công"}), status


@chat_bp.route('/api/admin/chat/unread', methods=['GET'])
@role_required('ADMIN', 'MANAGER')
def admin_unread():
    count, error = get_admin_unread_count()
    if error:
        return jsonify({"error": error}), 500
    return jsonify({"unread_count": count}), 200

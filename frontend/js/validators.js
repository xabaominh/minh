// =====================================================
// VALIDATORS — Shared client-side validation
// =====================================================

const VN_PHONE_REGEX = /^0\d{9}$/;

export function isValidVietnamesePhone(phone) {
    const value = (phone || '').trim();
    if (!value) return true;
    return VN_PHONE_REGEX.test(value);
}

export function phoneValidationMessage(phone) {
    if (isValidVietnamesePhone(phone)) return null;
    return 'Số điện thoại phải gồm đúng 10 chữ số, bắt đầu bằng 0 (vd: 0901234567)';
}

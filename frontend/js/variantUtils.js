// =====================================================
// VARIANT UTILS — Chọn kích cỡ, màu, chất liệu
// =====================================================

import { formatPrice, getEffectivePrice } from './priceUtils.js';

export function getVariantUnitPrice(product, variant) {
    const price = variant?.price != null ? Number(variant.price) : Number(product?.price ?? 0);
    const discount = variant?.discount_price != null
        ? Number(variant.discount_price)
        : product?.discount_price;
    return getEffectivePrice({ price, discount_price: discount });
}

export function findVariant(variants, selection) {
    if (!selection?.size || !selection?.color || !selection?.material) return null;
    return variants.find(v =>
        v.size === selection.size &&
        v.color === selection.color &&
        v.material === selection.material
    ) || null;
}

export function getAvailableValues(variants, selection, field) {
    const others = ['size', 'color', 'material'].filter(f => f !== field);
    const filtered = variants.filter(v => {
        return others.every(key => !selection[key] || v[key] === selection[key]);
    });
    return [...new Set(filtered.map(v => v[field]))].sort();
}

export function isOptionAvailable(variants, selection, field, value) {
    const test = { ...selection, [field]: value };
    return variants.some(v =>
        (!test.size || v.size === test.size) &&
        (!test.color || v.color === test.color) &&
        (!test.material || v.material === test.material)
    );
}

export function getDefaultSelection(variants) {
    const inStock = variants.find(v => v.stock_quantity > 0);
    const first = inStock || variants[0];
    if (!first) return { size: '', color: '', material: '' };
    return { size: first.size, color: first.color, material: first.material };
}

export function formatVariantLabel(variant) {
    if (!variant) return '';
    return `${variant.size} · ${variant.color} · ${variant.material}`;
}

export function renderVariantPickers(variants, selection, onChange) {
    const groups = [
        { key: 'size', label: 'Kích cỡ', icon: 'fa-ruler-combined' },
        { key: 'color', label: 'Màu sắc', icon: 'fa-palette' },
        { key: 'material', label: 'Chất liệu', icon: 'fa-layer-group' }
    ];

    return groups.map(group => {
        const values = getAvailableValues(variants, selection, group.key);
        const buttons = values.map(value => {
            const active = selection[group.key] === value ? 'active' : '';
            const disabled = isOptionAvailable(variants, selection, group.key, value) ? '' : 'disabled';
            return `<button type="button" class="variant-option ${active}" data-field="${group.key}" data-value="${value}" ${disabled}>${value}</button>`;
        }).join('');
        return `
            <div class="variant-group">
                <label><i class="fas ${group.icon}"></i> ${group.label}</label>
                <div class="variant-options">${buttons}</div>
            </div>
        `;
    }).join('');
}

export function bindVariantPickers(container, variants, selection, onUpdate) {
    if (!container) return;
    container.querySelectorAll('.variant-option').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;
            const field = btn.dataset.field;
            const value = btn.dataset.value;
            selection[field] = value;
            onUpdate({ ...selection });
        });
    });
}

export function updateVariantSummary(product, variants, selection, elements) {
    const variant = findVariant(variants, selection);
    const { priceEl, stockEl, addBtn, qtyInput } = elements;

    if (priceEl) {
        if (variant) {
            const unit = getVariantUnitPrice(product, variant);
            const base = variant.price != null ? Number(variant.price) : Number(product.price);
            const disc = variant.discount_price != null ? Number(variant.discount_price) : product.discount_price;
            const hasKm = disc != null && Number(disc) > 0 && Number(disc) < base;
            priceEl.classList.toggle('gia-km', hasKm);
            if (hasKm) {
                priceEl.innerHTML = `<span class="gia-goc">${formatPrice(base)}</span> <span class="gia-ban">${formatPrice(unit)}</span>`;
            } else {
                priceEl.textContent = formatPrice(unit);
            }
        } else {
            priceEl.classList.remove('gia-km');
            priceEl.textContent = '—';
        }
    }

    if (stockEl) {
        if (!selection.size || !selection.color || !selection.material) {
            stockEl.innerHTML = '<span style="color:#f39c12">Vui lòng chọn đủ kích cỡ, màu và chất liệu</span>';
        } else if (!variant) {
            stockEl.innerHTML = '<span style="color:#e74c3c">Tổ hợp này không có sẵn</span>';
        } else if (variant.stock_quantity > 0) {
            stockEl.innerHTML = `<span style="color:#27ae60">Còn hàng (${variant.stock_quantity})</span>`;
        } else {
            stockEl.innerHTML = '<span style="color:#e74c3c">Hết hàng</span>';
        }
    }

    const canAdd = variant && variant.stock_quantity > 0;
    if (addBtn) addBtn.disabled = !canAdd;
    if (qtyInput && variant) {
        qtyInput.max = Math.max(variant.stock_quantity, 1);
        if (Number(qtyInput.value) > variant.stock_quantity) {
            qtyInput.value = Math.max(variant.stock_quantity, 1);
        }
    }

    return variant;
}

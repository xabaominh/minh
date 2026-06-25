"""Apply product variants migration on existing database."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db


def run_sql(cursor, sql, ignore_errors=()):
    try:
        cursor.execute(sql)
        return True
    except Exception as e:
        code = e.args[0] if e.args else None
        if code in ignore_errors or any(str(x) in str(e) for x in ignore_errors):
            return False
        raise


def main():
    conn = get_db()
    cursor = conn.cursor()

    run_sql(cursor, """
        CREATE TABLE IF NOT EXISTS product_variants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            sku VARCHAR(80) NOT NULL UNIQUE,
            size VARCHAR(80) NOT NULL,
            color VARCHAR(80) NOT NULL,
            material VARCHAR(120) NOT NULL,
            price DECIMAL(12,2) DEFAULT NULL,
            discount_price DECIMAL(12,2) DEFAULT NULL,
            stock_quantity INT NOT NULL DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            UNIQUE KEY unique_variant_combo (product_id, size, color, material)
        )
    """)

    for col_sql in [
        "ALTER TABLE cart_items ADD COLUMN variant_id INT NULL AFTER product_id",
        "ALTER TABLE order_items ADD COLUMN variant_id INT NULL AFTER product_id",
        "ALTER TABLE order_items ADD COLUMN variant_size VARCHAR(80) NULL AFTER product_name",
        "ALTER TABLE order_items ADD COLUMN variant_color VARCHAR(80) NULL AFTER variant_size",
        "ALTER TABLE order_items ADD COLUMN variant_material VARCHAR(120) NULL AFTER variant_color",
    ]:
        run_sql(cursor, col_sql, ignore_errors=(1060,))

    conn.commit()
    cursor.close()
    conn.close()

    import subprocess
    subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), 'seed_variants.py')], check=True)

    conn = get_db()
    cursor = conn.cursor()

    # Xóa giỏ hàng cũ không có variant (an toàn cho demo)
    cursor.execute("DELETE FROM cart_items WHERE variant_id IS NULL")
    conn.commit()

    try:
        run_sql(cursor, "ALTER TABLE cart_items MODIFY variant_id INT NOT NULL", ignore_errors=())
    except Exception:
        pass

    try:
        run_sql(cursor, "ALTER TABLE cart_items DROP INDEX unique_cart_product", ignore_errors=(1091,))
        run_sql(cursor, """
            ALTER TABLE cart_items
            ADD CONSTRAINT fk_cart_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
        """, ignore_errors=(1826, 1005, 1061))
        run_sql(cursor, "ALTER TABLE cart_items ADD UNIQUE KEY unique_cart_line (cart_id, product_id, variant_id)", ignore_errors=(1061,))
    except Exception as e:
        print('cart constraint note:', e)

    conn.commit()
    cursor.close()
    conn.close()
    print('Variant migration complete')


if __name__ == '__main__':
    main()

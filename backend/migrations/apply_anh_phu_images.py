"""Apply update_anh_phu_images.sql to the configured database."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import get_db

SQL_PATH = os.path.join(os.path.dirname(__file__), 'update_anh_phu_images.sql')


def main():
    with open(SQL_PATH, 'r', encoding='utf-8') as f:
        sql = f.read()

    statements = [s.strip() for s in sql.split(';') if s.strip() and not s.strip().startswith('--')]

    conn = get_db()
    cursor = conn.cursor()
    try:
        for stmt in statements:
            if stmt.upper().startswith('USE '):
                continue
            cursor.execute(stmt)
        conn.commit()
        print('Updated product_images from anh_phu.txt successfully.')

        cursor.execute(
            """
            SELECT p.id, p.product_name, pi.display_order, pi.image_url
            FROM product_images pi
            JOIN products p ON p.id = pi.product_id
            WHERE p.id IN (2, 3, 4, 7, 8, 10, 12, 13, 16, 17)
            ORDER BY p.id, pi.display_order
            """
        )
        for row in cursor.fetchall():
            print(f"  [{row[0]}] {row[1]} #{row[2]}: {row[3][:70]}...")
    except Exception as err:
        conn.rollback()
        print(f'Error: {err}')
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    main()

import sys
import pdfplumber
import pandas as pd


def extract_rows(pdf_path):
    rows = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables() or []
            for table in tables:
                if not table:
                    continue
                for row in table:
                    if not row:
                        continue
                    cleaned = [cell if cell is not None else "" for cell in row]
                    if any(cell.strip() for cell in cleaned if isinstance(cell, str)):
                        rows.append(cleaned)
            if not tables:
                text = page.extract_text() or ""
                for line in text.splitlines():
                    line = line.strip()
                    if line:
                        rows.append([line])
    return rows


def normalize_rows(rows):
    if not rows:
        return [[""]]
    max_cols = max(len(row) for row in rows)
    normalized = []
    for row in rows:
        normalized.append(row + [""] * (max_cols - len(row)))
    return normalized


def main():
    if len(sys.argv) < 3:
        print("Usage: pdf_to_tables.py input.pdf output.(csv|xlsx)")
        sys.exit(1)
    input_path = sys.argv[1]
    output_path = sys.argv[2]

    rows = normalize_rows(extract_rows(input_path))
    df = pd.DataFrame(rows)

    if output_path.lower().endswith(".csv"):
        df.to_csv(output_path, index=False, header=False)
    elif output_path.lower().endswith(".xlsx"):
        df.to_excel(output_path, index=False, header=False)
    else:
        raise ValueError("Unsupported output format")


if __name__ == "__main__":
    main()

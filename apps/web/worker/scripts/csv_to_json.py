import csv
import json
import sys


def main():
    if len(sys.argv) < 3:
        print("Usage: csv_to_json.py input.csv output.json")
        sys.exit(1)
    input_path = sys.argv[1]
    output_path = sys.argv[2]

    with open(input_path, newline="", encoding="utf-8") as infile:
        reader = csv.DictReader(infile)
        rows = list(reader)

    with open(output_path, "w", encoding="utf-8") as outfile:
        json.dump(rows, outfile, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()

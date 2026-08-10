import re

db_ts_path = r"d:\intern\flower\src\server\db.ts"

with open(db_ts_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

filtered_lines = []
for line in lines:
    if re.search(r"^\s*image:\s*'/products/new_plant_\d+\.jpg',\s*$", line):
        continue
    filtered_lines.append(line)

with open(db_ts_path, "w", encoding="utf-8") as f:
    f.writelines(filtered_lines)

print("Removed singular 'image' key from all 80 new product objects in db.ts!")

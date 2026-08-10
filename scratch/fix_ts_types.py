db_ts_path = r"d:\intern\flower\src\server\db.ts"

with open(db_ts_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("sunlight: 'Full Direct Sun (5-6 hours)'", "sunlight: 'Full Sun'")
content = content.replace("waterRequirement: 'Water Daily in Morning'", "waterRequirement: 'Daily'")

with open(db_ts_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed sunlight and waterRequirement string literals in db.ts!")

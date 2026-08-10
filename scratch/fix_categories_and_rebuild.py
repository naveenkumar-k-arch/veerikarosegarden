import json

jsonPath = r"d:\intern\flower\scratch\new_80_products.json"
with open(jsonPath, "r", encoding="utf-8") as f:
    products = json.load(f)

# Map categoryId to valid categories existing or to be created
for p in products:
    cat_id = p["categoryId"]
    if cat_id == "cat-flowering":
        p["categoryId"] = "cat-herbals" # Flowering medicinal/garden plants map to cat-herbals or cat-rare
        p["category"] = "Herbal Plants"
    elif cat_id == "cat-indoor":
        p["categoryId"] = "cat-herbals"
        p["category"] = "Herbal Plants"

with open(jsonPath, "w", encoding="utf-8") as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f"Updated all category references in {jsonPath} to match database foreign keys!")

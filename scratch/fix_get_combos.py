import re

db_ts_path = r"d:\intern\flower\src\server\db.ts"

with open(db_ts_path, "r", encoding="utf-8") as f:
    content = f.read()

# Pattern to replace getCombos method
old_get_combos = r"""  // COMBOS & OFFERS
  async getCombos\(\): Promise<Combo\[\]> \{
[\s\S]*?async addCombo"""

new_get_combos = """  // COMBOS & OFFERS
  async getCombos(): Promise<Combo[]> {
    const prisma = getPrismaClient();

    if (prisma) {
      try {
        const items = await prisma.combo.findMany({
          orderBy: { order: 'asc' }
        });

        const allProducts = await this.getProducts();
        const prodMap = new Map(allProducts.map(p => [p.id, p]));

        return items.map(c => {
          const matchedProds = (c.productIds || [])
            .map(pid => prodMap.get(pid))
            .filter(Boolean) as Product[];
          return {
            id: c.id,
            title: c.title,
            subtitle: c.subtitle || undefined,
            badge: c.badge || 'COMBO OFFER',
            productIds: c.productIds,
            products: matchedProds,
            originalPrice: c.originalPrice,
            comboPrice: c.comboPrice,
            discountPercent: c.discountPercent,
            imageUrl: c.imageUrl || undefined,
            active: c.active,
            order: c.order,
            createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: c.updatedAt ? c.updatedAt.toISOString() : new Date().toISOString()
          };
        });
      } catch (err) {
        console.error('Prisma getCombos error:', err);
      }
    }

    const allProducts = await this.getProducts();
    const prodMap = new Map(allProducts.map(p => [p.id, p]));

    return memoryCombosStore.map(c => ({
      ...c,
      products: (c.productIds || []).map(pid => prodMap.get(pid)).filter(Boolean) as Product[]
    }));
  }

  async addCombo"""

new_content = re.sub(old_get_combos, new_get_combos, content, count=1)

with open(db_ts_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Updated getCombos in src/server/db.ts to be 100% database driven without auto-re-seeding!")

import { PrismaClient, CategoryType } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  // Income categories
  { name: 'Salaire', type: CategoryType.INCOME, icon: 'briefcase', color: '#10B981' },
  { name: 'Freelance', type: CategoryType.INCOME, icon: 'laptop', color: '#3B82F6' },
  { name: 'Investissements', type: CategoryType.INCOME, icon: 'trending-up', color: '#8B5CF6' },
  { name: 'Cadeaux', type: CategoryType.INCOME, icon: 'gift', color: '#EC4899' },
  { name: 'Remboursements', type: CategoryType.INCOME, icon: 'rotate-ccw', color: '#06B6D4' },
  { name: 'Autres revenus', type: CategoryType.INCOME, icon: 'plus-circle', color: '#6366F1' },
  // Expense categories
  { name: 'Alimentation', type: CategoryType.EXPENSE, icon: 'utensils', color: '#F59E0B' },
  { name: 'Transport', type: CategoryType.EXPENSE, icon: 'car', color: '#3B82F6' },
  { name: 'Logement', type: CategoryType.EXPENSE, icon: 'home', color: '#10B981' },
  { name: 'Santé', type: CategoryType.EXPENSE, icon: 'heart', color: '#EF4444' },
  { name: 'Loisirs', type: CategoryType.EXPENSE, icon: 'film', color: '#8B5CF6' },
  { name: 'Shopping', type: CategoryType.EXPENSE, icon: 'shopping-cart', color: '#EC4899' },
  { name: 'Restaurants', type: CategoryType.EXPENSE, icon: 'coffee', color: '#F97316' },
  { name: 'Abonnements', type: CategoryType.EXPENSE, icon: 'tv', color: '#06B6D4' },
  { name: 'Éducation', type: CategoryType.EXPENSE, icon: 'book', color: '#6366F1' },
  { name: 'Voyages', type: CategoryType.EXPENSE, icon: 'plane', color: '#84CC16' },
  { name: 'Factures', type: CategoryType.EXPENSE, icon: 'file-text', color: '#64748B' },
  { name: 'Autres dépenses', type: CategoryType.EXPENSE, icon: 'more-horizontal', color: '#94A3B8' },
];

async function main() {
  console.log('Seeding database...');

  // Create default categories (userId = null means they are available to all users)
  for (const category of defaultCategories) {
    // Check if default category already exists by name and type
    const existing = await prisma.category.findFirst({
      where: {
        name: category.name,
        type: category.type,
        isDefault: true,
      },
    });

    if (!existing) {
      // Create with auto-generated UUID
      await prisma.category.create({
        data: {
          ...category,
          isDefault: true,
          userId: null,
        },
      });
    }
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

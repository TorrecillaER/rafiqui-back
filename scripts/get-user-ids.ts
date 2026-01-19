import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📋 IDs de Usuarios Actuales:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
    orderBy: {
      email: 'asc',
    },
  });

  users.forEach(user => {
    console.log(`\n👤 ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role:  ${user.role}`);
    console.log(`   ID:    ${user.id}`);
    console.log('   ─────────────────────────────────────────────────────────────────────────');
  });

  console.log('\n💡 Usa estos IDs en tu app móvil o en las peticiones API\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

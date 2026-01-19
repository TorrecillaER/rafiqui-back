import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash de la contraseña "password123"
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Crear usuario Collector
  const collector = await prisma.user.upsert({
    where: { email: 'collector@rafiqui.com' },
    update: {},
    create: {
      email: 'collector@rafiqui.com',
      password: hashedPassword,
      name: 'Collector User',
      role: Role.OPERATOR,
    },
  });

  console.log('✅ Created collector:', collector.email);

  // Crear usuario Inspector
  const inspector = await prisma.user.upsert({
    where: { email: 'inspector@rafiqui.com' },
    update: {},
    create: {
      email: 'inspector@rafiqui.com',
      password: hashedPassword,
      name: 'Inspector User',
      role: Role.OPERATOR,
    },
  });

  console.log('✅ Created inspector:', inspector.email);

  // Crear usuario Admin (bonus)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rafiqui.com' },
    update: {},
    create: {
      email: 'admin@rafiqui.com',
      password: hashedPassword,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });

  console.log('✅ Created admin:', admin.email);

  console.log('\n📋 Usuarios creados:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email: collector@rafiqui.com');
  console.log('Password: password123');
  console.log('Role: OPERATOR (Collector)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email: inspector@rafiqui.com');
  console.log('Password: password123');
  console.log('Role: OPERATOR (Inspector)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email: admin@rafiqui.com');
  console.log('Password: password123');
  console.log('Role: ADMIN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

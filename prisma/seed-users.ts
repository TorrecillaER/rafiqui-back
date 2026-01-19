import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Crear Recolector
  const collectorEmail = 'collector@rafiqui.com';
  let collector = await prisma.user.findUnique({ where: { email: collectorEmail } });

  if (!collector) {
    collector = await prisma.user.create({
      data: {
        email: collectorEmail,
        password: hashedPassword,
        name: 'Juan Recolector',
        role: Role.OPERATOR,
      },
    });
    console.log(`COLLECTOR CREATED: ${collector.id}`);
  } else {
    // Actualizar contraseña si ya existe (para corregir seeds anteriores sin hash)
    collector = await prisma.user.update({
      where: { email: collectorEmail },
      data: { password: hashedPassword },
    });
    console.log(`COLLECTOR UPDATED: ${collector.id}`);
  }

  // Crear Inspector
  const inspectorEmail = 'inspector@rafiqui.com';
  let inspector = await prisma.user.findUnique({ where: { email: inspectorEmail } });

  if (!inspector) {
    inspector = await prisma.user.create({
      data: {
        email: inspectorEmail,
        password: hashedPassword,
        name: 'Ana Inspectora',
        role: Role.PARTNER, // Asumimos PARTNER o OPERATOR para inspector
      },
    });
    console.log(`INSPECTOR CREATED: ${inspector.id}`);
  } else {
     // Actualizar contraseña si ya existe
     inspector = await prisma.user.update({
      where: { email: inspectorEmail },
      data: { password: hashedPassword },
    });
    console.log(`INSPECTOR UPDATED: ${inspector.id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

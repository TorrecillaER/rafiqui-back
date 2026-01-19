"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const collector = await prisma.user.upsert({
        where: { email: 'collector@rafiqui.com' },
        update: {},
        create: {
            email: 'collector@rafiqui.com',
            password: hashedPassword,
            name: 'Collector User',
            role: client_1.Role.OPERATOR,
        },
    });
    console.log('✅ Created collector:', collector.email);
    const inspector = await prisma.user.upsert({
        where: { email: 'inspector@rafiqui.com' },
        update: {},
        create: {
            email: 'inspector@rafiqui.com',
            password: hashedPassword,
            name: 'Inspector User',
            role: client_1.Role.OPERATOR,
        },
    });
    console.log('✅ Created inspector:', inspector.email);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@rafiqui.com' },
        update: {},
        create: {
            email: 'admin@rafiqui.com',
            password: hashedPassword,
            name: 'Admin User',
            role: client_1.Role.ADMIN,
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
//# sourceMappingURL=seed.js.map
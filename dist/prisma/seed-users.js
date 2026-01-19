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
    const saltRounds = 10;
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const collectorEmail = 'collector@rafiqui.com';
    let collector = await prisma.user.findUnique({ where: { email: collectorEmail } });
    if (!collector) {
        collector = await prisma.user.create({
            data: {
                email: collectorEmail,
                password: hashedPassword,
                name: 'Juan Recolector',
                role: client_1.Role.OPERATOR,
            },
        });
        console.log(`COLLECTOR CREATED: ${collector.id}`);
    }
    else {
        collector = await prisma.user.update({
            where: { email: collectorEmail },
            data: { password: hashedPassword },
        });
        console.log(`COLLECTOR UPDATED: ${collector.id}`);
    }
    const inspectorEmail = 'inspector@rafiqui.com';
    let inspector = await prisma.user.findUnique({ where: { email: inspectorEmail } });
    if (!inspector) {
        inspector = await prisma.user.create({
            data: {
                email: inspectorEmail,
                password: hashedPassword,
                name: 'Ana Inspectora',
                role: client_1.Role.PARTNER,
            },
        });
        console.log(`INSPECTOR CREATED: ${inspector.id}`);
    }
    else {
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
//# sourceMappingURL=seed-users.js.map
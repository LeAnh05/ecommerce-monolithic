require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    // Tạo vai trò người dùng thông thường
    const role = await prisma.role.upsert({
        where: { roleid: 1 },
        update: { rolename: "USER" },
        create: {
            roleid: 1,
            rolename: "USER",
        },
    });

    // Tạo hạng thành viên ban đầu
    const membership = await prisma.memberShip.upsert({
        where: { mid: 1 },
        update: {
            mname: "NORMAL",
            score: 10,
        },
        create: {
            mid: 1,
            mname: "NORMAL",
            score: 10,
        },
    });

    console.log("Seed completed successfully!");
    console.log("Role:", role);
    console.log("Membership:", membership);
}

main()
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
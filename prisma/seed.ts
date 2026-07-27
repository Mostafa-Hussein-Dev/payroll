import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "admin1234";
  const passwordHash = await bcrypt.hash(password, 10);

  // Update the password hash on every seed so changing ADMIN_PASSWORD in .env
  // and re-running the seed actually resets the admin's password.
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, name: "Admin", passwordHash },
  });

  console.log(`Seeded admin user: ${email} / ${password}`);

  // Optional demo company (safe to keep; contains no real data)
  const count = await prisma.company.count();
  if (count === 0) {
    const company = await prisma.company.create({
      data: {
        name: "Demo Company",
        currency: "USD",
        nssfMode: "percent",
        nssfValue: "3",
        employees: {
          create: [
            {
              name: "Sample Employee",
              employeeNo: "1001",
              baseSalary: "500",
              transportAllowance: "50",
              familyAllowance: "0",
              nssfSubscribed: true,
              loanBalance: "0",
            },
          ],
        },
      },
    });
    console.log(`Seeded demo company: ${company.name}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const neighborhoods = [
  "Centro",
  "Canta Galo",
  "Budag",
  "Fundo Canoas",
  "Jardim América",
  "Laranjeiras",
  "Progresso",
  "Santana",
  "Taboão",
];

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const city = await prisma.city.upsert({
    where: { slug: "rio-do-sul" },
    create: {
      name: "Rio do Sul",
      slug: "rio-do-sul",
      stateCode: "SC",
      isActive: true,
    },
    update: {
      name: "Rio do Sul",
      stateCode: "SC",
      isActive: true,
    },
  });

  for (const name of neighborhoods) {
    const slug = slugify(name);
    await prisma.neighborhood.upsert({
      where: { cityId_slug: { cityId: city.id, slug } },
      create: { cityId: city.id, name, slug },
      update: { name },
    });
  }

  console.log(`Seed concluído: ${city.name} e ${neighborhoods.length} bairros.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

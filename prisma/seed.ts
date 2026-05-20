import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  }),
});

async function main() {
  // 清理旧数据
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.paymentRecord.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 创建分类
  const greenTea = await prisma.category.create({
    data: { name: "绿茶", slug: "green-tea" },
  });
  const blackTea = await prisma.category.create({
    data: { name: "红茶", slug: "black-tea" },
  });

  // 黄山毛峰
  await prisma.product.create({
    data: {
      name: "黄山毛峰",
      slug: "huangshan-maofeng",
      subtitle: "中国十大名茶之一",
      englishName: "Huangshan Maofeng",
      description:
        "黄山毛峰产于安徽省黄山一带，是中国十大名茶之一。其外形微卷，状似雀舌，绿中泛黄，银毫显露，且带有金黄色鱼叶（俗称黄金片）。",
      price: 298,
      images: ["/images/huangshan-maofeng.png"],
      stock: 999,
      featured: true,
      specs: "净含量：100g | 产地：安徽黄山 | 保质期：18个月",
      categoryId: greenTea.id,
      features: [
        { icon: "leaf", title: "外形特征", desc: "芽叶肥壮匀齐，白毫显露，形似雀舌" },
        { icon: "flower", title: "香气特点", desc: "清香高长，兰花香馥郁持久" },
        { icon: "droplet", title: "汤色滋味", desc: "汤色清澈明亮，滋味鲜浓醇厚，回甘明显" },
        { icon: "mountain", title: "产地环境", desc: "海拔800米云雾茶园，生态环境优越" },
      ],
      brewing: {
        water: "85-90℃山泉水或纯净水",
        ratio: "1:50（3克茶叶配150ml水）",
        time: "第一泡30秒，后续每泡增加10-15秒",
        times: "可冲泡3-5次",
      },
      storage: "密封、避光、防潮、防异味，建议冷藏保存",
    },
  });

  // 太平猴魁
  await prisma.product.create({
    data: {
      name: "太平猴魁",
      slug: "taiping-houkui",
      subtitle: "绿茶之王，两叶抱一芽",
      englishName: "Taiping Houkui",
      description:
        "太平猴魁产于安徽省黄山市黄山区（原太平县）一带，为尖茶之极品。其外形两叶抱芽，扁平挺直，自然舒展，白毫隐伏，有「猴魁两头尖，不散不翘不卷边」的美名。",
      price: 398,
      images: ["/images/taiping-houkui.png"],
      stock: 999,
      featured: true,
      specs: "净含量：100g | 产地：安徽黄山 | 保质期：18个月",
      categoryId: greenTea.id,
      features: [
        { icon: "leaf", title: "外形特征", desc: "两叶抱一芽，扁平挺直，魁伟重实" },
        { icon: "flower", title: "香气特点", desc: "兰香高爽，持久悠长，独特猴韵" },
        { icon: "droplet", title: "汤色滋味", desc: "汤色嫩绿明亮，滋味醇厚甘甜，回味无穷" },
        { icon: "mountain", title: "产地环境", desc: "黄山余脉深山峡谷，云雾缭绕，土壤肥沃" },
      ],
      brewing: {
        water: "80-85℃山泉水或纯净水",
        ratio: "1:50（3克茶叶配150ml水）",
        time: "第一泡45秒，后续每泡增加15秒",
        times: "可冲泡4-6次",
      },
      storage: "密封、避光、防潮、防异味，建议冷藏保存",
    },
  });

  // 祁门红茶
  await prisma.product.create({
    data: {
      name: "祁门红茶",
      slug: "qimen-hongcha",
      subtitle: "世界三大高香红茶之首",
      englishName: "Keemun Black Tea",
      description:
        "祁门红茶简称祁红，产于安徽省祁门、东至、贵池、石台、黟县等地。祁红是世界三大高香红茶之首，有「茶中英豪」、「群芳最」的美誉，以其独特的「祁门香」闻名于世。",
      price: 268,
      images: ["/images/qimen-black-tea.png"],
      stock: 999,
      featured: true,
      specs: "净含量：100g | 产地：安徽祁门 | 保质期：36个月",
      categoryId: blackTea.id,
      features: [
        { icon: "leaf", title: "外形特征", desc: "条索紧细秀长，色泽乌润，金毫显露" },
        { icon: "flower", title: "香气特点", desc: "香气馥郁持久，似果香又似兰花香，国际称之为「祁门香」" },
        { icon: "droplet", title: "汤色滋味", desc: "汤色红艳明亮，滋味醇和甘甜，叶底红亮" },
        { icon: "mountain", title: "产地环境", desc: "黄山支脉，气候温和，雨量充沛，土壤肥沃" },
      ],
      brewing: {
        water: "95-100℃沸水",
        ratio: "1:50（3克茶叶配150ml水）",
        time: "第一泡10-15秒，后续每泡增加5-10秒",
        times: "可冲泡5-7次",
      },
      storage: "密封、避光、防潮、防异味，常温保存即可",
    },
  });

  // 创建管理员用户
  const adminEmail = "admin@yueling.com";
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "admin" },
    create: {
      name: "管理员",
      email: adminEmail,
      passwordHash,
      role: "admin",
    },
  });
  console.log("Admin user: admin@yueling.com / admin123");

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

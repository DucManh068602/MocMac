import 'dotenv/config';
import mongoose from 'mongoose';
import { RegionStory } from './models/RegionStory.js';
import { VillageStory } from './models/VillageStory.js';

const regionStories = [
  {
    title: 'Tây Nguyên – Hương cà phê giữa đại ngàn',
    region: 'Tây Nguyên',
    excerpt: 'Đất bazan đỏ và khí hậu cao nguyên tạo nên hạt cà phê đậm vị, mang theo nhịp sống mộc mạc của buôn làng.',
    content:
      'Tây Nguyên được xem là thủ phủ cà phê của Việt Nam với những nương rẫy trải dài trên nền đất bazan màu mỡ. Từ Buôn Ma Thuột đến Đà Lạt, từng hạt cà phê được chăm sóc qua nhiều mùa nắng gió, rang xay giữ trọn hương thơm nồng nàn. Khi chọn một gói cà phê Tây Nguyên làm quà, bạn đang gửi trao dư vị của đại ngàn, sự chân chất và câu chuyện về những người nông dân miệt mài gìn giữ nghề.',
    imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    order: 10,
  },
  {
    title: 'Đồng bằng sông Hồng – Nơi làng nghề dệt nên ký ức',
    region: 'Đồng bằng sông Hồng',
    excerpt: 'Từ lò gốm Bát Tràng đến khung cửi Vạn Phúc, vùng đất này lưu giữ tinh hoa thủ công truyền thống.',
    content:
      'Đồng bằng sông Hồng là cái nôi của nhiều làng nghề lâu đời. Nghệ nhân nơi đây biến đất sét thành gốm men tinh tế, biến sợi tơ thành tấm lụa mềm mại, biến mây tre thành sản phẩm hữu dụng. Mỗi món quà thủ công từ vùng này không chỉ đẹp ở hình thức mà còn chứa đựng kỹ thuật truyền dạy qua nhiều thế hệ — một cách gửi tặng bản sắc Việt thật gần gũi.',
    imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    order: 9,
  },
  {
    title: 'Tây Bắc – Vị trà cổ thụ và sắc thổ cẩm',
    region: 'Tây Bắc',
    excerpt: 'Sương sớm trên núi cao ươm búp trà Shan Tuyết, trong khi bàn tay người thợ dệt nên hoa văn thổ cẩm độc bản.',
    content:
      'Tây Bắc gây thương nhớ bởi những cây chè cổ thụ mọc giữa mây ngàn Hà Giang, Sơn La. Búp trà được hái thủ công, giữ vị chát dịu và hậu ngọt sâu. Song hành cùng trà là nghề dệt thổ cẩm với hoa văn mang ý nghĩa văn hóa của từng cộng đồng. Một set quà kết hợp trà và sản phẩm thủ công Tây Bắc là lời chúc bình an, đậm đà bản địa.',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    order: 8,
  },
  {
    title: 'Duyên hải Nam Trung Bộ – Quà từ nắng, gió và biển',
    region: 'Duyên hải Nam Trung Bộ',
    excerpt: 'Vùng biển đầy nắng gió đóng góp những đặc sản đậm đà, gói trọn tinh thần hiếu khách của miền Trung.',
    content:
      'Duyên hải Nam Trung Bộ nổi bật với sản vật từ biển và nghề chế biến truyền thống. Từ những mẻ cá, mẻ mắm được ủ kỹ đến các sản phẩm thủ công ven biển, mỗi món quà mang theo vị mặn mòi của gió biển và sự cần mẫn của người dân. Đây là lựa chọn phù hợp cho những ai muốn gửi tặng hương vị chân thật, mạnh mẽ của miền Trung.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    order: 7,
  },
  {
    title: 'Tây Nam Bộ – Miệt vườn trù phú, quà ngọt hậu',
    region: 'Tây Nam Bộ',
    excerpt: 'Sông nước và vườn trái cây bốn mùa tạo nên những món quà dân dã, tròn vị mà gần gũi.',
    content:
      'Tây Nam Bộ hiền hòa với kênh rạch chằng chịt, vườn cây trái sum suê. Đặc sản miền sông nước thường mang vị ngọt thanh, thơm tự nhiên và tinh thần phóng khoáng của con người Nam Bộ. Gói quà từ vùng đất này phù hợp cho dịp thăm hỏi, biếu tặng — giản dị nhưng đầy tình.',
    imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    order: 6,
  },
];

const villageStories = [
  {
    title: 'Bát Tràng – Từ bàn xoay đến lò lửa',
    village: 'Bát Tràng',
    province: 'Hà Nội',
    craft: 'Gốm',
    excerpt: 'Mỗi bộ ấm chén là kết tinh của đất, men và kinh nghiệm nung lửa truyền đời.',
    content:
      'Làng gốm Bát Tràng nổi tiếng với sản phẩm gốm sứ tinh xảo. Người thợ nhào nặn đất, tạo hình trên bàn xoay, phủ men và canh lửa trong lò — mỗi công đoạn đều cần sự kiên nhẫn. Quà tặng từ Bát Tràng mang vẻ đẹp mộc mạc mà sang trọng, thích hợp cho biếu tặng và không gian sum vầy.',
    imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    order: 10,
  },
  {
    title: 'Phú Vinh – Sợi mây kể chuyện đôi tay',
    village: 'Phú Vinh',
    province: 'Hà Nội',
    craft: 'Mây tre đan',
    excerpt: 'Từng đường đan mây tre tạo nên giỏ quà bền đẹp, mang hơi thở thủ công Việt.',
    content:
      'Phú Vinh giữ nghề mây tre đan với kỹ thuật tỉ mỉ: chọn nguyên liệu, vót nan, phơi phóng và đan lát thành sản phẩm. Giỏ, khay, hộp quà mây tre không chỉ hữu dụng mà còn thể hiện sự chăm chút — một lựa chọn quà tặng xanh, thân thiện và giàu bản sắc.',
    imageUrl: 'https://images.unsplash.com/photo-1595408076683-5d0c228d8a3a?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    order: 9,
  },
];

async function upsertByTitle(Model, docs, key = 'title') {
  let created = 0;
  let updated = 0;
  for (const doc of docs) {
    const filter = { [key]: doc[key] };
    const res = await Model.findOneAndUpdate(filter, { $set: doc }, { upsert: true, new: false });
    if (res) updated += 1;
    else created += 1;
  }
  return { created, updated, total: docs.length };
}

try {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Đã kết nối MongoDB');

  const regionRes = await upsertByTitle(RegionStory, regionStories);
  console.log(`Region stories: ${regionRes.created} created, ${regionRes.updated} updated (total ${regionRes.total})`);

  const villageRes = await upsertByTitle(VillageStory, villageStories);
  console.log(`Village stories: ${villageRes.created} created, ${villageRes.updated} updated (total ${villageRes.total})`);
} catch (err) {
  console.error('Seed stories failed:', err);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}

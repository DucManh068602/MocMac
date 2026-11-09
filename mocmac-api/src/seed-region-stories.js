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
      '<p>Làng gốm Bát Tràng nổi tiếng với sản phẩm gốm sứ tinh xảo. Người thợ nhào nặn đất, tạo hình trên bàn xoay, phủ men và canh lửa trong lò — mỗi công đoạn đều cần sự kiên nhẫn.</p><p>Quà tặng từ Bát Tràng mang vẻ đẹp mộc mạc mà sang trọng, thích hợp cho biếu tặng và không gian sum vầy. Từ ấm chén, bình hoa đến đồ trang trí, mỗi sản phẩm đều kể câu chuyện về đôi bàn tay người thợ và truyền thống hàng trăm năm.</p>',
    imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    order: 10,
  },
  {
    title: 'Vạn Phúc – Hơi thở của lụa tơ tằm',
    village: 'Vạn Phúc',
    province: 'Hà Nội',
    craft: 'Dệt lụa',
    excerpt: 'Những thước lụa mềm mại mang theo kỹ thuật dệt và thẩm mỹ được gìn giữ qua nhiều thế hệ.',
    content:
      '<p>Làng lụa Vạn Phúc (Hà Đông, Hà Nội) gắn với nghề dệt lụa tơ tằm lâu đời. Từ khâu ươm tơ, nhuộm màu đến dệt hoa văn, mỗi công đoạn đòi hỏi sự tỉ mỉ và cảm nhận tinh tế về chất liệu.</p><p>Sản phẩm lụa Vạn Phúc như khăn, áo dài, trang phục và quà tặng mang vẻ thanh lịch, phù hợp với người yêu giá trị thủ công và văn hóa Việt.</p>',
    imageUrl: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    order: 9,
  },
  {
    title: 'Phú Vinh – Sợi mây kể chuyện đôi tay',
    village: 'Phú Vinh',
    province: 'Hà Nội',
    craft: 'Mây tre đan',
    excerpt: 'Từng đường đan mây tre tạo nên sản phẩm bền đẹp, mang hơi thở thủ công Việt.',
    content:
      '<p>Phú Vinh (Chương Mỹ, Hà Nội) giữ nghề mây tre đan với kỹ thuật tỉ mỉ: chọn nguyên liệu, vót nan, phơi phóng và đan lát thành sản phẩm.</p><p>Giỏ, khay, hộp quà mây tre không chỉ hữu dụng mà còn thể hiện sự chăm chút — một lựa chọn quà tặng xanh, thân thiện và giàu bản sắc.</p>',
    imageUrl: 'https://images.unsplash.com/photo-1595408076683-5d0c228d8a3a?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    order: 8,
  },
  {
    title: 'Đông Hồ – Tranh dân gian từ sắc gỗ',
    village: 'Đông Hồ',
    province: 'Bắc Ninh',
    craft: 'Tranh dân gian',
    excerpt: 'Màu điệp, giấy dó và ván khắc gỗ tạo nên những bức tranh gần gũi với đời sống Việt.',
    content:
      '<p>Tranh Đông Hồ (Thuận Thành, Bắc Ninh) là dòng tranh dân gian nổi tiếng với kỹ thuật in khắc gỗ và màu tự nhiên. Chủ đề tranh gắn với phong tục, ước vọng và sinh hoạt đời thường.</p><p>Mỗi bức tranh là một lát cắt văn hóa, phù hợp làm quà lưu niệm hoặc trang trí mang tinh thần Việt.</p>',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    order: 7,
  },
  {
    title: 'Chuông – Nón lá lưu giữ dáng quê',
    village: 'Chuông',
    province: 'Hà Nội',
    craft: 'Làm nón',
    excerpt: 'Nón lá Chuông mỏng, nhẹ, thanh thoát — biểu tượng của vẻ đẹp mộc mạc.',
    content:
      '<p>Làng Chuông (Thanh Oai, Hà Nội) nổi tiếng với nghề làm nón lá. Lá được chọn kỹ, phơi vừa độ, khâu từng vòng đều tay để tạo nên chiếc nón nhẹ và bền.</p><p>Nón lá không chỉ che nắng mưa mà còn là món quà mang hình ảnh làng quê Việt Nam.</p>',
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    order: 6,
  },
  {
    title: 'Hạ Thái – Sơn mài nhiều lớp thời gian',
    village: 'Hạ Thái',
    province: 'Hà Nội',
    craft: 'Sơn mài',
    excerpt: 'Những lớp sơn, mài và đánh bóng tạo nên bề mặt sâu, bóng và bền theo năm tháng.',
    content:
      '<p>Làng sơn mài Hạ Thái (Thường Tín, Hà Nội) nổi bật với kỹ thuật sơn nhiều lớp, mài đi mài lại để lộ chiều sâu vật liệu. Mỗi sản phẩm là sự kiên nhẫn của người thợ.</p><p>Hộp, khay, tranh sơn mài mang vẻ sang trọng, thích hợp làm quà tặng cao cấp.</p>',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    order: 5,
  },
  {
    title: 'Kim Bồng – Mộc mạc từ nghề mộc',
    village: 'Kim Bồng',
    province: 'Quảng Nam',
    craft: 'Mộc',
    excerpt: 'Từ gỗ đến chi tiết chạm khắc, nghề mộc Kim Bồng giữ tinh thần thủ công và bền bỉ.',
    content:
      '<p>Làng mộc Kim Bồng (Cẩm Kim, Hội An, Quảng Nam) gắn với nghề mộc truyền thống, từng đóng góp vào các công trình kiến trúc cổ. Người thợ chọn gỗ, đo đạc, ghép mộng và chạm khắc tỉ mỉ.</p><p>Sản phẩm mộc từ Kim Bồng mang nét mộc mạc, bền chắc và giàu giá trị thủ công.</p>',
    imageUrl: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    order: 4,
  },
  {
    title: 'Bau Trúc – Gốm Chăm và hơi thở nắng gió',
    village: 'Bau Trúc',
    province: 'Ninh Thuận',
    craft: 'Gốm',
    excerpt: 'Gốm Chăm không dùng bàn xoay, tạo hình bằng tay và kỹ thuật truyền thống độc đáo.',
    content:
      '<p>Làng gốm Bau Trúc (Ninh Thuận) là một trong những làng gốm cổ của người Chăm. Nghệ nhân tạo hình bằng tay, đi vòng quanh khối đất, kết hợp hoa văn đặc trưng.</p><p>Sản phẩm gốm Bau Trúc mang sắc thái văn hóa Chăm, phù hợp với người tìm quà tặng giàu bản sắc vùng miền.</p>',
    imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    order: 3,
  },
  {
    title: 'Tân Châu – Lụa nhuộm trái mặc nưa',
    village: 'Tân Châu',
    province: 'An Giang',
    craft: 'Dệt lụa',
    excerpt: 'Sắc đen bóng đặc trưng của lụa Tân Châu đến từ kỹ thuật nhuộm truyền thống.',
    content:
      '<p>Lụa Tân Châu (An Giang) nổi tiếng với màu đen óng, mềm và mát. Kỹ thuật nhuộm và xử lý lụa tạo nên độ rũ, độ bóng riêng khó nhầm lẫn.</p><p>Các sản phẩm từ lụa Tân Châu như khăn, trang phục hay quà tặng mang vẻ sang trọng, đậm chất Nam Bộ.</p>',
    imageUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    order: 2,
  },
  {
    title: 'Phước Tích – Gốm xưa bên dòng Ô Lâu',
    village: 'Phước Tích',
    province: 'Thừa Thiên Huế',
    craft: 'Gốm',
    excerpt: 'Di sản gốm Phước Tích gắn với kiến trúc và đời sống xứ Huế, mang vẻ trầm lắng.',
    content:
      '<p>Làng cổ Phước Tích (Thừa Thiên Huế) từng nổi tiếng với nghề gốm, sản phẩm gắn với nhà vườn và kiến trúc Huế. Nghề gốm nơi đây mang dấu ấn thời gian và sự mộc mạc.</p><p>Những sản phẩm gốm lấy cảm hứng từ Phước Tích gợi nhớ vẻ đẹp trầm, thích hợp làm quà tặng mang tinh thần xứ Huế.</p>',
    imageUrl: 'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    order: 1,
  },
];

async function upsertByTitle(Model, docs) {
  let created = 0;
  let updated = 0;
  for (const doc of docs) {
    const res = await Model.findOneAndUpdate({ title: doc.title }, { $set: doc }, { upsert: true, new: false });
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

  // Refresh village stories so repo pull + seed gives the expected 10 posts
  await VillageStory.deleteMany({});
  await VillageStory.insertMany(villageStories);
  console.log(`Village stories: inserted ${villageStories.length} posts`);
} catch (err) {
  console.error('Seed stories failed:', err);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}

import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './models/User.js';

const roleEmailSuffix = {
  admin: 'admin.mocmac.vn',
  staff: 'staff.mocmac.vn',
  collaborator: 'collaborator.mocmac.vn',
  cooperative: 'cooperative.mocmac.vn',
};

await mongoose.connect(process.env.MONGODB_URI);
const users = await User.find({ role: { $nin: ['customer'] } }).lean();
let updated = 0;

for (const u of users) {
  const suffix = roleEmailSuffix[u.role];
  if (!suffix) continue;
  const localPart = (u.originalEmail || u.email || '').split('@')[0];
  const newEmail = `${localPart}@${suffix}`;
  if (u.email === newEmail) continue;
  const exists = await User.exists({ email: newEmail, _id: { $ne: u._id } });
  if (exists) {
    console.log(`Bỏ qua ${u.email} -> ${newEmail} (đã có người dùng)`);
    continue;
  }
  await User.findByIdAndUpdate(u._id, { $set: { email: newEmail } });
  console.log(`Cập nhật ${u.email} -> ${newEmail}`);
  updated++;
}

console.log(`Hoàn tất. Đã cập nhật ${updated} tài khoản.`);
await mongoose.disconnect();

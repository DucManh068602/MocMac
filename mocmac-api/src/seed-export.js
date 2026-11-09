import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'seed-data');
fs.mkdirSync(outDir, { recursive: true });

function clean(doc, omit = []) {
  const o = { ...doc };
  for (const k of omit) delete o[k];
  for (const [k, v] of Object.entries(o)) {
    if (v instanceof Date) o[k] = v.toISOString();
    else if (v && typeof v === 'object' && v._bsontype === 'ObjectID') o[k] = String(v);
  }
  return o;
}

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

const permissions = await db.collection('permissions').find({}).toArray();
fs.writeFileSync(path.join(outDir, 'permissions.json'), JSON.stringify(permissions.map((d) => clean(d, ['_id','__v','createdAt','updatedAt'])), null, 2));
const permById = new Map(permissions.map((p) => [String(p._id), p.name]));
console.log('permissions', permissions.length);

const rolePermissions = await db.collection('rolepermissions').find({}).toArray();
const rp = rolePermissions.map((d) => ({ role: d.role, permissionName: permById.get(String(d.permission)) })).filter((d) => d.permissionName);
fs.writeFileSync(path.join(outDir, 'rolePermissions.json'), JSON.stringify(rp, null, 2));
console.log('rolePermissions', rp.length);

const collections = [
  ['products','products',['_id','__v','createdAt','updatedAt']],
  ['regions','regions',['_id','__v','createdAt','updatedAt']],
  ['provinces','provinces',['_id','__v','createdAt','updatedAt']],
  ['regionstories','regionStories',['_id','__v','createdAt','updatedAt']],
  ['villagestories','villageStories',['_id','__v','createdAt','updatedAt']],
  ['coupons','coupons',['_id','__v','createdAt','updatedAt']],
  ['deals','deals',['_id','__v','createdAt','updatedAt']],
  ['flashsales','flashSales',['_id','__v','createdAt','updatedAt']],
  ['sitecontents','siteContents',['_id','__v','createdAt','updatedAt','updatedBy']],
];
for (const [coll, name, omit] of collections) {
  const docs = await db.collection(coll).find({}).toArray();
  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(docs.map((d) => clean(d, omit)), null, 2));
  console.log(name, docs.length);
}

await mongoose.disconnect();
console.log('Đã xuất seed data ->', outDir);

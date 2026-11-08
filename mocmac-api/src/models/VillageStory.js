import mongoose from 'mongoose';

const villageStorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    village: { type: String, trim: true, default: '' },
    province: { type: String, trim: true, default: '' },
    craft: { type: String, trim: true, default: '' },
    excerpt: { type: String, trim: true, default: '' },
    content: { type: String, trim: true, default: '' },
    imageUrl: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

villageStorySchema.index({ status: 1, order: -1, createdAt: -1 });

export const VillageStory = mongoose.model('VillageStory', villageStorySchema);

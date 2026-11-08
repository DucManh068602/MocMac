import mongoose from 'mongoose';

const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    sections: [
      {
        heading: { type: String, trim: true, default: '' },
        body: { type: String, trim: true, default: '' },
      },
    ],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

export const SiteContent = mongoose.model('SiteContent', siteContentSchema);

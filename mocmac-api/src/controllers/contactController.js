import { Contact } from '../models/Contact.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { sendMail } from '../utils/mailer.js';

const contactRateLimit = new Map();

export const createContact = async (req, res) => {
  try {
    console.log('====================================');
    console.log('📩 Có yêu cầu liên hệ mới');
    console.log('Body nhận được:', req.body);

    const data = Array.isArray(req.body)
      ? req.body[0]
      : req.body;

    if (!data) {
      console.error('❌ Không có dữ liệu gửi lên');

      return res.status(400).json({
        success: false,
        field: 'all',
        message: 'Dữ liệu gửi lên không hợp lệ.'
      });
    }

    let email = String(data.email || '').trim().toLowerCase();

    const now = Date.now();
    const lastSubmit = contactRateLimit.get(email);
    if (lastSubmit && now - lastSubmit < 60000) {
      return res.status(429).json({
        success: false,
        field: 'email',
        message: 'Vui lòng chờ 60 giây trước khi gửi lại liên hệ.'
      });
    }

    let {
      name,
      phone,
      subject,
      message
    } = data;

    name = String(name || '').trim();
    phone = String(phone || '').trim();
    email = String(email || '').trim().toLowerCase();
    subject = String(subject || '').trim();
    message = String(message || '').trim();

    /* =========================
       VALIDATE HỌ TÊN
    ========================= */

    if (!name) {
      console.error('❌ Thiếu họ tên');

      return res.status(400).json({
        success: false,
        field: 'name',
        message: 'Vui lòng nhập họ và tên.'
      });
    }

    if (name.length < 2) {
      console.error('❌ Họ tên quá ngắn:', name);

      return res.status(400).json({
        success: false,
        field: 'name',
        message: 'Họ và tên phải có ít nhất 2 ký tự.'
      });
    }

    const nameRegex = /^[\p{L}\s'.-]+$/u;

    if (!nameRegex.test(name)) {
      console.error('❌ Họ tên không hợp lệ:', name);

      return res.status(400).json({
        success: false,
        field: 'name',
        message: 'Họ và tên không được chứa số hoặc ký tự không hợp lệ.'
      });
    }

    /* =========================
       VALIDATE EMAIL
    ========================= */

    if (!email) {
      console.error('❌ Thiếu email');

      return res.status(400).json({
        success: false,
        field: 'email',
        message: 'Vui lòng nhập email.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      console.error('❌ Email không hợp lệ:', email);

      return res.status(400).json({
        success: false,
        field: 'email',
        message: 'Email không đúng định dạng.'
      });
    }

    /* =========================
       VALIDATE SỐ ĐIỆN THOẠI
    ========================= */

    if (phone) {
      const normalizedPhone = phone.replace(/[\s.-]/g, '');
      const phoneRegex = /^(0\d{9}|\+84\d{9})$/;

      if (!phoneRegex.test(normalizedPhone)) {
        console.error('❌ Số điện thoại không hợp lệ:', phone);

        return res.status(400).json({
          success: false,
          field: 'phone',
          message:
            'Số điện thoại không hợp lệ. Ví dụ: 0365507533 hoặc +84365507533.'
        });
      }

      phone = normalizedPhone;
    }

    /* =========================
       VALIDATE NỘI DUNG
    ========================= */

    if (!message) {
      console.error('❌ Thiếu nội dung');

      return res.status(400).json({
        success: false,
        field: 'message',
        message: 'Vui lòng nhập nội dung cần hỗ trợ.'
      });
    }

    if (message.length < 3) {
      console.error('❌ Nội dung quá ngắn:', message);

      return res.status(400).json({
        success: false,
        field: 'message',
        message: 'Nội dung phải có ít nhất 3 ký tự.'
      });
    }

    /* =========================
       LƯU VÀO MONGODB
    ========================= */

    const contact = await Contact.create({
      name,
      phone,
      email,
      subject,
      message,
      status: 'new'
    });

    console.log('✅ Đã lưu liên hệ vào MongoDB');
    console.log('ID:', contact._id);
    console.log('Tên:', contact.name);
    console.log('Email:', contact.email);
    console.log('====================================');

    await ChatMessage.create({
      from: email,
      to: 'admin',
      message: `[Liên hệ] ${name} (${email}): ${subject || 'Không có chủ đề'} - ${message.slice(0, 100)}`,
    });

    await sendMail({
      to: email,
      subject: 'Xác nhận đã nhận được liên hệ của bạn',
      text: `Kính gửi ${name},\n\nChúng tôi đã nhận được liên hệ của bạn và sẽ phản hồi sớm nhất có thể.\n\nTrân trọng,\nĐội ngũ Mộc Mạc`,
    });

    contactRateLimit.set(email, now);

    return res.status(201).json({
      success: true,
      message: 'Gửi liên hệ thành công.',
      contact
    });

  } catch (error) {
    console.error('====================================');
    console.error('❌ LỖI KHI LƯU LIÊN HỆ VÀO MONGODB');
    console.error('Tên lỗi:', error.name);
    console.error('Thông báo:', error.message);

    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }

    console.error(error);
    console.error('====================================');

    return res.status(500).json({
      success: false,
      message: 'Không thể gửi liên hệ. Vui lòng thử lại.',
      error: error.message
    });
  }
};

export const getAllContacts = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.q) {
      const search = String(req.query.q);
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { message: new RegExp(search, 'i') },
      ];
    }

    if (req.query.status) {
      filter.status = String(req.query.status);
    }

    const sort = {};
    const sortBy = String(req.query.sortBy || 'createdAt');
    const sortDir = req.query.sortDir === 'asc' ? 1 : -1;
    sort[sortBy] = sortDir;

    const [contacts, total] = await Promise.all([
      Contact.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Contact.countDocuments(filter),
    ]);

    console.log(`📋 Đã tải ${contacts.length} liên hệ (trang ${page})`);

    return res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      contacts,
    });
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách liên hệ:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách liên hệ.',
      error: error.message,
    });
  }
};

export const getContactById = async (req, res) => {
  try {
    const contact = await Contact
      .findById(req.params.id)
      .lean();

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy liên hệ.'
      });
    }

    return res.json({
      success: true,
      contact
    });

  } catch (error) {
    console.error('❌ Lỗi lấy chi tiết liên hệ:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể lấy chi tiết liên hệ.',
      error: error.message
    });
  }
};

export const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatus = [
      'new',
      'processing',
      'done'
    ];

    if (!allowedStatus.includes(status)) {
      console.error('❌ Trạng thái không hợp lệ:', status);

      return res.status(400).json({
        success: false,
        field: 'status',
        message: 'Trạng thái không hợp lệ.'
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true
      }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy liên hệ.'
      });
    }

    console.log(
      `✅ Đã cập nhật liên hệ ${contact._id} → ${status}`
    );

    return res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công.',
      contact
    });

  } catch (error) {
    console.error('❌ Lỗi cập nhật trạng thái:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái.',
      error: error.message
    });
  }
};

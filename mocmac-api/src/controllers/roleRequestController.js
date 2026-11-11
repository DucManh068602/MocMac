import { RoleRequest } from '../models/RoleRequest.js';
import { User } from '../models/User.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';

const roleEmailSuffix = { admin: 'admin.mocmac.vn', staff: 'staff.mocmac.vn', collaborator: 'collaborator.mocmac.vn', cooperative: 'cooperative.mocmac.vn' };

export const submitRoleRequest = async (req, res) => {
  try {
    const { requestedRole, reason } = req.body ?? {};

    const allowedRoles = ['collaborator', 'cooperative', 'staff', 'admin'];
    if (!requestedRole || !allowedRoles.includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Vai trò yêu cầu không hợp lệ.',
      });
    }

    const currentUser = await User.findById(req.user.id).lean();
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    if (currentUser.role === requestedRole) {
      return res.status(400).json({
        success: false,
        message: `Bạn đã là ${requestedRole === 'collaborator' ? 'cộng tác viên' : requestedRole}.`,
      });
    }

    const existing = await RoleRequest.findOne({
      user: req.user.id,
      requestedRole,
      status: 'pending',
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã có yêu cầu đang chờ xử lý cho vai trò này.',
      });
    }

    const request = await RoleRequest.create({
      user: req.user.id,
      requestedRole,
      reason: String(reason || '').slice(0, 500),
    });

    const { user, ip } = getRequestInfo(req);
    await logAction({
      action: 'role_request.create',
      resourceType: 'RoleRequest',
      resourceId: request._id,
      user,
      ip,
      details: { requestedRole, reason: String(reason || '').slice(0, 100) },
    });

    return res.status(201).json({
      success: true,
      message: 'Yêu cầu của bạn đã được gửi. Chúng tôi sẽ xử lý trong thời gian sớm nhất.',
      request,
    });
  } catch (error) {
    console.error('❌ Lỗi gửi yêu cầu vai trò:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể gửi yêu cầu.',
      error: error.message,
    });
  }
};

export const getMyRoleRequests = async (req, res) => {
  try {
    const requests = await RoleRequest.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, requests });
  } catch (error) {
    console.error('❌ Lỗi lấy yêu cầu vai trò:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy yêu cầu.',
      error: error.message,
    });
  }
};

export const getAllRoleRequests = async (req, res) => {
  try {
    const [requests, total] = await Promise.all([
      RoleRequest.find()
        .populate('user', 'name email phone role')
        .sort({ createdAt: -1 })
        .lean(),
      RoleRequest.countDocuments(),
    ]);

    return res.json({
      success: true,
      total,
      requests,
    });
  } catch (error) {
    console.error('❌ Lỗi lấy tất cả yêu cầu vai trò:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách.',
      error: error.message,
    });
  }
};

export const updateRoleRequest = async (req, res) => {
  try {
    const { status, approvedRole } = req.body ?? {};

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ.',
      });
    }

    const request = await RoleRequest.findById(req.params.id).populate('user');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu.' });
    }

    if (status === 'approved') {
      const role = approvedRole || request.requestedRole;
      const allowedRoles = ['collaborator', 'cooperative', 'staff', 'admin'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
      }

      const targetUser = await User.findById(request.user._id);
      if (targetUser) {
        if (!targetUser.originalEmail) targetUser.originalEmail = targetUser.email;
        const suffix = roleEmailSuffix[role];
        if (suffix) {
          const localPart = String(targetUser.originalEmail || targetUser.email || '').split('@')[0];
          targetUser.email = `${localPart}@${suffix}`;
        }
        targetUser.role = role;
        targetUser.isActive = true;
        await targetUser.save();
      }

      request.status = 'approved';
    } else {
      request.status = 'rejected';
    }

    await request.save();

    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({
      action: 'role_request.update',
      resourceType: 'RoleRequest',
      resourceId: request._id,
      user: reqUser,
      ip,
      details: { status, approvedRole: approvedRole || request.requestedRole },
    });

    return res.json({
      success: true,
      message: status === 'approved' ? 'Đã duyệt và kích hoạt tài khoản.' : 'Đã từ chối yêu cầu.',
      request,
    });
  } catch (error) {
    console.error('❌ Lỗi cập nhật yêu cầu vai trò:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật.',
      error: error.message,
    });
  }
};

import { Permission } from '../models/Permission.js';
import { RolePermission } from '../models/RolePermission.js';
import { User } from '../models/User.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';

export const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ category: 1, name: 1 }).lean();
    const grouped = {};
    for (const p of permissions) {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    }
    const assigned = await RolePermission.find().populate('permission').lean();
    const assignedMap = {};
    for (const rp of assigned) {
      assignedMap[rp.role] = assignedMap[rp.role] || [];
      assignedMap[rp.role].push(rp.permission?.name);
    }
    return res.json({ success: true, permissions, assigned });
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách permission:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy danh sách permission.' });
  }
};

export const assignRolePermission = async (req, res) => {
  try {
    const { role, permissionName } = req.body ?? {};
    const allowedRoles = ['admin', 'staff', 'collaborator', 'cooperative', 'customer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
    }

    const permission = await Permission.findOne({ name: permissionName });
    if (!permission) {
      return res.status(404).json({ success: false, message: 'Permission không tồn tại.' });
    }

    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    const existing = await RolePermission.findOne({ role, permission: permission._id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Quyền này đã được gán cho vai trò.' });
    }

    const rp = await RolePermission.create({
      role,
      permission: permission._id,
      assignedBy: req.user.id,
    });

    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({
      action: 'permission.assign',
      resourceType: 'Permission',
      resourceId: rp._id,
      user: reqUser,
      ip,
      details: { role, permission: permissionName },
    });

    return res.json({ success: true, message: 'Gán quyền thành công.', rolePermission: rp });
  } catch (error) {
    console.error('❌ Lỗi gán quyền:', error);
    return res.status(500).json({ success: false, message: 'Không thể gán quyền.' });
  }
};

export const revokeRolePermission = async (req, res) => {
  try {
    const { role, permissionName } = req.body ?? {};
    const allowedRoles = ['admin', 'staff', 'collaborator', 'cooperative', 'customer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
    }

    const permission = await Permission.findOne({ name: permissionName });
    if (!permission) {
      return res.status(404).json({ success: false, message: 'Permission không tồn tại.' });
    }

    const rp = await RolePermission.findOneAndDelete({ role, permission: permission._id });
    if (!rp) {
      return res.status(404).json({ success: false, message: 'Quyền này chưa được gán.' });
    }

    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({
      action: 'permission.revoke',
      resourceType: 'Permission',
      resourceId: rp._id,
      user: reqUser,
      ip,
      details: { role, permission: permissionName },
    });

    return res.json({ success: true, message: 'Gỡ quyền thành công.' });
  } catch (error) {
    console.error('❌ Lỗi gỡ quyền:', error);
    return res.status(500).json({ success: false, message: 'Không thể gỡ quyền.' });
  }
};

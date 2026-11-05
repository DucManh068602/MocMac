import { RoutePermission } from '../models/RoutePermission.js';
import { User } from '../models/User.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';

export const getRoutePermissions = async (req, res) => {
  try {
    const permissions = await RoutePermission.find().sort({ role: 1, path: 1 }).lean();
    const grouped = {};
    for (const p of permissions) {
      if (!grouped[p.role]) grouped[p.role] = [];
      grouped[p.role].push(p);
    }
    return res.json({ success: true, permissions, grouped });
  } catch (error) {
    console.error('❌ Lỗi lấy route permissions:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy danh sách route permissions.' });
  }
};

export const setRoutePermission = async (req, res) => {
  try {
    const { role, path, method = '*', allowed = true, description = '' } = req.body ?? {};
    const allowedRoles = ['admin', 'staff', 'collaborator', 'cooperative', 'customer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
    }
    if (!path) {
      return res.status(400).json({ success: false, message: 'Path không được để trống.' });
    }

    const rp = await RoutePermission.findOneAndUpdate(
      { role, path: path.trim(), method: method.toUpperCase() },
      { allowed: !!allowed, description: String(description || '') },
      { upsert: true, new: true }
    );

    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({
      action: 'route_permission.set',
      resourceType: 'RoutePermission',
      resourceId: rp._id,
      user: reqUser,
      ip,
      details: { role, path: rp.path, method: rp.method, allowed: rp.allowed },
    });

    return res.json({ success: true, message: 'Cập nhật route permission thành công.', routePermission: rp });
  } catch (error) {
    console.error('❌ Lỗi cập nhật route permission:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật route permission.' });
  }
};

export const deleteRoutePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const rp = await RoutePermission.findByIdAndDelete(id);
    if (!rp) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy route permission.' });
    }

    const { user: reqUser, ip } = getRequestInfo(req);
    await logAction({
      action: 'route_permission.delete',
      resourceType: 'RoutePermission',
      resourceId: rp._id,
      user: reqUser,
      ip,
      details: { role: rp.role, path: rp.path, method: rp.method },
    });

    return res.json({ success: true, message: 'Xóa route permission thành công.' });
  } catch (error) {
    console.error('❌ Lỗi xóa route permission:', error);
    return res.status(500).json({ success: false, message: 'Không thể xóa route permission.' });
  }
};

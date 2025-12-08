import { useState, useEffect } from "react";
import { rolesApi, permissionsApi } from "../../services/api";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function RolesManagement() {
	const [roles, setRoles] = useState([]);
	const [permissions, setPermissions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [editingRole, setEditingRole] = useState(null);
	const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, roleId: null });
	const [formData, setFormData] = useState({
		name: "",
		display_name: "",
		description: "",
		permission_ids: [],
	});

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			setLoading(true);
			const [rolesRes, permissionsRes] = await Promise.all([
				rolesApi.getAll(),
				permissionsApi.getAll({ grouped: true }),
			]);
			setRoles(rolesRes.data);
			// Convert grouped permissions to flat array
			const flatPermissions = Object.values(permissionsRes.data).flat();
			setPermissions(flatPermissions);
		} catch (error) {
			console.error("Error loading data:", error);
			alert("Có lỗi xảy ra khi tải dữ liệu");
		} finally {
			setLoading(false);
		}
	};

	const handleCreate = () => {
		setEditingRole(null);
		setFormData({
			name: "",
			display_name: "",
			description: "",
			permission_ids: [],
		});
		setShowModal(true);
	};

	const handleEdit = (role) => {
		setEditingRole(role);
		setFormData({
			name: role.name,
			display_name: role.display_name,
			description: role.description || "",
			permission_ids: role.permissions?.map((p) => p.id) || [],
		});
		setShowModal(true);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			if (editingRole) {
				await rolesApi.update(editingRole.id, formData);
			} else {
				await rolesApi.create(formData);
			}
			setShowModal(false);
			loadData();
		} catch (error) {
			console.error("Error saving role:", error);
			alert("Có lỗi xảy ra khi lưu quyền");
		}
	};

	const handleDeleteClick = (roleId) => {
		setDeleteConfirm({ isOpen: true, roleId });
	};

	const handleDeleteConfirm = async () => {
		try {
			await rolesApi.delete(deleteConfirm.roleId);
			setDeleteConfirm({ isOpen: false, roleId: null });
			loadData();
		} catch (error) {
			console.error("Error deleting role:", error);
			alert("Có lỗi xảy ra khi xóa quyền");
		}
	};

	const handleDeleteCancel = () => {
		setDeleteConfirm({ isOpen: false, roleId: null });
	};

	const togglePermission = (permissionId) => {
		setFormData((prev) => ({
			...prev,
			permission_ids: prev.permission_ids.includes(permissionId)
				? prev.permission_ids.filter((id) => id !== permissionId)
				: [...prev.permission_ids, permissionId],
		}));
	};

	const groupedPermissions = permissions.reduce((acc, permission) => {
		const group = permission.group || "other";
		if (!acc[group]) {
			acc[group] = [];
		}
		acc[group].push(permission);
		return acc;
	}, {});

	if (loading) {
		return <div className="text-center py-8">Đang tải...</div>;
	}

	return (
		<div>
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold text-gray-900">Quản lý Quyền</h2>
				<button
					onClick={handleCreate}
					className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
					➕ Tạo Quyền mới
				</button>
			</div>

			<div className="bg-white shadow rounded-lg overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Tên
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Hiển thị
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Mô tả
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Số người dùng
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Thao tác
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{roles.map((role) => (
							<tr key={role.id} className="hover:bg-gray-50">
								<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
									{role.name}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{role.display_name}
								</td>
								<td className="px-6 py-4 text-sm text-gray-500">
									{role.description || "-"}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{role.users_count || 0}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<div className="flex space-x-3">
										<button
											onClick={() => handleEdit(role)}
											className="text-blue-600 hover:text-blue-900">
											Sửa
										</button>
										<button
											onClick={() => handleDeleteClick(role.id)}
											className="text-red-600 hover:text-red-900">
											Xóa
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Create/Edit Modal */}
			{showModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
						<h3 className="text-lg font-semibold mb-4">
							{editingRole ? "Sửa Quyền" : "Tạo Quyền mới"}
						</h3>
						<form onSubmit={handleSubmit}>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Tên quyền (name)
									</label>
									<input
										type="text"
										value={formData.name}
										onChange={(e) => setFormData({ ...formData, name: e.target.value })}
										className="w-full px-3 py-2 border border-gray-300 rounded-md"
										required
										disabled={!!editingRole}
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Tên hiển thị
									</label>
									<input
										type="text"
										value={formData.display_name}
										onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
										className="w-full px-3 py-2 border border-gray-300 rounded-md"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
									<textarea
										value={formData.description}
										onChange={(e) => setFormData({ ...formData, description: e.target.value })}
										className="w-full px-3 py-2 border border-gray-300 rounded-md"
										rows={3}
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Quyền chức năng
									</label>
									<div className="border border-gray-300 rounded-md p-4 max-h-96 overflow-y-auto">
										{Object.entries(groupedPermissions).map(([group, groupPermissions]) => (
											<div key={group} className="mb-4">
												<div className="font-semibold text-gray-700 mb-2 capitalize">{group}</div>
												<div className="space-y-2 pl-4">
													{groupPermissions.map((permission) => (
														<label key={permission.id} className="flex items-center">
															<input
																type="checkbox"
																checked={formData.permission_ids.includes(permission.id)}
																onChange={() => togglePermission(permission.id)}
																className="mr-2"
															/>
															<span className="text-sm text-gray-700">{permission.display_name}</span>
														</label>
													))}
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
							<div className="flex justify-end space-x-3 mt-6">
								<button
									type="button"
									onClick={() => setShowModal(false)}
									className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
									Hủy
								</button>
								<button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
									Lưu
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<ConfirmDialog
				isOpen={deleteConfirm.isOpen}
				onClose={handleDeleteCancel}
				onConfirm={handleDeleteConfirm}
				title="Xác nhận xóa quyền"
				message="Bạn có chắc chắn muốn xóa quyền này? Hành động này không thể hoàn tác."
			/>
		</div>
	);
}


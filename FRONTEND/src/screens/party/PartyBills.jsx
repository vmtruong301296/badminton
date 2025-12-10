import { useEffect, useMemo, useState } from "react";
import { partyBillsApi, playersApi } from "../../services/api";
import { formatCurrencyRounded, formatDate, formatRatio } from "../../utils/formatters";
import CurrencyInput from "../../components/common/CurrencyInput";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const today = () => formatDate(new Date().toISOString().slice(0, 10));

export default function PartyBills() {
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [partyBills, setPartyBills] = useState([]);
	const [filters, setFilters] = useState({ date_from: "", date_to: "", status: "all", limit: 20 });
	const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
	const [expanded, setExpanded] = useState(null);
	const [detailBill, setDetailBill] = useState(null);
	const [detailOpen, setDetailOpen] = useState(false);
	const [detailLoading, setDetailLoading] = useState(false);
	const [payingIds, setPayingIds] = useState(new Set());
	const [players, setPlayers] = useState([]);
	const [playerSearch, setPlayerSearch] = useState("");
	const [loadingPlayers, setLoadingPlayers] = useState(false);
	const [showAddPlayer, setShowAddPlayer] = useState(false);
	const [newPlayer, setNewPlayer] = useState({ name: "", gender: "male", default_ratio: 1 });

	const [form, setForm] = useState({
		date: today(),
		name: "Tiệc",
		note: "",
		base_amount: 0,
		extras: [{ name: "Bánh + Tôm", amount: 0 }],
		participants: [],
	});

	const totalExtra = useMemo(() => form.extras.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), [form.extras]);

	const sumRatios = useMemo(() => form.participants.reduce((sum, p) => sum + (Number(p.ratio_value) || 0), 0), [form.participants]);

	const unitPrice = useMemo(() => {
		const base = Number(form.base_amount) || 0;
		return sumRatios > 0 ? Math.round((base + totalExtra) / sumRatios) : 0;
	}, [form.base_amount, sumRatios, totalExtra]);

	const participantWithShare = useMemo(() => {
		return form.participants.map((p) => {
			const ratio = Number(p.ratio_value) || 0;
			const share = Math.round(ratio * unitPrice);
			const paidAmount = Number(p.paid_amount) || 0;
			const totalAmount = share - paidAmount; // Thành tiền = share - số tiền đã chi
			return { ...p, share, totalAmount };
		});
	}, [form.participants, unitPrice]);

	const filteredPartyBills = useMemo(() => {
		let data = [...partyBills];
		if (filters.date_from) {
			data = data.filter((b) => !b.date || b.date >= filters.date_from);
		}
		if (filters.date_to) {
			data = data.filter((b) => !b.date || b.date <= filters.date_to);
		}
		if (filters.status && filters.status !== "all") {
			data = data.filter((b) => {
				const remaining = b.participants?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
				const isDue = remaining > 0;
				return filters.status === "due" ? isDue : !isDue;
			});
		}
		data.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
		if (filters.limit) data = data.slice(0, filters.limit);
		return data;
	}, [partyBills, filters]);

	const getBillStatus = (bill) => {
		const participants = bill.participants || [];
		const total = participants.length;
		const paid = participants.filter((p) => p.is_paid).length;
		if (total === 0) return { text: "-", color: "bg-gray-100 text-gray-700" };
		if (paid === total) return { text: "Đã thanh toán", color: "bg-green-100 text-green-800" };
		if (paid > 0) return { text: "Thanh toán 1 phần", color: "bg-yellow-100 text-yellow-800" };
		return { text: "Chưa thanh toán", color: "bg-gray-100 text-gray-800" };
	};

	const getUnpaidCount = (bill) => {
		const participants = bill.participants || [];
		return participants.filter((p) => !p.is_paid).length;
	};

	const loadPartyBills = async () => {
		try {
			setLoading(true);
			const res = await partyBillsApi.getAll();
			setPartyBills(res.data || []);
		} catch (error) {
			console.error("Error loading party bills", error);
			alert("Không tải được danh sách tiệc");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadPartyBills();
		loadPlayers();
	}, []);

	const loadPlayers = async () => {
		try {
			setLoadingPlayers(true);
			const res = await playersApi.getAll();
			setPlayers(res.data || []);
		} catch (error) {
			console.error("Error loading players", error);
		} finally {
			setLoadingPlayers(false);
		}
	};

	const normalize = (str) =>
		(str || "")
			.toString()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/đ/g, "d")
			.replace(/Đ/g, "D")
			.toLowerCase();

	const availablePlayers = useMemo(() => {
		const search = normalize(playerSearch);
		return players.filter((p) => {
			const already = form.participants.some((sp) => sp.user_id === p.id);
			if (already) return false;
			if (!search) return true;
			return normalize(p.name).includes(search);
		});
	}, [players, form.participants, playerSearch]);

	const handleSelectPlayer = (player) => {
		updateField("participants", [
			...form.participants,
			{
				user_id: player.id,
				name: player.name,
				gender: player.gender,
				ratio_value: 1, // Mặc định luôn là 1 cho chia tiệc
				default_ratio_value: player.default_ratio_value ?? player.default_ratio ?? 1,
				paid_amount: 0, // Số tiền đã chi
				note: "", // Ghi chú
			},
		]);
	};

	const handleCreatePlayer = async () => {
		if (!newPlayer.name.trim()) {
			alert("Nhập tên người chơi");
			return;
		}
		const slug = newPlayer.name.trim().toLowerCase().replace(/\s+/g, "");
		const email = `${slug || "player"}${Date.now()}@party.local`;
		try {
			const payload = {
				name: newPlayer.name.trim(),
				gender: newPlayer.gender,
				default_ratio: newPlayer.default_ratio || 1,
				email,
				password: "password",
			};
			const res = await playersApi.create(payload);
			await loadPlayers();
			setShowAddPlayer(false);
			setNewPlayer({ name: "", gender: "male", default_ratio: 1 });
			// auto select với ratio_value = 1
			handleSelectPlayer({
				id: res.data.id,
				name: res.data.name,
				gender: res.data.gender,
			});
		} catch (error) {
			console.error("Create player error", error);
			alert("Không thể tạo người chơi mới");
		}
	};

	const updateField = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const updateExtra = (index, key, value) => {
		setForm((prev) => {
			const extras = [...prev.extras];
			extras[index] = { ...extras[index], [key]: value };
			return { ...prev, extras };
		});
	};

	const updateParticipant = (index, key, value) => {
		setForm((prev) => {
			const participants = [...prev.participants];
			participants[index] = { ...participants[index], [key]: value };
			return { ...prev, participants };
		});
	};

	const addExtra = () => updateField("extras", [...form.extras, { name: "", amount: 0 }]);
	const removeExtra = (idx) =>
		updateField(
			"extras",
			form.extras.filter((_, i) => i !== idx)
		);

	const addParticipant = () => updateField("participants", [...form.participants, { name: "", ratio_value: 1 }]);
	const removeParticipant = (idx) =>
		updateField(
			"participants",
			form.participants.filter((_, i) => i !== idx)
		);

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			setSaving(true);
			const payload = {
				date: form.date,
				name: form.name,
				note: form.note,
				base_amount: Number(form.base_amount) || 0,
				extras: form.extras
					.filter((x) => (x.name || "") !== "" && Number(x.amount) > 0)
					.map((x) => ({ name: x.name, amount: Number(x.amount) || 0 })),
				participants: form.participants
					.filter((p) => (p.name || "") !== "")
					.map((p) => ({
						user_id: p.user_id || null,
						name: p.name,
						ratio_value: Number(p.ratio_value) || 0,
						paid_amount: Number(p.paid_amount) || 0,
						note: p.note || "",
					})),
			};

			if (payload.participants.length === 0) {
				alert("Vui lòng nhập ít nhất 1 người");
				setSaving(false);
				return;
			}

			if (payload.base_amount <= 0) {
				alert("Tổng tiền tiệc phải lớn hơn 0");
				setSaving(false);
				return;
			}

			if (!payload.name || payload.name.trim() === "") {
				alert("Vui lòng nhập tên/nội dung tiệc");
				setSaving(false);
				return;
			}

			await partyBillsApi.create(payload);
			await loadPartyBills();
			alert("Đã tạo chia tiệc");
			// Reset form sau khi tạo thành công
			setForm({
				date: today(),
				name: "Tiệc",
				note: "",
				base_amount: 0,
				extras: [{ name: "Bánh + Tôm", amount: 0 }],
				participants: [],
			});
		} catch (error) {
			console.error("Error creating party bill", error);
			const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Tạo chia tiệc thất bại";
			alert(`Lỗi: ${errorMessage}`);
		} finally {
			setSaving(false);
		}
	};

	const handleDeletePartyBill = async (id) => {
		try {
			await partyBillsApi.delete(id);
			await loadPartyBills();
		} catch (error) {
			console.error("Delete party bill error", error);
			alert("Không thể xóa tiệc");
		}
	};

	const handleOpenDetail = async (id) => {
		try {
			setDetailLoading(true);
			const res = await partyBillsApi.getById(id);
			setDetailBill(res.data);
			setDetailOpen(true);
		} catch (error) {
			console.error("Load party bill detail error", error);
			alert("Không thể tải chi tiết tiệc");
		} finally {
			setDetailLoading(false);
		}
	};

	const handleMarkPayment = async (participant) => {
		if (!detailBill) return;
		try {
			const newSet = new Set(payingIds);
			newSet.add(participant.id);
			setPayingIds(newSet);
			const res = await partyBillsApi.markPayment(detailBill.id, participant.id, { is_paid: !participant.is_paid });
			const updated = detailBill.participants.map((p) => (p.id === participant.id ? res.data.participant : p));
			setDetailBill({ ...detailBill, participants: updated });
			// Reload list to reflect status/unpaid count
			await loadPartyBills();
		} catch (error) {
			console.error("Mark payment error", error);
			alert("Không thể cập nhật thanh toán");
		} finally {
			const newSet = new Set(payingIds);
			newSet.delete(participant.id);
			setPayingIds(newSet);
		}
	};

	return (
		<div className="space-y-8">
			<div className="bg-white shadow rounded-lg p-6">
				<h2 className="text-xl font-semibold mb-4">Chia tiền tiệc</h2>

				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm text-gray-600 mb-1">Ngày</label>
							<input
								type="date"
								value={form.date}
								onChange={(e) => updateField("date", e.target.value)}
								className="w-full border rounded px-3 py-2"
								required
							/>
						</div>
						<div>
							<label className="block text-sm text-gray-600 mb-1">
								Tên/Nội dung <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={form.name}
								onChange={(e) => updateField("name", e.target.value)}
								className="w-full border rounded px-3 py-2"
								placeholder="Tiệc sinh nhật..."
								required
							/>
						</div>
						<div>
							<label className="block text-sm text-gray-600 mb-1">
								Tổng tiền tiệc <span className="text-red-500">*</span>
							</label>
							<CurrencyInput value={form.base_amount} onChange={(value) => updateField("base_amount", value)} className="w-full" />
						</div>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-800 mb-2">Chi phí thêm</label>
						<div className="space-y-2">
							{form.extras.map((extra, idx) => (
								<div key={idx} className="grid grid-cols-12 gap-2 items-center">
									<input
										type="text"
										value={extra.name}
										onChange={(e) => updateExtra(idx, "name", e.target.value)}
										placeholder="Tên chi phí (ví dụ: Bánh kem)"
										className="col-span-7 md:col-span-6 border rounded px-3 py-2"
									/>
									<CurrencyInput
										value={extra.amount}
										onChange={(value) => updateExtra(idx, "amount", value)}
										className="col-span-4 md:col-span-3"
										placeholder="0"
									/>
									<button type="button" onClick={() => removeExtra(idx)} className="col-span-1 text-red-500 hover:text-red-700">
										✕
									</button>
								</div>
							))}
							<button type="button" onClick={addExtra} className="text-blue-600 text-sm hover:underline">
								+ Thêm chi phí
							</button>
						</div>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-800 mb-2">Người tham gia</label>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="md:col-span-1 border rounded p-3 bg-gray-50">
								<div className="flex items-center justify-between mb-2">
									<div className="text-sm font-semibold text-gray-700">Chọn người chơi</div>
									<button type="button" onClick={() => setShowAddPlayer(true)} className="text-xs text-blue-600 hover:underline">
										+ Thêm nhanh
									</button>
								</div>
								<input
									type="text"
									value={playerSearch}
									onChange={(e) => setPlayerSearch(e.target.value)}
									placeholder="Tìm tên..."
									className="w-full border rounded px-3 py-2 mb-2"
								/>
								<div className="max-h-[512px] overflow-y-auto space-y-1 text-sm">
									{loadingPlayers ? (
										<div className="text-gray-500 text-center py-4">Đang tải...</div>
									) : availablePlayers.length === 0 ? (
										<div className="text-gray-500 text-center py-4">Không tìm thấy</div>
									) : (
										availablePlayers.map((p) => (
											<button
												key={p.id}
												type="button"
												onClick={() => handleSelectPlayer(p)}
												className="w-full text-left px-3 py-2 rounded border border-transparent hover:border-blue-300 hover:bg-blue-50">
												<div className="font-medium text-gray-900">{p.name}</div>
												<div className="text-xs text-gray-600 flex gap-2">
													<span>{p.gender === "male" ? "Nam" : p.gender === "female" ? "Nữ" : "-"}</span>
													<span>Mức: {formatRatio(p.default_ratio_value ?? 1)}</span>
												</div>
											</button>
										))
									)}
								</div>
							</div>

							<div className="md:col-span-2 space-y-2">
								{participantWithShare.map((p, idx) => (
									<div key={idx} className="grid grid-cols-12 gap-2 items-center border rounded p-2 bg-white">
										<div className="col-span-12 md:col-span-3">
											<div className="text-sm font-semibold text-gray-800">{p.name}</div>
										</div>
										<input
											type="number"
											step="0.1"
											min={0}
											value={p.ratio_value}
											onChange={(e) => updateParticipant(idx, "ratio_value", e.target.value)}
											className="col-span-12 md:col-span-2 border rounded px-2 py-1.5 text-sm"
											placeholder="Mức tính"
										/>
										<CurrencyInput
											value={p.paid_amount || 0}
											onChange={(value) => updateParticipant(idx, "paid_amount", value)}
											className="col-span-12 md:col-span-2 text-sm"
											placeholder="Đã chi"
										/>
										<input
											type="text"
											value={p.note || ""}
											onChange={(e) => updateParticipant(idx, "note", e.target.value)}
											className="col-span-12 md:col-span-3 border rounded px-2 py-1.5 text-sm"
											placeholder="Ghi chú..."
										/>
										<div className="col-span-12 md:col-span-1 text-right font-semibold text-blue-700 text-sm">
											{formatCurrencyRounded(p.totalAmount)}
										</div>
										<button
											type="button"
											onClick={() => removeParticipant(idx)}
											className="col-span-12 md:col-span-1 text-red-500 hover:text-red-700 text-center">
											✕
										</button>
									</div>
								))}
								<div className="text-sm text-gray-700 mb-2 pt-2 border-t">Tổng số người: {form.participants.length}</div>
								<div className="flex items-center justify-between text-sm text-gray-700">
									<div>SUM mức tính: {sumRatios}</div>
									<div>Đơn giá chia: {formatCurrencyRounded(unitPrice)}</div>
								</div>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
						<div className="p-3 bg-gray-50 rounded border">
							<div className="text-gray-600">Tổng tiền tiệc</div>
							<div className="text-lg font-semibold">{formatCurrencyRounded(Number(form.base_amount) || 0)}</div>
						</div>
						<div className="p-3 bg-gray-50 rounded border">
							<div className="text-gray-600">Tổng chi phí thêm</div>
							<div className="text-lg font-semibold">{formatCurrencyRounded(totalExtra)}</div>
						</div>
						<div className="p-3 bg-gray-50 rounded border">
							<div className="text-gray-600">Tổng cộng</div>
							<div className="text-lg font-semibold">{formatCurrencyRounded((Number(form.base_amount) || 0) + totalExtra)}</div>
						</div>
					</div>

					<div className="flex justify-end space-x-3">
						<button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
							{saving ? "Đang lưu..." : "Lưu chia tiệc"}
						</button>
					</div>
				</form>
			</div>

			<div className="bg-white shadow rounded-lg p-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold">Danh sách tiệc</h3>
					{loading && <div className="text-sm text-gray-500">Đang tải...</div>}
				</div>

				<div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
					<div>
						<label className="block text-sm text-gray-700 mb-1">Từ ngày</label>
						<input
							type="date"
							value={filters.date_from}
							onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
							className="w-full border rounded px-3 py-2"
						/>
					</div>
					<div>
						<label className="block text-sm text-gray-700 mb-1">Đến ngày</label>
						<input
							type="date"
							value={filters.date_to}
							onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
							className="w-full border rounded px-3 py-2"
						/>
					</div>
					<div>
						<label className="block text-sm text-gray-700 mb-1">Trạng thái</label>
						<select
							value={filters.status}
							onChange={(e) => setFilters({ ...filters, status: e.target.value })}
							className="w-full border rounded px-3 py-2">
							<option value="all">Tất cả</option>
							<option value="due">Còn phải thu</option>
							<option value="done">Đã đủ</option>
						</select>
					</div>
					<div>
						<label className="block text-sm text-gray-700 mb-1">Số tiệc hiển thị</label>
						<select
							value={filters.limit}
							onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value) })}
							className="w-full border rounded px-3 py-2">
							{[10, 20, 30, 50, 100].map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
					</div>
					<div className="flex items-end">
						<button
							type="button"
							onClick={() => setFilters({ date_from: "", date_to: "", status: "all", limit: 20 })}
							className="w-full px-3 py-2 border rounded bg-gray-100 hover:bg-gray-200">
							Reset
						</button>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="border-b">
								<th className="text-left py-2 px-2">Ngày</th>
								<th className="text-left py-2 px-2">Tên</th>
								<th className="text-right py-2 px-2">Tổng tiền</th>
								<th className="text-center py-2 px-2">Trạng thái</th>
								<th className="text-center py-2 px-2">SL chưa TT</th>
								<th className="text-center py-2 px-2">Thao tác</th>
							</tr>
						</thead>
						<tbody>
							{filteredPartyBills.map((bill) => (
								<tr key={bill.id} className="border-b hover:bg-gray-50 align-top">
									<td className="py-2 px-2">{bill.date ? bill.date.slice(0, 10) : ""}</td>
									<td className="py-2 px-2">
										<div className="font-semibold">{bill.name || "-"}</div>
										{bill.note && <div className="text-xs text-gray-500">{bill.note}</div>}
									</td>
									<td className="py-2 px-2 text-right">{formatCurrencyRounded(bill.total_amount)}</td>
									<td className="py-2 px-2 text-center">
										{(() => {
											const status = getBillStatus(bill);
											return <span className={`px-2 py-1 rounded text-xs font-semibold ${status.color}`}>{status.text}</span>;
										})()}
									</td>
									<td className="py-2 px-2 text-center">{getUnpaidCount(bill)}</td>
									<td className="py-2 px-2 text-center space-x-2">
										<button type="button" onClick={() => handleOpenDetail(bill.id)} className="text-indigo-600 hover:underline text-sm">
											Xem
										</button>
										<button
											type="button"
											onClick={() => setDeleteConfirm({ isOpen: true, id: bill.id })}
											className="text-red-600 hover:underline text-sm">
											Xóa
										</button>
									</td>
								</tr>
							))}
							{filteredPartyBills.length === 0 && (
								<tr>
									<td colSpan="5" className="text-center py-4 text-gray-500">
										Chưa có dữ liệu
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			<ConfirmDialog
				isOpen={deleteConfirm.isOpen}
				onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
				onConfirm={async () => {
					await handleDeletePartyBill(deleteConfirm.id);
					setDeleteConfirm({ isOpen: false, id: null });
				}}
				title="Xác nhận xóa"
				message="Bạn có chắc chắn muốn xóa tiệc này?"
			/>

      {detailOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between px-6 py-4 border-b">
							<div>
								<h3 className="text-lg font-semibold">Chi tiết tiệc</h3>
								{detailBill?.date && <div className="text-sm text-gray-600">Ngày: {detailBill.date.slice(0, 10)}</div>}
							</div>
							<button type="button" onClick={() => setDetailOpen(false)} className="text-gray-500 hover:text-gray-700">
								✕
							</button>
						</div>

						<div className="px-6 py-4 space-y-4">
							{detailLoading ? (
								<div className="text-center text-gray-500 py-6">Đang tải...</div>
							) : (
								<>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div className="p-3 bg-gray-50 rounded border">
											<div className="text-gray-600 text-sm">Tên/Nội dung</div>
											<div className="text-base font-semibold">{detailBill?.name || "-"}</div>
											{detailBill?.note && <div className="text-xs text-gray-500 mt-1">{detailBill.note}</div>}
										</div>
										<div className="p-3 bg-gray-50 rounded border">
											<div className="text-gray-600 text-sm">Tổng tiền tiệc</div>
											<div className="text-base font-semibold">{formatCurrencyRounded(detailBill?.base_amount || 0)}</div>
										</div>
										<div className="p-3 bg-gray-50 rounded border">
											<div className="text-gray-600 text-sm">Tổng chi phí thêm</div>
											<div className="text-base font-semibold">{formatCurrencyRounded(detailBill?.total_extra || 0)}</div>
										</div>
									</div>

									{detailBill?.extras?.length > 0 && (
										<div className="border rounded p-4">
											<div className="font-semibold mb-2">Chi phí thêm</div>
											<div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
												<span>Tổng</span>
												<span>{formatCurrencyRounded(detailBill.total_extra || 0)}</span>
											</div>
											<div className="space-y-1 text-sm text-gray-700">
												{detailBill.extras.map((ex) => (
													<div key={ex.id} className="flex justify-between">
														<span>{ex.name}</span>
														<span>{formatCurrencyRounded(ex.amount)}</span>
													</div>
												))}
											</div>
										</div>
									)}

									<div className="border rounded p-4">
										<div className="font-semibold mb-3">Người tham gia</div>
										<div className="overflow-x-auto">
											<table className="min-w-full text-sm">
												<thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">Tên</th>
                            <th className="text-right py-2 px-2">Mức</th>
                            <th className="text-right py-2 px-2">Đã chi</th>
														<th className="text-right py-2 px-2">Nợ</th>
														<th className="text-right py-2 px-2">Thành tiền</th>
														<th className="text-right py-2 px-2">Tổng tiền</th>
                            <th className="text-center py-2 px-2">Thanh toán</th>
                            <th className="text-left py-2 px-2">Ghi chú</th>
                          </tr>
												</thead>
												<tbody>
													{detailBill?.participants?.map((p) => (
														<tr key={p.id} className="border-b">
															<td className="py-2 px-2">{p.name}</td>
															<td className="py-2 px-2 text-right">{formatRatio(p.ratio_value)}</td>
															<td className="py-2 px-2 text-right">{formatCurrencyRounded(p.paid_amount || 0)}</td>
															<td className="py-2 px-2 text-right">
																<div className="font-semibold">
																	{p.debt_amount && p.debt_amount > 0
																		? formatCurrencyRounded(p.debt_amount)
																		: formatCurrencyRounded(0)}
																</div>
																{p.debt_details && p.debt_details.length > 0 && (
																	<div className="text-xs text-gray-600 space-y-1 mt-1">
																		{p.debt_details.map((d, idx) => (
																			<div key={idx} className="flex justify-between">
																				<span>{d.date}</span>
																				<span>{formatCurrencyRounded(d.amount)}</span>
																			</div>
																		))}
																	</div>
																)}
															</td>
															<td className="py-2 px-2 text-right">
																{formatCurrencyRounded(p.total_amount || 0)}
															</td>
															<td className="py-2 px-2 text-right">
																{formatCurrencyRounded((p.total_amount || 0) + (p.debt_amount || 0))}
															</td>
                              <td className="py-2 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={p.is_paid || false}
                                  disabled={payingIds.has(p.id)}
                                  onChange={() => handleMarkPayment(p)}
                                  className="w-5 h-5"
                                />
                                {p.paid_at && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(p.paid_at).toLocaleString('vi-VN')}
                                  </div>
                                )}
                              </td>
															<td className="py-2 px-2 text-left text-xs text-gray-600">{p.note || ""}</td>
														</tr>
													))}
													{(!detailBill?.participants || detailBill.participants.length === 0) && (
														<tr>
															<td colSpan="5" className="text-center py-3 text-gray-500">
																Chưa có người tham gia
															</td>
														</tr>
													)}
												</tbody>
											</table>
										</div>
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			)}

			{showAddPlayer && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddPlayer(false)}>
					<div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
						<div className="p-6 space-y-4">
							<h3 className="text-lg font-semibold">Thêm nhanh người chơi</h3>
							<div>
								<label className="block text-sm text-gray-600 mb-1">Tên</label>
								<input
									type="text"
									value={newPlayer.name}
									onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
									className="w-full border rounded px-3 py-2"
									placeholder="Tên người chơi"
								/>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block text-sm text-gray-600 mb-1">Giới tính</label>
									<select
										value={newPlayer.gender}
										onChange={(e) => setNewPlayer({ ...newPlayer, gender: e.target.value })}
										className="w-full border rounded px-3 py-2">
										<option value="male">Nam</option>
										<option value="female">Nữ</option>
									</select>
								</div>
								<div>
									<label className="block text-sm text-gray-600 mb-1">Mức tính</label>
									<input
										type="number"
										step="0.1"
										min={0}
										value={newPlayer.default_ratio}
										onChange={(e) => setNewPlayer({ ...newPlayer, default_ratio: e.target.value })}
										className="w-full border rounded px-3 py-2"
									/>
								</div>
							</div>
							<div className="flex justify-end space-x-2">
								<button type="button" onClick={() => setShowAddPlayer(false)} className="px-4 py-2 bg-gray-200 rounded">
									Hủy
								</button>
								<button type="button" onClick={handleCreatePlayer} className="px-4 py-2 bg-blue-600 text-white rounded">
									Lưu
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

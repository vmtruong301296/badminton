import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { billsApi } from "../../services/api";
import { formatCurrencyRounded, formatDate } from "../../utils/formatters";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function Dashboard() {
	const [bills, setBills] = useState([]);
	const [allBills, setAllBills] = useState([]); // Store all bills for unpaid players calculation
	const [loading, setLoading] = useState(true);
	const [filters, setFilters] = useState({
		date_from: "",
		date_to: "",
		player_id: "",
		status: ["partial", "unpaid"], // Array of selected statuses: 'paid', 'partial', 'unpaid'
		limit: 10, // Limit number of main bills to display
	});
	const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, billId: null });
	const [markingPayment, setMarkingPayment] = useState(new Set()); // Track players being marked as paid
	const [currentPage, setCurrentPage] = useState(1);

	useEffect(() => {
		loadBills();
		setCurrentPage(1); // Reset to page 1 when filters change
	}, [filters]);

	// Adjust currentPage if it exceeds totalPages (e.g., when limit changes)
	useEffect(() => {
		const mainBills = bills.filter((bill) => !bill.parent_bill_id);
		const totalPagesCount = Math.ceil(mainBills.length / filters.limit);
		if (currentPage > totalPagesCount && totalPagesCount > 0) {
			setCurrentPage(totalPagesCount);
		}
	}, [bills, filters.limit, currentPage]);

	const loadBills = async () => {
		try {
			setLoading(true);
			const params = {};
			if (filters.date_from) params.date_from = filters.date_from;
			if (filters.date_to) params.date_to = filters.date_to;
			if (filters.player_id) params.player_id = filters.player_id;

			const response = await billsApi.getAll(params);
			let filteredBills = response.data;

			// Store all bills for unpaid players calculation (without status filter)
			setAllBills(response.data);

			// Filter by status on frontend (multiple statuses can be selected)
			if (filters.status && filters.status.length > 0) {
				filteredBills = filteredBills.filter((bill) => {
					const allPaid = bill.bill_players?.every((p) => p.is_paid) || false;
					const somePaid = bill.bill_players?.some((p) => p.is_paid) || false;

					// Check if bill matches any of the selected statuses
					return filters.status.some((status) => {
						if (status === "paid") return allPaid && bill.bill_players?.length > 0;
						if (status === "partial") return somePaid && !allPaid;
						if (status === "unpaid") return !somePaid;
						return false;
					});
				});
			}

			setBills(filteredBills);
		} catch (error) {
			console.error("Error loading bills:", error);
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (bill) => {
		const allPaid = bill.bill_players?.every((p) => p.is_paid);
		const somePaid = bill.bill_players?.some((p) => p.is_paid);

		if (allPaid) return "bg-green-100 text-green-800";
		if (somePaid) return "bg-yellow-100 text-yellow-800";
		return "bg-gray-100 text-gray-800";
	};

	const getStatusText = (bill) => {
		const allPaid = bill.bill_players?.every((p) => p.is_paid);
		const somePaid = bill.bill_players?.some((p) => p.is_paid);

		if (allPaid) return "Đã thanh toán";
		if (somePaid) return "Thanh toán 1 phần";
		return "Chưa thanh toán";
	};

	// Check if bill is overdue (more than 1 week) and has unpaid players
	const isOverdueWarning = (bill) => {
		if (!bill.date) return false;

		const billDate = new Date(bill.date);
		billDate.setHours(0, 0, 0, 0); // Reset time to start of day

		const today = new Date();
		today.setHours(0, 0, 0, 0); // Reset time to start of day

		// Calculate difference in days
		const diffTime = today - billDate;
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		// Check if bill is more than 7 days old (quá hạn 1 tuần lễ)
		const isOverdue = diffDays > 7;

		// Check if there are unpaid players
		const unpaidCount = bill.bill_players?.filter((p) => !p.is_paid).length || 0;
		const hasUnpaidPlayers = unpaidCount > 0;

		return isOverdue && hasUnpaidPlayers;
	};

	const handleDeleteClick = (billId) => {
		setDeleteConfirm({ isOpen: true, billId });
	};

	const handleDeleteConfirm = async () => {
		try {
			await billsApi.delete(deleteConfirm.billId);
			setDeleteConfirm({ isOpen: false, billId: null });
			loadBills(); // Reload bills after deletion
		} catch (error) {
			console.error("Error deleting bill:", error);
			alert("Có lỗi xảy ra khi xóa bill");
		}
	};

	const handleDeleteCancel = () => {
		setDeleteConfirm({ isOpen: false, billId: null });
	};

	// Mark payment for all unpaid bills of a player
	const handleMarkPlayerPayment = async (userId) => {
		try {
			setMarkingPayment((prev) => new Set(prev).add(userId));

			// Find all bills where this player hasn't paid
			const unpaidBills = allBills.filter((bill) => {
				const player = bill.bill_players?.find((p) => p.user_id === userId);
				return player && !player.is_paid;
			});

			// Mark payment for all unpaid bills
			const promises = unpaidBills.map(async (bill) => {
				try {
					const player = bill.bill_players?.find((p) => p.user_id === userId);
					if (player) {
						await billsApi.markPayment(bill.id, userId, {
							amount: (player.total_amount || 0) + (player.debt_amount || 0),
							is_paid: true,
						});
					}
				} catch (error) {
					console.error(`Error marking payment for bill ${bill.id}:`, error);
				}
			});

			await Promise.all(promises);

			// Reload bills to update the list
			await loadBills();
		} catch (error) {
			console.error("Error marking player payment:", error);
			alert("Có lỗi xảy ra khi đánh dấu thanh toán");
		} finally {
			setMarkingPayment((prev) => {
				const newSet = new Set(prev);
				newSet.delete(userId);
				return newSet;
			});
		}
	};

	// Format date to YYYY/MM/DD
	const formatDateForUnpaid = (date) => {
		if (!date) return "";
		const d = new Date(date);
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${year}/${month}/${day}`;
	};

	// Calculate unpaid players list
	const unpaidPlayers = useMemo(() => {
		const playerMap = new Map();

		// Process all bills to collect unpaid players
		allBills.forEach((bill) => {
			if (!bill.bill_players) return;

			bill.bill_players.forEach((player) => {
				if (player.is_paid) return; // Skip paid players

				const userId = player.user_id;
				const userName = player.user?.name || "Unknown";

				if (!playerMap.has(userId)) {
					playerMap.set(userId, {
						userId,
						name: userName,
						totalAmount: 0,
						unpaidDates: [],
					});
				}

				const playerData = playerMap.get(userId);
				// Total amount includes both current bill amount and debt amount
				const playerTotal = (player.total_amount || 0) + (player.debt_amount || 0);
				playerData.totalAmount += playerTotal;

				// Add bill date if player hasn't paid (only current bill amount, debt is in debt_details)
				if (bill.date && player.total_amount > 0) {
					playerData.unpaidDates.push({
						date: bill.date,
						amount: player.total_amount || 0,
						billId: bill.id,
					});
				}

				// Add debt details dates
				if (player.debt_details && Array.isArray(player.debt_details)) {
					player.debt_details.forEach((debt) => {
						if (debt.date) {
							let debtAmount = 0;
							if (debt.parent_amount !== null) {
								debtAmount += debt.parent_amount;
							}
							if (debt.sub_bills && Array.isArray(debt.sub_bills)) {
								debt.sub_bills.forEach((subBill) => {
									debtAmount += subBill.amount || 0;
								});
							}

							if (debtAmount > 0) {
								playerData.unpaidDates.push({
									date: debt.date,
									amount: debtAmount,
									billId: bill.id,
								});
							}
						}
					});
				}
			});
		});

		// Convert map to array and sort dates (newest first)
		return Array.from(playerMap.values())
			.map((player) => {
				// Sort dates: newest first (descending)
				const sortedDates = [...player.unpaidDates].sort((a, b) => {
					return new Date(b.date) - new Date(a.date);
				});

				// Group by date and sum amounts for same date
				const dateMap = new Map();
				sortedDates.forEach((item) => {
					const dateKey = item.date;
					if (!dateMap.has(dateKey)) {
						dateMap.set(dateKey, { date: dateKey, amount: 0 });
					}
					dateMap.get(dateKey).amount += item.amount;
				});

				return {
					...player,
					unpaidDates: Array.from(dateMap.values()).sort((a, b) => {
						return new Date(b.date) - new Date(a.date);
					}),
				};
			})
			.filter((player) => player.totalAmount > 0)
			.sort((a, b) => {
				// Sort by latest unpaid date (descending - newest first)
				const aLatestDate = a.unpaidDates && a.unpaidDates.length > 0 ? new Date(a.unpaidDates[0].date) : new Date(0);
				const bLatestDate = b.unpaidDates && b.unpaidDates.length > 0 ? new Date(b.unpaidDates[0].date) : new Date(0);
				return bLatestDate - aLatestDate; // Descending order (newest first)
			});
	}, [allBills]);

	// Calculate displayed bills and total main bills count
	const { displayedBills, totalMainBillsCount, totalPages } = useMemo(() => {
		// Sort all bills by date descending (newest first)
		const sortedBills = [...bills].sort((a, b) => {
			const dateA = a.date ? new Date(a.date) : new Date(0);
			const dateB = b.date ? new Date(b.date) : new Date(0);
			return dateB - dateA; // Descending order (newest first)
		});

		// Separate main bills and sub bills (after sorting)
		const mainBills = sortedBills.filter((bill) => !bill.parent_bill_id);
		const subBills = sortedBills.filter((bill) => bill.parent_bill_id);

		// Calculate total pages
		const totalPagesCount = Math.ceil(mainBills.length / filters.limit);

		// Calculate pagination: get main bills for current page
		const startIndex = (currentPage - 1) * filters.limit;
		const endIndex = startIndex + filters.limit;
		const paginatedMainBills = mainBills.slice(startIndex, endIndex);

		// Get all sub bills that belong to the paginated main bills
		const mainBillIds = new Set(paginatedMainBills.map((bill) => bill.id));
		const relatedSubBills = subBills.filter((bill) => mainBillIds.has(bill.parent_bill_id));

		// Combine and sort by date: main bills first, then their sub bills, all sorted by date
		const combined = [...paginatedMainBills, ...relatedSubBills];
		const displayed = combined.sort((a, b) => {
			const dateA = a.date ? new Date(a.date) : new Date(0);
			const dateB = b.date ? new Date(b.date) : new Date(0);
			return dateB - dateA; // Descending order (newest first)
		});

		return {
			displayedBills: displayed,
			totalMainBillsCount: mainBills.length,
			totalPages: totalPagesCount,
		};
	}, [bills, filters.limit, currentPage]);

	return (
		<div>
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold text-gray-900">Danh sách Bills</h2>
				<Link to="/bills/create" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
					➕ Tạo Bill mới
				</Link>
			</div>

			{/* Filters */}
			<div className="bg-white p-4 rounded-lg shadow mb-6">
				<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
						<input
							type="date"
							value={filters.date_from}
							onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
							className="w-full px-3 py-2 border border-gray-300 rounded-md"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
						<input
							type="date"
							value={filters.date_to}
							onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
							className="w-full px-3 py-2 border border-gray-300 rounded-md"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
						<div className="space-y-2">
							<label className="flex items-center">
								<input
									type="checkbox"
									checked={filters.status.includes("paid")}
									onChange={(e) => {
										if (e.target.checked) {
											setFilters({ ...filters, status: [...filters.status, "paid"] });
										} else {
											setFilters({ ...filters, status: filters.status.filter((s) => s !== "paid") });
										}
									}}
									className="mr-2"
								/>
								<span className="text-sm text-gray-700">Đã thanh toán</span>
							</label>
							<label className="flex items-center">
								<input
									type="checkbox"
									checked={filters.status.includes("partial")}
									onChange={(e) => {
										if (e.target.checked) {
											setFilters({ ...filters, status: [...filters.status, "partial"] });
										} else {
											setFilters({ ...filters, status: filters.status.filter((s) => s !== "partial") });
										}
									}}
									className="mr-2"
								/>
								<span className="text-sm text-gray-700">Thanh toán 1 phần</span>
							</label>
							<label className="flex items-center">
								<input
									type="checkbox"
									checked={filters.status.includes("unpaid")}
									onChange={(e) => {
										if (e.target.checked) {
											setFilters({ ...filters, status: [...filters.status, "unpaid"] });
										} else {
											setFilters({ ...filters, status: filters.status.filter((s) => s !== "unpaid") });
										}
									}}
									className="mr-2"
								/>
								<span className="text-sm text-gray-700">Chưa thanh toán</span>
							</label>
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Số bill hiển thị</label>
						<select
							value={filters.limit}
							onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
							className="w-full px-3 py-2 border border-gray-300 rounded-md">
							<option value={10}>10</option>
							<option value={20}>20</option>
							<option value={30}>30</option>
							<option value={40}>40</option>
							<option value={50}>50</option>
						</select>
					</div>
					<div className="flex items-end">
						<button
							onClick={() => setFilters({ date_from: "", date_to: "", player_id: "", status: [], limit: 10 })}
							className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
							Xóa bộ lọc
						</button>
					</div>
				</div>
			</div>

			{/* Main Content: Bills Table and Unpaid Players */}
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				{/* Bills Table - Left Side (3/4 width) */}
				<div className="lg:col-span-3">
					{loading ? (
						<div className="text-center py-8">Đang tải...</div>
					) : displayedBills.length === 0 ? (
						<div className="text-center py-8 text-gray-500">Chưa có bill nào</div>
					) : (
						<div className="bg-white shadow rounded-lg overflow-hidden">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chưa TT</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{displayedBills.map((bill) => {
										const isWarning = isOverdueWarning(bill);
										const allPaid = bill.bill_players?.every((p) => p.is_paid) && bill.bill_players?.length > 0;
										return (
											<tr
												key={bill.id}
												className={`hover:bg-gray-50 ${
													isWarning
														? "bg-red-100 hover:bg-red-200"
														: allPaid
														? "bg-green-50 hover:bg-green-100"
														: bill.parent_bill_id
														? "bg-blue-50"
														: ""
												}`}>
												<td className="px-6 py-4 whitespace-nowrap">
													{bill.parent_bill_id ? (
														<div className="flex items-center space-x-2">
															<span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Bill con</span>
															{bill.parent_bill && (
																<Link
																	to={`/bills/${bill.parent_bill.id}`}
																	className="text-xs text-blue-600 hover:text-blue-900 hover:underline"
																	title="Xem bill chính">
																	{formatDate(bill.parent_bill.date)}
																</Link>
															)}
														</div>
													) : (
														<span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Bill chính</span>
													)}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(bill.date)}</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrencyRounded(bill.total_amount)}</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bill)}`}>{getStatusText(bill)}</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{bill.bill_players?.filter((p) => !p.is_paid).length || 0}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
													<div className="flex space-x-3">
														<Link to={`/bills/${bill.id}`} className="text-blue-600 hover:text-blue-900">
															Chi tiết
														</Link>
														<button type="button" onClick={() => handleDeleteClick(bill.id)} className="text-red-600 hover:text-red-900">
															Xóa
														</button>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>

							{/* Legend/Chú thích */}
							<div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
								<div className="flex flex-wrap items-center justify-between gap-4 text-sm">
									<div className="flex flex-wrap items-center gap-4">
										<div className="flex items-center space-x-2">
											<div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
											<span className="text-gray-700">Bill quá hạn 1 tuần và còn người chưa thanh toán</span>
										</div>
										<div className="flex items-center space-x-2">
											<div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
											<span className="text-gray-700">Bill đã thanh toán</span>
										</div>
										<div className="flex items-center space-x-2">
											<div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
											<span className="text-gray-700">Bill con</span>
										</div>
									</div>
									<div className="text-sm font-semibold text-gray-700">
										Tổng số bill: {totalMainBillsCount}
									</div>
								</div>
							</div>

							{/* Pagination */}
							{totalPages > 1 && (
								<div className="bg-white px-6 py-4 border-t border-gray-200">
									<div className="flex items-center justify-between">
										<div className="text-sm text-gray-700">
											Trang {currentPage} / {totalPages}
										</div>
										<div className="flex items-center space-x-2">
											<button
												onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
												disabled={currentPage === 1}
												className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
												Trước
											</button>
											{/* Page numbers */}
											<div className="flex items-center space-x-1">
												{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
													// Show first page, last page, current page, and pages around current
													if (
														page === 1 ||
														page === totalPages ||
														(page >= currentPage - 1 && page <= currentPage + 1)
													) {
														return (
															<button
																key={page}
																onClick={() => setCurrentPage(page)}
																className={`px-3 py-1 text-sm border rounded-md ${
																	currentPage === page
																		? "bg-blue-600 text-white border-blue-600"
																		: "border-gray-300 hover:bg-gray-50"
																}`}>
																{page}
															</button>
														);
													} else if (page === currentPage - 2 || page === currentPage + 2) {
														return (
															<span key={page} className="px-2 text-gray-500">
																...
															</span>
														);
													}
													return null;
												})}
											</div>
											<button
												onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
												disabled={currentPage === totalPages}
												className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
												Sau
											</button>
										</div>
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Unpaid Players List - Right Side (1/4 width) */}
				<div className="lg:col-span-1">
					<div className="bg-white shadow rounded-lg overflow-hidden">
						<div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
							<h3 className="text-lg font-semibold text-gray-900">Người chơi chưa thanh toán</h3>
						</div>
						<div className="divide-y divide-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
							{loading ? (
								<div className="px-6 py-8 text-center text-gray-500">Đang tải...</div>
							) : unpaidPlayers.length === 0 ? (
								<div className="px-6 py-8 text-center text-gray-500">Không có người chơi nào chưa thanh toán</div>
							) : (
								unpaidPlayers.map((player) => {
									const isMarking = markingPayment.has(player.userId);
									return (
										<div key={player.userId} className="px-6 py-3 hover:bg-gray-50 relative">
											<div className="pr-8 mb-2">
												<div className="text-sm font-semibold text-gray-900">
													{player.name}: <span className="text-red-600">{formatCurrencyRounded(player.totalAmount)}</span>
												</div>
											</div>
											<div className="text-sm pr-8">
												<div className="text-gray-700 font-medium mb-1">DS ngày thiếu:</div>
												<div className="space-y-1 pl-2">
													{player.unpaidDates.map((dateItem, idx) => (
														<div key={idx} className="text-gray-600">
															{formatDateForUnpaid(dateItem.date)} : {formatCurrencyRounded(dateItem.amount)}
														</div>
													))}
												</div>
											</div>
											<div className="absolute top-3 right-4">
												<input
													type="checkbox"
													checked={false}
													onChange={() => handleMarkPlayerPayment(player.userId)}
													disabled={isMarking}
													className="w-5 h-5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
													title="Đánh dấu thanh toán tất cả bills"
												/>
											</div>
											{isMarking && (
												<div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
													<div className="text-sm text-gray-600">Đang xử lý...</div>
												</div>
											)}
										</div>
									);
								})
							)}
						</div>
					</div>
				</div>
			</div>

			<ConfirmDialog
				isOpen={deleteConfirm.isOpen}
				onClose={handleDeleteCancel}
				onConfirm={handleDeleteConfirm}
				title="Xác nhận xóa bill"
				message="Bạn có chắc chắn muốn xóa bill này? Hành động này không thể hoàn tác."
			/>
		</div>
	);
}

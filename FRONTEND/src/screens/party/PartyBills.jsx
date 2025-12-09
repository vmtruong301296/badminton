import { useEffect, useMemo, useState } from 'react';
import { partyBillsApi, playersApi } from '../../services/api';
import { formatCurrencyRounded, formatDate, formatRatio } from '../../utils/formatters';

const today = () => formatDate(new Date().toISOString().slice(0, 10));

export default function PartyBills() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [partyBills, setPartyBills] = useState([]);
  const [players, setPlayers] = useState([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', gender: 'male', default_ratio: 1 });

  const [form, setForm] = useState({
    date: today(),
    name: 'Tiệc',
    note: '',
    base_amount: 0,
    extras: [{ name: 'Bánh + Tôm', amount: 0 }],
    participants: [],
  });

  const totalExtra = useMemo(
    () => form.extras.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [form.extras]
  );

  const sumRatios = useMemo(
    () => form.participants.reduce((sum, p) => sum + (Number(p.ratio_value) || 0), 0),
    [form.participants]
  );

  const unitPrice = useMemo(() => {
    const base = Number(form.base_amount) || 0;
    return sumRatios > 0 ? Math.round((base + totalExtra) / sumRatios) : 0;
  }, [form.base_amount, sumRatios, totalExtra]);

  const participantWithShare = useMemo(() => {
    return form.participants.map((p) => {
      const ratio = Number(p.ratio_value) || 0;
      const share = Math.round(ratio * unitPrice);
      return { ...p, share };
    });
  }, [form.participants, unitPrice]);

  const loadPartyBills = async () => {
    try {
      setLoading(true);
      const res = await partyBillsApi.getAll();
      setPartyBills(res.data || []);
    } catch (error) {
      console.error('Error loading party bills', error);
      alert('Không tải được danh sách tiệc');
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
      console.error('Error loading players', error);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const normalize = (str) =>
    (str || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
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
    const ratio = player.default_ratio_value ?? player.default_ratio ?? 1;
    updateField('participants', [
      ...form.participants,
      {
        user_id: player.id,
        name: player.name,
        gender: player.gender,
        ratio_value: ratio,
        default_ratio_value: ratio,
      },
    ]);
  };

  const handleCreatePlayer = async () => {
    if (!newPlayer.name.trim()) {
      alert('Nhập tên người chơi');
      return;
    }
    const slug = newPlayer.name.trim().toLowerCase().replace(/\s+/g, '');
    const email = `${slug || 'player'}${Date.now()}@party.local`;
    try {
      const payload = {
        name: newPlayer.name.trim(),
        gender: newPlayer.gender,
        default_ratio: newPlayer.default_ratio || 1,
        email,
        password: 'password',
      };
      const res = await playersApi.create(payload);
      await loadPlayers();
      setShowAddPlayer(false);
      setNewPlayer({ name: '', gender: 'male', default_ratio: 1 });
      // auto select
      handleSelectPlayer({
        id: res.data.id,
        name: res.data.name,
        gender: res.data.gender,
        default_ratio_value: res.data.default_ratio ?? payload.default_ratio ?? 1,
      });
    } catch (error) {
      console.error('Create player error', error);
      alert('Không thể tạo người chơi mới');
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

  const addExtra = () => updateField('extras', [...form.extras, { name: '', amount: 0 }]);
  const removeExtra = (idx) =>
    updateField(
      'extras',
      form.extras.filter((_, i) => i !== idx)
    );

  const addParticipant = () =>
    updateField('participants', [...form.participants, { name: '', ratio_value: 1 }]);
  const removeParticipant = (idx) =>
    updateField(
      'participants',
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
          .filter((x) => (x.name || '') !== '' && Number(x.amount) > 0)
          .map((x) => ({ name: x.name, amount: Number(x.amount) || 0 })),
        participants: form.participants
          .filter((p) => (p.name || '') !== '')
          .map((p) => ({
            user_id: p.user_id || null,
            name: p.name,
            ratio_value: Number(p.ratio_value) || 0,
          })),
      };

      if (payload.participants.length === 0) {
        alert('Vui lòng nhập ít nhất 1 người');
        return;
      }

      await partyBillsApi.create(payload);
      await loadPartyBills();
      alert('Đã tạo chia tiệc');
    } catch (error) {
      console.error('Error creating party bill', error);
      alert('Tạo chia tiệc thất bại');
    } finally {
      setSaving(false);
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
                onChange={(e) => updateField('date', e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tên/Nội dung</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Tiệc sinh nhật..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tổng tiền tiệc</label>
              <input
                type="number"
                value={form.base_amount}
                onChange={(e) => updateField('base_amount', e.target.value)}
                className="w-full border rounded px-3 py-2"
                min={0}
              />
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
                    onChange={(e) => updateExtra(idx, 'name', e.target.value)}
                    placeholder="Tên chi phí (ví dụ: Bánh kem)"
                    className="col-span-7 md:col-span-6 border rounded px-3 py-2"
                  />
                  <input
                    type="number"
                    value={extra.amount}
                    min={0}
                    onChange={(e) => updateExtra(idx, 'amount', e.target.value)}
                    className="col-span-4 md:col-span-3 border rounded px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => removeExtra(idx)}
                    className="col-span-1 text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addExtra}
                className="text-blue-600 text-sm hover:underline"
              >
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
                  <button
                    type="button"
                    onClick={() => setShowAddPlayer(true)}
                    className="text-xs text-blue-600 hover:underline"
                  >
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
                <div className="max-h-64 overflow-y-auto space-y-1 text-sm">
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
                        className="w-full text-left px-3 py-2 rounded border border-transparent hover:border-blue-300 hover:bg-blue-50"
                      >
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-600 flex gap-2">
                          <span>{p.gender === 'male' ? 'Nam' : p.gender === 'female' ? 'Nữ' : '-'}</span>
                          <span>Mức: {formatRatio(p.default_ratio_value ?? 1)}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                {participantWithShare.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5 md:col-span-4">
                      <div className="text-sm font-semibold text-gray-800">{p.name}</div>
                      <div className="text-xs text-gray-500">
                        {p.gender === 'male' ? 'Nam' : p.gender === 'female' ? 'Nữ' : '-'}
                      </div>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      value={p.ratio_value}
                      onChange={(e) => updateParticipant(idx, 'ratio_value', e.target.value)}
                      className="col-span-3 md:col-span-2 border rounded px-3 py-2"
                    />
                    <div className="col-span-3 md:col-span-4 text-right font-semibold text-blue-700">
                      {formatCurrencyRounded(p.share)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeParticipant(idx)}
                      className="col-span-1 text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
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
              <div className="text-lg font-semibold">
                {formatCurrencyRounded((Number(form.base_amount) || 0) + totalExtra)}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu chia tiệc'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Lịch sử chia tiệc</h3>
          {loading && <div className="text-sm text-gray-500">Đang tải...</div>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Ngày</th>
                <th className="text-left py-2 px-2">Tên</th>
                <th className="text-right py-2 px-2">Tổng</th>
                <th className="text-right py-2 px-2">Đơn giá</th>
                <th className="text-left py-2 px-2">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {partyBills.map((bill) => (
                <tr key={bill.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2">{bill.date}</td>
                  <td className="py-2 px-2">{bill.name || '-'}</td>
                  <td className="py-2 px-2 text-right">{formatCurrencyRounded(bill.total_amount)}</td>
                  <td className="py-2 px-2 text-right">{formatCurrencyRounded(bill.unit_price)}</td>
                  <td className="py-2 px-2">
                    <div className="text-xs text-gray-700">
                      {bill.participants?.map((p) => (
                        <div key={p.id} className="flex justify-between">
                          <span>{p.name} ({p.ratio_value})</span>
                          <span className="font-semibold">{formatCurrencyRounded(p.total_amount)}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {partyBills.length === 0 && (
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

      {showAddPlayer && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowAddPlayer(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
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
                    className="w-full border rounded px-3 py-2"
                  >
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
                <button
                  type="button"
                  onClick={() => setShowAddPlayer(false)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreatePlayer}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
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


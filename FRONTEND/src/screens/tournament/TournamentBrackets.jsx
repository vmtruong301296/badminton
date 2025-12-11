import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { playerListsApi, tournamentPlayersApi, bracketsApi } from '../../services/api';

export default function TournamentBrackets() {
  const [playerLists, setPlayerLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [brackets, setBrackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPlayerForm, setShowAddPlayerForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showOrganizeModal, setShowOrganizeModal] = useState(false);
  const [activeTab, setActiveTab] = useState('players'); // 'players' or 'brackets'

  const [playerFormData, setPlayerFormData] = useState({
    name: '',
    gender: 'male',
    level: '',
  });
  const bracketsContainerRef = useRef(null);
  const { hasPermission } = useAuth();
  const canCreateList = hasPermission('tournament_brackets.create_list');
  const canOrganize = hasPermission('tournament_brackets.organize');
  const canDeleteBrackets = hasPermission('tournament_brackets.delete');

  const [organizeFormData, setOrganizeFormData] = useState({
    number_of_brackets: 4,
    gender_distribution: 'mixed',
  });

  useEffect(() => {
    loadPlayerLists();
  }, []);

  useEffect(() => {
    if (selectedListId) {
      loadPlayers();
      loadBrackets();
    }
  }, [selectedListId]);

  const loadPlayerLists = async () => {
    try {
      setLoading(true);
      const response = await playerListsApi.getAll();
      setPlayerLists(response.data);
      
      // Auto-select default list or first list
      if (response.data.length > 0) {
        const defaultList = response.data.find(list => list.is_default) || response.data[0];
        setSelectedListId(defaultList.id);
      } else {
        // Nếu chưa có danh sách nào, tự động tạo danh sách mặc định
        try {
          const newListResponse = await playerListsApi.create({ 
            name: 'Danh sách mặc định', 
            is_default: true 
          });
          setPlayerLists([newListResponse.data]);
          setSelectedListId(newListResponse.data.id);
        } catch (createError) {
          console.error('Error creating default list:', createError);
          alert('Lỗi khi tạo danh sách mặc định: ' + (createError.response?.data?.message || createError.message));
        }
      }
    } catch (error) {
      console.error('Error loading player lists:', error);
      alert('Lỗi khi tải danh sách: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async () => {
    if (!selectedListId) return;
    try {
      const response = await tournamentPlayersApi.getAll({ player_list_id: selectedListId });
      setPlayers(response.data);
    } catch (error) {
      console.error('Error loading players:', error);
      alert('Lỗi khi tải VĐV: ' + (error.response?.data?.message || error.message));
    }
  };

  const loadBrackets = async () => {
    if (!selectedListId) return;
    try {
      const response = await bracketsApi.getAll(selectedListId);
      setBrackets(response.data);
    } catch (error) {
      console.error('Error loading brackets:', error);
      // Don't show error if no brackets exist yet
      if (error.response?.status !== 404) {
        alert('Lỗi khi tải bảng: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleCreateList = async () => {
    const name = prompt('Nhập tên danh sách mới:');
    if (!name) return;

    try {
      await playerListsApi.create({ name, is_default: false });
      await loadPlayerLists();
    } catch (error) {
      alert('Lỗi khi tạo danh sách: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    
    // Đảm bảo có danh sách được chọn
    let listId = selectedListId;
    if (!listId) {
      // Nếu chưa có danh sách, tạo danh sách mặc định
      try {
        const newListResponse = await playerListsApi.create({ 
          name: 'Danh sách mặc định', 
          is_default: true 
        });
        listId = newListResponse.data.id;
        setSelectedListId(listId);
        await loadPlayerLists(); // Reload để cập nhật danh sách
      } catch (createError) {
        alert('Vui lòng tạo danh sách trước khi thêm VĐV: ' + (createError.response?.data?.message || createError.message));
        return;
      }
    }

    try {
      await tournamentPlayersApi.create({
        ...playerFormData,
        player_list_id: listId,
      });
      setShowAddPlayerForm(false);
      setPlayerFormData({ name: '', gender: 'male', level: '' });
      await loadPlayers();
    } catch (error) {
      alert('Lỗi khi thêm VĐV: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeletePlayer = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa VĐV này?')) return;

    try {
      await tournamentPlayersApi.delete(id);
      await loadPlayers();
    } catch (error) {
      alert('Lỗi khi xóa VĐV: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Đảm bảo có danh sách được chọn
    let listId = selectedListId;
    if (!listId) {
      // Nếu chưa có danh sách, tạo danh sách mặc định
      try {
        const newListResponse = await playerListsApi.create({ 
          name: 'Danh sách mặc định', 
          is_default: true 
        });
        listId = newListResponse.data.id;
        setSelectedListId(listId);
        await loadPlayerLists(); // Reload để cập nhật danh sách
      } catch (createError) {
        alert('Vui lòng tạo danh sách trước khi import VĐV: ' + (createError.response?.data?.message || createError.message));
        return;
      }
    }

    try {
      const response = await tournamentPlayersApi.import(listId, file);
      alert(`Đã import ${response.data.imported} VĐV thành công`);
      if (response.data.errors && response.data.errors.length > 0) {
        console.warn('Import errors:', response.data.errors);
      }
      setShowImportModal(false);
      await loadPlayers();
    } catch (error) {
      alert('Lỗi khi import: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleOrganizeBrackets = async (e) => {
    e.preventDefault();
    
    // Đảm bảo có danh sách được chọn
    let listId = selectedListId;
    if (!listId) {
      // Nếu chưa có danh sách, tạo danh sách mặc định
      try {
        const newListResponse = await playerListsApi.create({ 
          name: 'Danh sách mặc định', 
          is_default: true 
        });
        listId = newListResponse.data.id;
        setSelectedListId(listId);
        await loadPlayerLists(); // Reload để cập nhật danh sách
      } catch (createError) {
        alert('Vui lòng tạo danh sách trước khi xếp bảng: ' + (createError.response?.data?.message || createError.message));
        return;
      }
    }

    try {
      // Đảm bảo player_list_id được gửi trong body
      const requestData = {
        ...organizeFormData,
        player_list_id: listId,
      };
      const response = await bracketsApi.organize(listId, requestData);
      alert(response.data.message);
      setShowOrganizeModal(false);
      await loadBrackets();
      setActiveTab('brackets');
    } catch (error) {
      alert('Lỗi khi xếp bảng: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteBrackets = async () => {
    if (!confirm('Bạn có chắc muốn xóa tất cả các bảng? Điều này sẽ không xóa VĐV.')) return;

    try {
      await bracketsApi.deleteAll(selectedListId);
      await loadBrackets();
    } catch (error) {
      alert('Lỗi khi xóa bảng: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleExportBrackets = async () => {
    if (!bracketsContainerRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(bracketsContainerRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = 'bang-thi-dau.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export image error', error);
      alert('Xuất ảnh bảng thi đấu thất bại. Vui lòng thử lại.');
    }
  };

  const selectedList = playerLists.find(list => list.id === selectedListId);
  const availablePlayers = players.filter(p => !p.brackets || p.brackets.length === 0);
  const assignedPlayers = players.filter(p => p.brackets && p.brackets.length > 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8 px-3 sm:px-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white shadow-sm border border-gray-100 rounded-2xl p-4 sm:p-5">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý & Xếp bảng thi đấu</h1>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row sm:items-center">
          <select
            value={selectedListId || ''}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedListId(value ? Number(value) : null);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
          >
            {playerLists.length === 0 ? (
              <option value="">Chưa có danh sách</option>
            ) : (
              playerLists.map(list => (
                <option key={list.id} value={list.id}>
                  {list.name} {list.is_default && '(Mặc định)'}
                </option>
              ))
            )}
          </select>
          {canCreateList && (
            <button
              onClick={handleCreateList}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 text-sm font-medium w-full sm:w-auto text-center"
            >
              + Tạo danh sách VĐV
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 bg-white shadow-sm rounded-2xl px-4">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setActiveTab('players')}
            className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'players'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
            }`}
          >
            Danh sách VĐV ({players.length})
          </button>
          <button
            onClick={() => setActiveTab('brackets')}
            className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'brackets'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
            }`}
          >
            Bảng thi đấu ({brackets.length})
          </button>
        </nav>
      </div>

      {/* Players Tab */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowAddPlayerForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 text-sm font-semibold w-full sm:w-auto text-center"
            >
              + Thêm VĐV thủ công
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow-sm hover:bg-purple-700 text-sm font-semibold w-full sm:w-auto text-center"
            >
              📥 Import Excel/CSV
            </button>
          </div>

          {/* Stats - wrap on small screens, hide descriptions on mobile */}
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[120px] bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100 flex-1">
              <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-gray-500">Tổng VĐV</div>
              <div className="text-xl sm:text-3xl font-bold text-gray-900 mt-1">{players.length}</div>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Tất cả VĐV trong danh sách</p>
            </div>
            <div className="min-w-[120px] bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100 flex-1">
              <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-gray-500">Chưa xếp bảng</div>
              <div className="text-xl sm:text-3xl font-bold text-amber-600 mt-1">{availablePlayers.length}</div>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Sẵn sàng để xếp</p>
            </div>
            <div className="min-w-[120px] bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100 flex-1">
              <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-gray-500">Đã xếp bảng</div>
              <div className="text-xl sm:text-3xl font-bold text-emerald-600 mt-1">{assignedPlayers.length}</div>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Đang nằm trong bảng thi đấu</p>
            </div>
          </div>

          {/* Players Table */}
          <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">STT</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Họ Tên</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Giới tính</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Level</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {players.map((player, idx) => (
                  <tr
                    key={player.id}
                    className={`${player.gender === 'male' ? 'bg-blue-50/40' : 'bg-rose-50/40'}`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {player.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.gender === 'male' ? 'Nam' : 'Nữ'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.level || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {player.brackets && player.brackets.length > 0 ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-100">
                          Đã xếp bảng
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                          Chưa xếp
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeletePlayer(player.id)}
                        disabled={player.brackets && player.brackets.length > 0}
                        className={`font-semibold ${player.brackets && player.brackets.length > 0
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-red-600 hover:text-red-700'}`}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {players.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      Chưa có VĐV nào. Hãy thêm VĐV để bắt đầu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Brackets Tab */}
      {activeTab === 'brackets' && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowOrganizeModal(true)}
              className={`px-4 py-2 rounded-lg shadow-sm text-sm font-semibold ${
                canOrganize && availablePlayers.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!canOrganize || availablePlayers.length === 0}
            >
              🎯 Xếp bảng
            </button>
            {brackets.length > 0 && (
              <button
                onClick={handleDeleteBrackets}
                className={`px-4 py-2 rounded-lg shadow-sm text-sm font-semibold ${
                  canDeleteBrackets
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!canDeleteBrackets}
              >
                Xóa tất cả
              </button>
            )}
            {brackets.length > 0 && (
              <button
                onClick={handleExportBrackets}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 text-sm font-semibold"
              >
                📸 Xuất bảng
              </button>
            )}
          </div>

          {/* Brackets Grid */}
          {brackets.length > 0 ? (
            <div ref={bracketsContainerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {([...brackets].sort((a, b) => {
                const order = { male_only: 0, female_only: 1, mixed: 2 };
                return (order[a.gender_distribution] ?? 3) - (order[b.gender_distribution] ?? 3);
              })).map((bracket) => {
                const playersByGender = bracket.players.reduce((acc, p) => {
                  if (!acc[p.gender]) acc[p.gender] = [];
                  acc[p.gender].push(p);
                  return acc;
                }, {});

                return (
                  <div key={bracket.id} className="bg-white shadow-sm border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{bracket.name}</h3>
                        {/* <p className="text-xs text-gray-500">Seed: {bracket.random_seed?.slice(-6) || 'N/A'}</p> */}
                      </div>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {bracket.players.length} VĐV
                      </span>
                    </div>
                    <div className="space-y-3">
                      {playersByGender.male && playersByGender.male.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-semibold text-gray-800">
                            Nam ({playersByGender.male.length})
                          </div>
                            <span className="text-xs text-gray-400">Level</span>
                          </div>
                          <div className="space-y-1">
                            {playersByGender.male.map((player) => (
                              <div key={player.id} className="flex items-center text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                                <span className="mr-2 text-gray-400">•</span>
                                <span className="font-medium">{player.name}</span>
                                <span className="ml-auto text-xs text-gray-500">{player.level ? `Level ${player.level}` : 'No level'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {playersByGender.female && playersByGender.female.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-semibold text-gray-800">
                            Nữ ({playersByGender.female.length})
                          </div>
                            <span className="text-xs text-gray-400">Level</span>
                          </div>
                          <div className="space-y-1">
                            {playersByGender.female.map((player) => (
                              <div key={player.id} className="flex items-center text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                                <span className="mr-2 text-gray-400">•</span>
                                <span className="font-medium">{player.name}</span>
                                <span className="ml-auto text-xs text-gray-500">{player.level ? `Level ${player.level}` : 'No level'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 text-center text-gray-600">
              <p className="text-base font-semibold">Chưa có bảng nào</p>
              <p className="text-sm text-gray-500 mt-1">Hãy bấm "Xếp bảng" để tạo bảng thi đấu.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Player Form Modal */}
      {showAddPlayerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Thêm VĐV</h2>
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ Tên *
                </label>
                <input
                  type="text"
                  required
                  value={playerFormData.name}
                  onChange={(e) => setPlayerFormData({ ...playerFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giới tính *
                </label>
                <select
                  required
                  value={playerFormData.gender}
                  onChange={(e) => setPlayerFormData({ ...playerFormData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={playerFormData.level}
                  onChange={(e) => setPlayerFormData({ ...playerFormData, level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập level (1, 2, 3...)"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddPlayerForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Import VĐV từ file</h2>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="mb-2 font-semibold">Định dạng file hỗ trợ: Excel (.xlsx, .xls) hoặc CSV</p>
                <p className="mb-2">Cấu trúc file (dòng đầu tiên là tiêu đề, có thể bỏ qua):</p>
                <div className="bg-gray-100 p-3 rounded text-xs space-y-2">
                  <div>
                    <p className="font-semibold mb-1">Cột 1: Họ Tên (bắt buộc)</p>
                    <p className="font-semibold mb-1">Cột 2: Giới tính (bắt buộc)</p>
                    <p className="font-semibold mb-1">Cột 3: Level (bắt buộc, chỉ nhập số 1,2,3,...)</p>
                  </div>
                  <div className="border-t pt-2">
                    <p className="font-semibold mb-1">Ví dụ:</p>
                    <pre className="whitespace-pre-wrap">
Họ Tên,Giới tính,Level{'\n'}
Nguyễn Văn A,male,1{'\n'}
Trần Thị B,female,2{'\n'}
Lê Văn C,nam,1{'\n'}
Phạm Thị D,nữ,3
                    </pre>
                  </div>
                </div>
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                  <p className="font-semibold text-blue-800 mb-1">Lưu ý về Giới tính:</p>
                  <p className="text-blue-700">Chấp nhận: "male" hoặc "nam" (Nam), "female" hoặc "nữ" (Nữ)</p>
                </div>
              </div>
              <div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleImportFile}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Organize Brackets Modal */}
      {showOrganizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Xếp bảng thi đấu</h2>
            <form onSubmit={handleOrganizeBrackets} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số bảng *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="50"
                  value={organizeFormData.number_of_brackets}
                  onChange={(e) => setOrganizeFormData({ ...organizeFormData, number_of_brackets: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phân bổ giới tính *
                </label>
                <select
                  required
                  value={organizeFormData.gender_distribution}
                  onChange={(e) => setOrganizeFormData({ ...organizeFormData, gender_distribution: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mixed">Chia đều giới tính</option>
                  <option value="male_only">Chỉ nam</option>
                  <option value="female_only">Chỉ nữ</option>
                </select>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                <p>Lưu ý: Chỉ các VĐV chưa được xếp bảng mới được xếp vào bảng mới.</p>
                <p className="mt-1">Hiện có {availablePlayers.length} VĐV chưa xếp bảng.</p>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowOrganizeModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Xếp bảng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

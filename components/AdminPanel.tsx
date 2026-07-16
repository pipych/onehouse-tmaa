'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { addGuest, removeGuest, getGuests } from '../lib/guests';
import {
  ArrowLeft, ShieldAlert, Users, Folder, Calendar, Package,
  User, UserPlus, ShieldCheck, Edit2, Save, X, Plus, Upload,
  Check, Play, Flag, RotateCcw, Library, Server as ServerIcon, Trash2
} from 'lucide-react';

const AnvilIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 10H6a4 4 0 0 1-4-4 1 1 0 0 1 1-1h4" />
    <path d="M7 5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1" />
    <path d="M17 10h1a4 4 0 0 0 4-4 1 1 0 0 0-1-1h-4" />
    <path d="M9 12v5" />
    <path d="M15 12v5" />
    <path d="M5 20a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3 1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z" />
  </svg>
);

// --- Types ---
interface Player {
  id: string; player_id: string; tg_id: number; tg_username: string;
  mc_nickname: string; rp_name: string; avatar_url: string;
  roles: string[]; professions?: string[];
  party?: string; season?: string; status?: string;
}

interface CustomRole {
  id?: string; name: string; color: string; canEditConstitution: boolean;
}

interface PastSeason {
  id: number; season_number: number; days_count: number;
  end_date: string; start_date?: string;
}

type MainTab = 'home' | 'players' | 'server';
type PlayersSubTab = 'professions' | 'profiles' | 'characters' | 'guests' | 'roles';
type ServerSubTab = 'seasons' | 'modpack';

interface AdminPanelProps {
  onBack: () => void;
  // Season state (shared with parent)
  seasonEnded: boolean;
  currentSeasonNum: number;
  currentSeasonName: string;
  seasonLoading: boolean;
  setSeasonLoading: (v: boolean) => void;
  pastSeasons: PastSeason[];
  // Callbacks
  onSeasonEnd: () => Promise<void>;
  onSeasonUndoEnd: () => Promise<void>;
  onSeasonStartNew: (serverId: string) => Promise<void>;
  onSeasonRestore: (id: number, num: number) => Promise<void>;
  onSeasonDelete: (id: number, num: number) => Promise<void>;
  onRefreshSeason: () => Promise<void>;
  onRefreshPlayers: () => void;
  onRefreshAllPlayers: () => void;
  // File upload utility
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>, setUrl: (url: string) => void, setLoading: (v: boolean) => void) => Promise<void>;
}

export default function AdminPanel(props: AdminPanelProps) {
  // --- Main / sub tabs ---
  const [mainTab, setMainTab] = useState<MainTab>('home');
  const [playersSubTab, setPlayersSubTab] = useState<PlayersSubTab>('profiles');
  const [serverSubTab, setServerSubTab] = useState<ServerSubTab>('seasons');

  // --- Data loaded internally ---
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [professions, setProfessions] = useState<CustomRole[]>([]);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [guestList, setGuestList] = useState<{ tg_id: number; created_at: string; added_by: string }[]>([]);

  // --- Form state: Profiles ---
  const [addMcNickname, setAddMcNickname] = useState('');
  const [addTgId, setAddTgId] = useState('');
  const [addTgUsername, setAddTgUsername] = useState('');
  const [addAvatarUrl, setAddAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editPlayerData, setEditPlayerData] = useState({ mc_nickname: '', tg_id: '', tg_username: '', avatar_url: '', tg_id_2: '' });

  // --- Form state: Characters ---
  const [addRpName, setAddRpName] = useState('');
  const [addParty, setAddParty] = useState('');
  const [addProfessions, setAddProfessions] = useState<string[]>([]);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [editCharData, setEditCharData] = useState({ rp_name: '', party: 'РќРµС‚ РїР°СЂС‚РёРё', avatar_url: '', professions: [] as string[] });

  // --- Form state: Roles ---
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#c0ff00');
  const [newRolePerm, setNewRolePerm] = useState(false);

  // --- Form state: Professions ---
  const [newProfessionName, setNewProfessionName] = useState('');
  const [newProfessionColor, setNewProfessionColor] = useState('#c0ff00');

  // --- Form state: Guests ---
  const [guestTgId, setGuestTgId] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  // --- Form state: Seasons ---
  const [newSeasonServerId, setNewSeasonServerId] = useState('');

  // --- Data loading ---
  const loadAllPlayersData = async () => {
    const { data } = await supabase.from('players').select('*').order('mc_nickname');
    if (data) setAllPlayers(data);
  };

  const loadPlayersData = async () => {
    const { data } = await supabase.from('characters').select('*').eq('season', props.currentSeasonName).order('rp_name');
    if (data) setPlayers(data as Player[]);
  };

  const loadCustomRoles = async () => {
    const { data } = await supabase.from('roles').select('*').order('name');
    if (data) setCustomRoles(data);
  };

  const loadProfessionsData = async () => {
    const { data } = await supabase.from('professions').select('*').order('name');
    if (data) setProfessions(data);
  };

  const loadGuestsData = async () => {
    const guests = await getGuests();
    setGuestList(guests || []);
  };

  useEffect(() => {
    loadAllPlayersData();
    loadPlayersData();
    loadCustomRoles();
    loadProfessionsData();
    loadGuestsData();
  }, [props.currentSeasonName]);

  // --- Helpers ---
  const getProfessionColor = (name: string) => {
    const found = professions.find(p => p.name.toLowerCase() === name.toLowerCase());
    return found ? found.color : '#888888';
  };

  // --- Role operations ---
  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    const { error } = await supabase.from('roles').insert({
      name: newRoleName.toLowerCase(),
      color: newRoleColor,
      canEditConstitution: newRolePerm
    });
    if (error) { alert('РћС€РёР±РєР°: ' + error.message); return; }
    setNewRoleName(''); setNewRoleColor('#c0ff00'); setNewRolePerm(false);
    loadCustomRoles();
  };

  const saveRoleToDb = async (role: CustomRole) => {
    if (!role.id) return;
    await supabase.from('roles').update({ name: role.name, color: role.color, canEditConstitution: role.canEditConstitution }).eq('id', role.id);
  };

  const handleRoleChange = (roleId: string, field: string, value: any) => {
    setCustomRoles(prev => prev.map(r => r.id === roleId ? { ...r, [field]: value } : r));
  };

  // --- Guest operations ---
  const handleAddGuest = async () => {
    const tgId = parseInt(guestTgId);
    if (!tgId) return;
    setGuestLoading(true);
    const ok = await addGuest(tgId, 'РђРґРјРёРЅ');
    if (ok) { setGuestTgId(''); loadGuestsData(); }
    else alert('РћС€РёР±РєР° РґРѕР±Р°РІР»РµРЅРёСЏ РіРѕСЃС‚СЏ');
    setGuestLoading(false);
  };

  const handleRemoveGuest = async (tgId: number) => {
    const ok = await removeGuest(tgId);
    if (ok) loadGuestsData();
    else alert('РћС€РёР±РєР° СѓРґР°Р»РµРЅРёСЏ РіРѕСЃС‚СЏ');
  };

  // ===================================================================
  // RENDER
  // ===================================================================
  return (
    <div className="fixed inset-0 z-50 bg-[#0c0e11] flex flex-col animate-fade-in overflow-hidden">

      {/* --- Top bar --- */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 shrink-0">
        <button
          onClick={props.onBack}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 active:scale-90 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <ShieldAlert size={18} className="text-[#c0ff00]" />
          РђРґРјРёРЅ-РїР°РЅРµР»СЊ
        </h2>
      </div>

      {/* --- Content --- */}
      <div className="flex-1 overflow-y-auto px-4 py-5 pb-28 no-scrollbar">
        <div className="max-w-lg mx-auto space-y-5">

          {/* ==================== Р“Р›РђР’РќРђРЇ ==================== */}
          {mainTab === 'home' && (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-20 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-[#c0ff00]/10 border border-[#c0ff00]/20 flex items-center justify-center">
                <ShieldAlert size={36} className="text-[#c0ff00]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">РђРґРјРёРЅ-РїР°РЅРµР»СЊ</h3>
                <p className="text-sm text-gray-500">РЈРїСЂР°РІР»РµРЅРёРµ СЃРµСЂРІРµСЂРѕРј Рё РёРіСЂРѕРєР°РјРё</p>
              </div>
            </div>
          )}

          {/* ==================== РР“Р РћРљР ==================== */}
          {mainTab === 'players' && (
            <>
              {/* Sub-tabs */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {([
                  { key: 'profiles' as const, label: 'РџСЂРѕС„РёР»Рё', icon: <User size={13} /> },
                  { key: 'characters' as const, label: 'РџРµСЂСЃРѕРЅР°Р¶Рё', icon: <Users size={13} /> },
                  { key: 'professions' as const, label: 'РџСЂРѕС„РµСЃСЃРёРё', icon: <AnvilIcon size={13} /> },
                  { key: 'roles' as const, label: 'Р РѕР»Рё', icon: <ShieldCheck size={13} /> },
                  { key: 'guests' as const, label: 'Р“РѕСЃС‚Рё', icon: <UserPlus size={13} /> },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setPlayersSubTab(tab.key)}
                    className={`text-xs font-bold uppercase px-4 py-2 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      playersSubTab === tab.key
                        ? 'bg-[#c0ff00]/20 text-[#c0ff00] border border-[#c0ff00]/30'
                        : 'bg-white/5 text-gray-400 border border-white/5'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* --- РџСЂРѕС„РёР»Рё --- */}
              {playersSubTab === 'profiles' && (
                <div className="space-y-4">
                  <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
                    <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider"><UserPlus size={16} /><span>РЎРѕР·РґР°С‚СЊ Minecraft-РїСЂРѕС„РёР»СЊ</span></div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Minecraft РЅРёРє *" value={addMcNickname} onChange={e => setAddMcNickname(e.target.value)} className="ui-input"/>
                      <input type="number" placeholder="Telegram ID" value={addTgId} onChange={e => setAddTgId(e.target.value)} className="ui-input"/>
                      <input type="text" placeholder="Telegram Username" value={addTgUsername} onChange={e => setAddTgUsername(e.target.value)} className="ui-input"/>
                      <label className="ui-input flex items-center gap-2 cursor-pointer overflow-hidden relative">
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => props.handleFileUpload(e, setAddAvatarUrl, setIsUploading)} />
                        <Upload size={14} className={isUploading ? 'animate-bounce' : ''} />
                        <span className="text-xs text-gray-500 truncate">{isUploading ? 'Р—Р°РіСЂСѓР·РєР°...' : addAvatarUrl ? 'РђРІР°С‚Р°СЂ РІС‹Р±СЂР°РЅ' : 'Р—Р°РіСЂСѓР·РёС‚СЊ Р°РІР°С‚Р°СЂ'}</span>
                      </label>
                    </div>
                    <button onClick={async () => {
                      const mcNick = addMcNickname.trim();
                      if (!mcNick) return;
                      const tgIdNum = addTgId ? parseInt(addTgId) : null;
                      const { data: existing } = await supabase.from('players').select('id').eq('mc_nickname', mcNick).limit(1);
                      if (existing && existing.length > 0) { alert('РРіСЂРѕРє СЃ С‚Р°РєРёРј РЅРёРєРѕРј СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚!'); return; }
                      if (tgIdNum) {
                        const { data: tgExists } = await supabase.from('players').select('id').eq('tg_id', tgIdNum).limit(1);
                        if (tgExists && tgExists.length > 0) { alert('Р­С‚РѕС‚ Telegram ID СѓР¶Рµ РїСЂРёРІСЏР·Р°РЅ!'); return; }
                      }
                      const { error } = await supabase.from('players').insert({ mc_nickname: mcNick, tg_id: tgIdNum, tg_username: addTgUsername || '', avatar_url: addAvatarUrl || '' });
                      if (error) { alert(`РћС€РёР±РєР°: ${error.message}`); return; }
                      setAddMcNickname(''); setAddTgId(''); setAddTgUsername(''); setAddAvatarUrl('');
                      loadAllPlayersData(); props.onRefreshAllPlayers();
                    }} className="ui-pill-btn w-full justify-center py-3"><Check size={16} /><span>РЎРѕР·РґР°С‚СЊ РїСЂРѕС„РёР»СЊ</span></button>
                  </div>

                  <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 shadow-xl">
                    <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider mb-3"><Users size={16} /><span>Р’СЃРµ РїСЂРѕС„РёР»Рё ({allPlayers.length})</span></div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {allPlayers.map((p: any) => (
                        <div key={p.id}>
                          {editingPlayerId === p.id ? (
                            <div className="bg-black/30 border border-[#c0ff00]/20 p-3 rounded-xl space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <input type="text" placeholder="Minecraft РЅРёРє" value={editPlayerData.mc_nickname} onChange={e => setEditPlayerData(prev => ({...prev, mc_nickname: e.target.value}))} className="ui-input text-xs" />
                                <input type="number" placeholder="Telegram ID" value={editPlayerData.tg_id} onChange={e => setEditPlayerData(prev => ({...prev, tg_id: e.target.value}))} className="ui-input text-xs" />
                                <input type="number" placeholder="Р’С‚РѕСЂРѕР№ Telegram ID" value={editPlayerData.tg_id_2} onChange={e => setEditPlayerData(prev => ({...prev, tg_id_2: e.target.value}))} className="ui-input text-xs" />
                                <input type="text" placeholder="TG Username" value={editPlayerData.tg_username} onChange={e => setEditPlayerData(prev => ({...prev, tg_username: e.target.value}))} className="ui-input text-xs" />
                              </div>
                              <label className="ui-input flex items-center gap-2 cursor-pointer overflow-hidden relative">
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => props.handleFileUpload(e, (url) => setEditPlayerData(prev => ({...prev, avatar_url: url})), setIsUploading)} />
                                <Upload size={12} className={isUploading ? 'animate-bounce' : ''} />
                                <span className="text-[10px] text-gray-500 truncate">{editPlayerData.avatar_url ? 'вњ“ РђРІР°С‚Р°СЂ' : 'РђРІР°С‚Р°СЂ'}</span>
                              </label>
                              <div className="flex gap-2">
                                <button onClick={async () => {
                                  const payload = { ...editPlayerData, tg_id: editPlayerData.tg_id ? parseInt(editPlayerData.tg_id) : null, tg_id_2: editPlayerData.tg_id_2 ? parseInt(editPlayerData.tg_id_2) : null };
                                  const { error } = await supabase.from('players').update(payload).eq('id', p.id);
                                  if (error) { alert(`РћС€РёР±РєР°: ${error.message}`); return; }
                                  setEditingPlayerId(null);
                                  loadAllPlayersData(); props.onRefreshAllPlayers();
                                }} className="ui-pill-btn flex-1 justify-center !bg-[#c0ff00] !text-black text-xs py-1.5"><Save size={12} /><span>РЎРѕС…СЂР°РЅРёС‚СЊ</span></button>
                                <button onClick={() => setEditingPlayerId(null)} className="ui-pill-btn px-4 !bg-white/5 text-xs py-1.5"><X size={12} /></button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-black/20 border border-white/5 p-3 rounded-xl group">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-[#1c2026] border border-white/10 overflow-hidden flex-shrink-0">
                                  {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <User size={14} className="m-auto text-gray-600" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-bold text-white truncate">{p.mc_nickname}</div>
                                  <div className="text-[10px] text-gray-500">{p.tg_id ? `TG: ${p.tg_id}` : 'Р‘РµР· TG'} {p.tg_username ? `@${p.tg_username}` : ''}{p.tg_id_2 ? ` | TG2: ${p.tg_id_2}` : ''}</div>
                                </div>
                              </div>
                              <button onClick={() => { setEditingPlayerId(p.id); setEditPlayerData({ mc_nickname: p.mc_nickname, tg_id: p.tg_id?.toString() || '', tg_username: p.tg_username || '', avatar_url: p.avatar_url || '', tg_id_2: p.tg_id_2?.toString() || '' }); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/5 rounded-full text-gray-400 hover:text-[#c0ff00]"><Edit2 size={14} /></button>
                            </div>
                          )}
                        </div>
                      ))}
                      {allPlayers.length === 0 && <p className="text-xs text-gray-500 text-center py-4">РќРµС‚ РїСЂРѕС„РёР»РµР№</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* --- РџРµСЂСЃРѕРЅР°Р¶Рё --- */}
              {playersSubTab === 'characters' && (
                <div className="space-y-4">
                  <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
                    <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider"><UserPlus size={16} /><span>РЎРѕР·РґР°С‚СЊ РїРµСЂСЃРѕРЅР°Р¶Р° РґР»СЏ СЃРµР·РѕРЅР°</span></div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Minecraft РЅРёРє РёРіСЂРѕРєР° *" value={addMcNickname} onChange={e => setAddMcNickname(e.target.value)} className="ui-input"/>
                      <input type="text" placeholder="RP-РёРјСЏ РїРµСЂСЃРѕРЅР°Р¶Р° *" value={addRpName} onChange={e => setAddRpName(e.target.value)} className="ui-input"/>
                      <input type="text" placeholder="РџР°СЂС‚РёСЏ" value={addParty} onChange={e => setAddParty(e.target.value)} className="ui-input"/>
                      <label className="ui-input flex items-center gap-2 cursor-pointer overflow-hidden relative">
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => props.handleFileUpload(e, setAddAvatarUrl, setIsUploading)} />
                        <Upload size={14} className={isUploading ? 'animate-bounce' : ''} />
                        <span className="text-xs text-gray-500 truncate">{isUploading ? 'Р—Р°РіСЂСѓР·РєР°...' : addAvatarUrl ? 'РђРІР°С‚Р°СЂ РІС‹Р±СЂР°РЅ' : 'Р—Р°РіСЂСѓР·РёС‚СЊ Р°РІР°С‚Р°СЂ'}</span>
                      </label>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">РџСЂРѕС„РµСЃСЃРёРё РїРµСЂСЃРѕРЅР°Р¶Р°</div>
                      <div className="flex flex-wrap gap-2">
                        {professions.map(prof => (
                          <button key={prof.name} onClick={() => { setAddProfessions(prev => prev.includes(prof.name) ? prev.filter(r => r !== prof.name) : [...prev, prof.name]); }} className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${addProfessions.includes(prof.name) ? 'border-current' : 'border-white/10 opacity-40'}`} style={{ color: prof.color, backgroundColor: addProfessions.includes(prof.name) ? `${prof.color}20` : 'transparent' }}>{prof.name.toUpperCase()}</button>
                        ))}
                        {professions.length === 0 && <span className="text-xs text-gray-500">РќРµС‚ РїСЂРѕС„РµСЃСЃРёР№</span>}
                      </div>
                    </div>
                    <button onClick={async () => {
                      if (!addMcNickname.trim() || !addRpName.trim()) return;
                      const { data: playerData } = await supabase.from('players').select('id').eq('mc_nickname', addMcNickname.trim()).limit(1);
                      const player = playerData && playerData.length > 0 ? playerData[0] : null;
                      if (!player) { alert('РРіСЂРѕРє РЅРµ РЅР°Р№РґРµРЅ. РЎРЅР°С‡Р°Р»Р° СЃРѕР·РґР°Р№ РїСЂРѕС„РёР»СЊ.'); return; }
                      const { data: existingChars } = await supabase.from('characters').select('professions').eq('player_id', player.id).order('created_at', { ascending: false }).limit(1);
                      const inheritedProfs = existingChars?.[0]?.professions || [];
                      const finalProfs = addProfessions.length > 0 ? Array.from(new Set([...inheritedProfs, ...addProfessions])) : inheritedProfs;
                      const { error } = await supabase.from('characters').insert({ player_id: player.id, mc_nickname: addMcNickname.trim(), rp_name: addRpName.trim(), party: addParty || 'РќРµС‚ РїР°СЂС‚РёРё', professions: finalProfs, avatar_url: addAvatarUrl || '', season: props.currentSeasonName, status: 'alive' });
                      if (error) { alert(`РћС€РёР±РєР°: ${error.message}`); return; }
                      setAddMcNickname(''); setAddRpName(''); setAddParty('РќРµС‚ РїР°СЂС‚РёРё'); setAddProfessions([]); setAddAvatarUrl('');
                      loadPlayersData(); props.onRefreshPlayers();
                    }} className="ui-pill-btn w-full justify-center py-3"><Plus size={16} /><span>РЎРѕР·РґР°С‚СЊ РїРµСЂСЃРѕРЅР°Р¶Р°</span></button>
                  </div>

                  <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 shadow-xl">
                    <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider mb-3"><Users size={16} /><span>РџРµСЂСЃРѕРЅР°Р¶Рё СЃРµР·РѕРЅР° ({players.length})</span></div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {players.map((c: Player) => (
                        <div key={c.id}>
                          {editingCharId === c.id ? (
                            <div className="bg-black/30 border border-[#c0ff00]/20 p-3 rounded-xl space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <input type="text" placeholder="RP-РёРјСЏ" value={editCharData.rp_name} onChange={e => setEditCharData(prev => ({...prev, rp_name: e.target.value}))} className="ui-input text-xs" />
                                <input type="text" placeholder="РџР°СЂС‚РёСЏ" value={editCharData.party} onChange={e => setEditCharData(prev => ({...prev, party: e.target.value}))} className="ui-input text-xs" />
                              </div>
                              <label className="ui-input flex items-center gap-2 cursor-pointer overflow-hidden relative">
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => props.handleFileUpload(e, (url) => setEditCharData(prev => ({...prev, avatar_url: url})), setIsUploading)} />
                                <Upload size={12} className={isUploading ? 'animate-bounce' : ''} />
                                <span className="text-[10px] text-gray-500 truncate">{editCharData.avatar_url ? 'вњ“ РђРІР°С‚Р°СЂ' : 'Р—Р°РіСЂСѓР·РёС‚СЊ Р°РІР°С‚Р°СЂ'}</span>
                              </label>
                              <div className="space-y-1.5">
                                <div className="text-[9px] text-gray-500 uppercase">РџСЂРѕС„РµСЃСЃРёРё</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {professions.map(prof => (
                                    <button key={prof.name} onClick={() => { setEditCharData(prev => ({...prev, professions: prev.professions.includes(prof.name) ? prev.professions.filter(r => r !== prof.name) : [...prev.professions, prof.name]})); }} className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all ${editCharData.professions.includes(prof.name) ? 'border-current' : 'border-white/10 opacity-40'}`} style={{ color: prof.color, backgroundColor: editCharData.professions.includes(prof.name) ? `${prof.color}20` : 'transparent' }}>{prof.name.toUpperCase()}</button>
                                  ))}
                                  {professions.length === 0 && <span className="text-[10px] text-gray-500">РќРµС‚ РїСЂРѕС„РµСЃСЃРёР№</span>}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={async () => {
                                  const { error } = await supabase.from('characters').update({ rp_name: editCharData.rp_name, party: editCharData.party, avatar_url: editCharData.avatar_url, professions: editCharData.professions }).eq('id', c.id);
                                  if (error) { alert(`РћС€РёР±РєР°: ${error.message}`); return; }
                                  setEditingCharId(null);
                                  loadPlayersData(); props.onRefreshPlayers();
                                }} className="ui-pill-btn flex-1 justify-center !bg-[#c0ff00] !text-black text-xs py-1.5"><Save size={12} /><span>РЎРѕС…СЂР°РЅРёС‚СЊ</span></button>
                                <button onClick={() => setEditingCharId(null)} className="ui-pill-btn px-4 !bg-white/5 text-xs py-1.5"><X size={12} /></button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-black/20 border border-white/5 p-3 rounded-xl group">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-[#1c2026] border border-white/10 overflow-hidden flex-shrink-0">
                                  {c.avatar_url ? <img src={c.avatar_url} className="w-full h-full object-cover" /> : <User size={14} className="m-auto text-gray-600" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-bold text-white truncate">{c.rp_name}</div>
                                  <div className="text-[10px] text-gray-500">{c.mc_nickname} В· {c.party}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex gap-1">
                                  {c.professions?.slice(0, 2).map((p, i) => (
                                    <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${getProfessionColor(p)}20`, color: getProfessionColor(p) }}>{p}</span>
                                  ))}
                                </div>
                                <button onClick={() => { setEditingCharId(c.id); setEditCharData({ rp_name: c.rp_name, party: c.party || 'РќРµС‚ РїР°СЂС‚РёРё', avatar_url: c.avatar_url || '', professions: c.professions || [] }); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/5 rounded-full text-gray-400 hover:text-[#c0ff00]"><Edit2 size={14} /></button>
                                <button onClick={async () => {
                                  if (!confirm('РЈРґР°Р»РёС‚СЊ РїРµСЂСЃРѕРЅР°Р¶Р°?')) return;
                                  const { error } = await supabase.from('characters').delete().eq('id', c.id);
                                  if (!error) { loadPlayersData(); props.onRefreshPlayers(); }
                                }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/5 rounded-full text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {players.length === 0 && <p className="text-xs text-gray-500 text-center py-4">РќРµС‚ РїРµСЂСЃРѕРЅР°Р¶РµР№</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* --- РџСЂРѕС„РµСЃСЃРёРё --- */}
              {playersSubTab === 'professions' && (
                <div className="space-y-4">
                  <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
                    <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider"><AnvilIcon size={16} /><span>РЎРѕР·РґР°С‚СЊ РїСЂРѕС„РµСЃСЃРёСЋ</span></div>
                    <div className="flex gap-2 items-end">
                      <input type="text" placeholder="РќР°Р·РІР°РЅРёРµ РїСЂРѕС„РµСЃСЃРёРё" value={newProfessionName} onChange={e => setNewProfessionName(e.target.value)} className="ui-input flex-1"/>
                      <input type="color" value={newProfessionColor} onChange={e => setNewProfessionColor(e.target.value)} className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"/>
                    </div>
                    <button onClick={async () => {
                      if (!newProfessionName.trim()) return;
                      const { error } = await supabase.from('professions').insert({ name: newProfessionName.toLowerCase(), color: newProfessionColor });
                      if (!error) { setNewProfessionName(''); loadProfessionsData(); }
                      else alert('РћС€РёР±РєР° СЃРѕР·РґР°РЅРёСЏ РїСЂРѕС„РµСЃСЃРёРё');
                    }} className="ui-pill-btn w-full justify-center py-3"><AnvilIcon size={14} /><span>РЎРѕР·РґР°С‚СЊ РїСЂРѕС„РµСЃСЃРёСЋ</span></button>
                  </div>

                  <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 shadow-xl">
                    <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider mb-3"><AnvilIcon size={16} /><span>Р’СЃРµ РїСЂРѕС„РµСЃСЃРёРё</span></div>
                    <div className="space-y-2">
                      {professions.map((prof) => (
                        <div key={prof.id} className="flex items-center gap-3 bg-black/20 border border-white/5 p-3 rounded-xl">
                          <input type="color" value={prof.color} onChange={e => { setProfessions(ps => ps.map(p => p.id === prof.id ? { ...p, color: e.target.value } : p)); }} onBlur={async () => { if (!prof.id) return; await supabase.from('professions').update({ color: prof.color }).eq('id', prof.id); }} className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer flex-shrink-0"/>
                          <input type="text" value={prof.name} onChange={e => { setProfessions(ps => ps.map(p => p.id === prof.id ? { ...p, name: e.target.value } : p)); }} onBlur={async () => { if (!prof.id) return; await supabase.from('professions').update({ name: prof.name }).eq('id', prof.id); }} className="bg-transparent text-sm font-bold flex-1 min-w-0" style={{ color: prof.color }}/>
                        </div>
                      ))}
                      {professions.length === 0 && <p className="text-xs text-gray-500 text-center py-4">РќРµС‚ РїСЂРѕС„РµСЃСЃРёР№</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* --- Р РѕР»Рё --- */}
              {playersSubTab === 'roles' && (
                <div className="space-y-4">
                  <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
                    <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider"><ShieldCheck size={16} /><span>РЎРѕР·РґР°С‚СЊ СЂРѕР»СЊ</span></div>
                    <div className="flex gap-2 items-end">
                      <input type="text" placeholder="РќР°Р·РІР°РЅРёРµ СЂРѕР»Рё" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} className="ui-input flex-1"/>
                      <input type="color" value={newRoleColor} onChange={e => setNewRoleColor(e.target.value)} className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"/>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-400">
                      <input type="checkbox" checked={newRolePerm} onChange={e => setNewRolePerm(e.target.checked)} className="accent-[#c0ff00]"/>
                      РњРѕР¶РµС‚ СЂРµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РєРѕРЅСЃС‚РёС‚СѓС†РёСЋ
                    </label>
                    <button onClick={handleCreateRole} className="ui-pill-btn w-full justify-center py-3"><UserPlus size={14} /><span>РЎРѕР·РґР°С‚СЊ СЂРѕР»СЊ</span></button>
                  </div>

                  <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 shadow-xl">
                    <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider mb-3"><ShieldCheck size={16} /><span>Р’СЃРµ СЂРѕР»Рё</span></div>
                    <div className="space-y-2">
                      {customRoles.map((role) => (
                        <div key={role.id} className="flex items-center gap-3 bg-black/20 border border-white/5 p-3 rounded-xl">
                          <input type="color" value={role.color} onChange={e => handleRoleChange(role.id!, 'color', e.target.value)} onBlur={() => saveRoleToDb(role)} className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer flex-shrink-0"/>
                          <input type="text" value={role.name} onChange={e => handleRoleChange(role.id!, 'name', e.target.value)} onBlur={() => saveRoleToDb(role)} className="bg-transparent text-sm font-bold flex-1 min-w-0" style={{ color: role.color }}/>
                          <label className="flex items-center gap-1 text-[10px] text-gray-500 flex-shrink-0">
                            <input type="checkbox" checked={role.canEditConstitution} onChange={e => { handleRoleChange(role.id!, 'canEditConstitution', e.target.checked); saveRoleToDb({...role, canEditConstitution: e.target.checked}); }} className="accent-[#c0ff00]"/>
                            РљРѕРЅСЃС‚.
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- Р“РѕСЃС‚Рё --- */}
              {playersSubTab === 'guests' && (
                <div className="space-y-4">
                  <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
                    <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider"><User size={16} /><span>Р”РѕР±Р°РІРёС‚СЊ РіРѕСЃС‚СЏ</span></div>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Telegram ID" value={guestTgId} onChange={e => setGuestTgId(e.target.value)} className="ui-input flex-1"/>
                      <button onClick={handleAddGuest} disabled={guestLoading || !guestTgId} className="ui-pill-btn shrink-0 px-4 disabled:opacity-30"><Plus size={16} /></button>
                    </div>
                    {guestList.length > 0 && (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {guestList.map(g => (
                          <div key={g.tg_id} className="flex items-center justify-between p-2.5 bg-black/10 rounded-xl border border-white/5 text-xs">
                            <div>
                              <span className="text-white font-bold">ID: {g.tg_id}</span>
                              <span className="text-gray-500 ml-2">{new Date(g.created_at).toLocaleDateString('ru-RU')}</span>
                            </div>
                            <button onClick={() => handleRemoveGuest(g.tg_id)} className="text-gray-500 hover:text-red-400 transition-colors p-1"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==================== РЎР•Р Р’Р•Р  ==================== */}
          {mainTab === 'server' && (
            <>
              {/* Sub-tabs */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {([
                  { key: 'seasons' as const, label: 'РЎРµР·РѕРЅС‹', icon: <Calendar size={13} /> },
                  { key: 'modpack' as const, label: 'РњРѕРґРїР°Рє', icon: <Package size={13} /> },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setServerSubTab(tab.key)}
                    className={`text-xs font-bold uppercase px-4 py-2 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      serverSubTab === tab.key
                        ? 'bg-[#c0ff00]/20 text-[#c0ff00] border border-[#c0ff00]/30'
                        : 'bg-white/5 text-gray-400 border border-white/5'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* --- РЎРµР·РѕРЅС‹ --- */}
              {serverSubTab === 'seasons' && (
                <div className="space-y-4">
                  <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
                    <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider"><Calendar size={16} /><span>РЈРїСЂР°РІР»РµРЅРёРµ СЃРµР·РѕРЅР°РјРё</span></div>
                    <div className="text-sm text-gray-400">РўРµРєСѓС‰РёР№: <span className="text-[#c0ff00] font-bold">{props.currentSeasonName}</span> {props.seasonEnded ? <span className="text-red-400 font-bold ml-2">вЂў Р—Р°РІРµСЂС€С‘РЅ</span> : <span className="text-[#c0ff00] font-bold ml-2">вЂў РђРєС‚РёРІРµРЅ</span>}</div>
                    {!props.seasonEnded && (
                      <button onClick={async () => { props.setSeasonLoading(true); await props.onSeasonEnd(); props.setSeasonLoading(false); await props.onRefreshSeason(); loadPlayersData(); props.onRefreshPlayers(); }} disabled={props.seasonLoading} className="ui-pill-btn w-full justify-center !bg-red-500/20 !border-red-500/30 !text-red-400 hover:!bg-red-500/30 disabled:opacity-30"><Flag size={14} /><span className="text-[11px] font-bold">Р—Р°РІРµСЂС€РёС‚СЊ СЃРµР·РѕРЅ</span></button>
                    )}
                    {props.seasonEnded && (
                      <>
                        <button onClick={async () => { props.setSeasonLoading(true); await props.onSeasonUndoEnd(); props.setSeasonLoading(false); await props.onRefreshSeason(); }} disabled={props.seasonLoading} className="ui-pill-btn w-full justify-center !bg-[#c0ff00]/20 !border-[#c0ff00]/30 !text-[#c0ff00] hover:!bg-[#c0ff00]/30 disabled:opacity-30"><RotateCcw size={14} /><span className="text-[11px] font-bold">Р’РѕСЃСЃС‚Р°РЅРѕРІРёС‚СЊ СЃРµР·РѕРЅ</span></button>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500"><ServerIcon size={12} className="text-[#c0ff00]" /><span>Exaroton Server ID</span></div>
                          <input type="text" placeholder="e.g. abc123def456" value={newSeasonServerId} onChange={e => setNewSeasonServerId(e.target.value)} className="ui-input text-xs"/>
                          <button onClick={async () => { props.setSeasonLoading(true); await props.onSeasonStartNew(newSeasonServerId); props.setSeasonLoading(false); setNewSeasonServerId(''); await props.onRefreshSeason(); loadPlayersData(); props.onRefreshPlayers(); }} disabled={props.seasonLoading} className="ui-pill-btn w-full justify-center !bg-[#c0ff00] !text-black font-bold disabled:opacity-30"><Play size={14} /><span>РќР°С‡Р°С‚СЊ РЅРѕРІС‹Р№ СЃРµР·РѕРЅ</span></button>
                        </div>
                      </>
                    )}
                  </div>

                  {props.pastSeasons.length > 0 && (
                    <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 shadow-xl">
                      <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider mb-3"><Library size={16} /><span>РђСЂС…РёРІ СЃРµР·РѕРЅРѕРІ</span></div>
                      <div className="space-y-2">
                        {props.pastSeasons.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-3 bg-black/20 rounded-[18px] border border-white/5">
                            <div className="text-sm">
                              <span className="text-white font-bold">РЎРµР·РѕРЅ #{s.season_number}</span>
                              <span className="text-gray-500 ml-2">{s.days_count} РґРЅ.</span>
                              <span className="text-gray-600 ml-2 text-[11px]">{new Date(s.end_date).toLocaleDateString('ru-RU')}</span>
                            </div>
                            <div className="flex gap-1.5">
                              <button onClick={async () => { props.setSeasonLoading(true); await props.onSeasonRestore(s.id, s.season_number); props.setSeasonLoading(false); await props.onRefreshSeason(); }} disabled={props.seasonLoading} className="ui-pill-btn !bg-[#c0ff00]/10 !border-[#c0ff00]/20 !text-[#c0ff00] hover:!bg-[#c0ff00]/20 disabled:opacity-30 px-3 py-1.5"><RotateCcw size={12} /></button>
                              <button onClick={async () => { props.setSeasonLoading(true); await props.onSeasonDelete(s.id, s.season_number); props.setSeasonLoading(false); await props.onRefreshSeason(); }} disabled={props.seasonLoading} className="ui-pill-btn !bg-red-500/10 !border-red-500/20 !text-red-400 hover:!bg-red-500/20 disabled:opacity-30 px-3 py-1.5"><X size={12} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- РњРѕРґРїР°Рє --- */}
              {serverSubTab === 'modpack' && (
                <div className="flex flex-col items-center justify-center text-center gap-4 py-20 animate-fade-in">
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Package size={36} className="text-gray-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white">РњРѕРґРїР°Рє</h3>
                    <p className="text-sm text-gray-500">РЈРїСЂР°РІР»РµРЅРёРµ РјРѕРґРїР°РєРѕРј СЃРµСЂРІРµСЂР°</p>
                    <p className="text-xs text-gray-700 uppercase tracking-[0.2em] mt-2">РЎРєРѕСЂРѕ...</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* --- Bottom nav --- */}
      <div className="fixed bottom-6 left-8 right-8 z-50">
        <nav className="bg-[#14171c]/90 backdrop-blur-xl border border-white/10 py-4 px-10 rounded-full shadow-2xl">
          <div className="flex items-center justify-around">
            {([
              { key: 'home' as const, label: 'Р“Р»Р°РІРЅР°СЏ', icon: <ShieldAlert size={22} /> },
              { key: 'players' as const, label: 'РРіСЂРѕРєРё', icon: <Users size={22} /> },
              { key: 'server' as const, label: 'РЎРµСЂРІРµСЂ', icon: <Folder size={22} /> },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setMainTab(tab.key)}
                className={`flex flex-col items-center justify-center transition-all duration-300 ${
                  mainTab === tab.key ? 'text-[#c0ff00]' : 'text-gray-500'
                }`}
              >
                {tab.icon}
                <span className="text-[10px] font-bold mt-1 tracking-wide">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

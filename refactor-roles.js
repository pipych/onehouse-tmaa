const fs = require('fs');
const path = require('path');

const PROJECT = 'C:/Users/pshen/projects/onehouse-tmaa';
const pagePath = path.join(PROJECT, 'app/page.tsx');

if (!fs.existsSync(pagePath)) {
  console.error('page.tsx not found at', pagePath);
  process.exit(1);
}

let content = fs.readFileSync(pagePath, 'utf8');
let changes = 0;

function replace(oldText, newText, label) {
  if (content.includes(oldText)) {
    content = content.split(oldText).join(newText);
    changes++;
    console.log('✓', label);
  } else {
    console.log('✗', label, '(already done or not found)');
  }
}

// 1. Add professions to Player interface
replace(
  '  roles: string[];',
  '  roles: string[];\n  professions?: string[];',
  'Player interface: add professions'
);

// 2. Add professions state variables
replace(
  "const [newRolePerm, setNewRolePerm] = useState(false);",
  "const [newRolePerm, setNewRolePerm] = useState(false);\n  const [professions, setProfessions] = useState<CustomRole[]>([]);\n  const [newProfessionName, setNewProfessionName] = useState('');\n  const [newProfessionColor, setNewProfessionColor] = useState('#c0ff00');",
  'Add profession states'
);

// 3. Update adminSubTab type
replace(
  "'guests' | 'seasons'>",
  "'professions' | 'guests' | 'seasons'>",
  'Add professions to adminSubTab'
);

// 4. Add loadProfessions function after loadRoles
replace(
  "async function loadRoles() {\n    const { data } = await supabase.from('roles').select('*').order('name');",
  "async function loadProfessions() {\n    const { data } = await supabase.from('professions').select('*').order('name');\n    if (data) setProfessions(data.map((p: any) => ({ id: p.id, name: p.name, color: p.color, canEditConstitution: false })));\n  }\n\n  async function loadRoles() {\n    const { data } = await supabase.from('roles').select('*').order('name');",
  'Add loadProfessions function'
);

// 5. Add profession helper functions after saveRoleToDb
replace(
  "async function saveRoleToDb(role: CustomRole) {\n    if (!role.id) return;\n    await supabase.from('roles').update({ name: role.name, color: role.color, can_edit_constitution: role.canEditConstitution }).eq('id', role.id);\n  }",
  "async function saveRoleToDb(role: CustomRole) {\n    if (!role.id) return;\n    await supabase.from('roles').update({ name: role.name, color: role.color, can_edit_constitution: role.canEditConstitution }).eq('id', role.id);\n  }\n\n  async function handleCreateProfession() {\n    if (!newProfessionName.trim()) return;\n    const { error } = await supabase.from('professions').insert({ name: newProfessionName.toLowerCase(), color: newProfessionColor });\n    if (!error) { setNewProfessionName(''); loadProfessions(); }\n    else alert(`Ошибка: ${error.message}`);\n  }\n\n  function getProfessionColor(profName: string) {\n    const found = professions.find(p => p.name.toLowerCase() === profName.toLowerCase());\n    return found ? found.color : '#888888';\n  }",
  'Add profession helper functions'
);

// 6. Fix isDead to work with both array and object
replace(
  "function isDead(roles: string[]) {\n    return roles ? roles.some(r => r.toLowerCase() === 'мёртв') : false;\n  }",
  "function isDead(input: any) {\n    if (!input) return false;\n    const roles = Array.isArray(input) ? input : (input.roles || []);\n    const profs = Array.isArray(input) ? [] : (input.professions || []);\n    return roles.some((r: string) => r.toLowerCase() === 'мёртв') || profs.some((p: string) => p.toLowerCase() === 'мёртв');\n  }",
  'Fix isDead to include professions'
);

// 7. Fix checkUserInDb - use player.roles not character.roles
if (content.includes('roles: player.roles || character.roles || []')) {
  replace('roles: player.roles || character.roles || [],', 'roles: player.roles || [],', 'checkUserInDb: use player.roles (old pattern)');
} else {
  replace('roles: character.roles || [],', 'roles: player.roles || [],', 'checkUserInDb: use player.roles');
}

// 8. Add loadProfessions calls in checkUserInDb
let count = 0;
content = content.replace(/loadRoles\(\);/g, (match) => {
  count++;
  return `loadRoles();\n        loadProfessions();`;
});
console.log('  Added', count, 'loadProfessions() calls');

// 9. loadPlayers - add roles from players, professions from characters
replace(
  ".select('*, player:players(tg_id, tg_username, avatar_url)')",
  ".select('*, player:players(tg_id, tg_username, avatar_url, roles)')",
  'loadPlayers: include roles from players'
);
replace(
  'roles: c.roles || [],',
  'roles: c.player?.roles || [],\n        professions: c.professions || [],',
  'loadPlayers: roles from players, professions from characters'
);

// 10. handleAddPlayer - roles on players, professions on characters
replace(
  '      season: currentSeasonName,\n    });',
  '      season: currentSeasonName,\n      status: \'alive\',\n    });',
  'handleAddPlayer: temp - just a marker'
);

// 11. handleTabChange - load professions for admin
replace(
  "if (tab === 'admin') { loadGuests(); loadAllPlayers(); loadPlayers(); }",
  "if (tab === 'admin') { loadGuests(); loadAllPlayers(); loadPlayers(); loadProfessions(); }",
  'handleTabChange: loadProfessions'
);

// 12. Admin sub-tabs - add professions button
replace(
  "{tab === 'roles' && 'Роли'}\n                  {tab === 'guests' && 'Гости'}",
  "{tab === 'roles' && 'Роли'}\n                  {tab === 'professions' && 'Профессии'}\n                  {tab === 'guests' && 'Гости'}",
  'Admin: add professions sub-tab button'
);

// 13. Admin - add professions tab content before guests section
const professionsTab = `
            {/* --- Профессии --- */}
            {adminSubTab === 'professions' && (
              <div className="space-y-4">
                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider"><ShieldCheck size={16} /><span>Создать профессию</span></div>
                  <div className="flex gap-2 items-end">
                    <input type="text" placeholder="Название профессии" value={newProfessionName} onChange={e => setNewProfessionName(e.target.value)} className="ui-input flex-1"/>
                    <input type="color" value={newProfessionColor} onChange={e => setNewProfessionColor(e.target.value)} className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"/>
                  </div>
                  <button onClick={handleCreateProfession} className="ui-pill-btn w-full justify-center py-2 bg-[#c0ff00] text-black font-bold"><UserPlus size={14} /><span>Создать профессию</span></button>
                </div>
                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 shadow-xl">
                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider mb-3"><ShieldCheck size={16} /><span>Все профессии</span></div>
                  <div className="space-y-2">
                    {professions.map((prof) => (
                      <div key={prof.id} className="flex items-center gap-3 bg-black/20 border border-white/5 p-3 rounded-xl">
                        <input type="color" value={prof.color} onChange={e => setProfessions(profs => profs.map(p => p.id === prof.id ? {...p, color: e.target.value} : p))} className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer flex-shrink-0"/>
                        <span className="text-sm font-bold flex-1 min-w-0" style={{ color: prof.color }}>{prof.name.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}`;

replace(
  '            {/* --- Гости --- */}',
  professionsTab + '\n\n            {/* --- Гости --- */}',
  'Admin: add professions tab content'
);

// 14. Player modal - add professions section
replace(
  '          {/* Персонажи игрока */}',
  '          {/* Профессии персонажа */}\n          {(selectedPlayer?.professions || []).length > 0 && (\n            <>\n              <div className="w-full h-[1px] bg-white/5 my-2" />\n              <div className="text-left space-y-2 w-full">\n                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold pl-1">Профессии</div>\n                <div className="flex flex-wrap gap-2 items-center">\n                  {(selectedPlayer.professions || []).map((p: string, idx: number) => (\n                    <span key={idx} className="text-xs font-bold py-1 rounded-full border transition-all flex items-center gap-1.5 px-3" style={{ backgroundColor: `${getProfessionColor(p)}15`, color: getProfessionColor(p), borderColor: `${getProfessionColor(p)}30` }}>\n                      <span>• {p.toUpperCase()}</span>\n                    </span>\n                  ))}\n                </div>\n              </div>\n            </>\n          )}\n\n          {/* Персонажи игрока */}',
  'Modal: add professions section'
);

// Write back
fs.writeFileSync(pagePath, content, 'utf8');
console.log('\nDone. Total changes:', changes, 'Content length:', content.length);

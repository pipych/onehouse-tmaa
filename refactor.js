const fs = require('fs');
const file = 'C:\\Users\\pshen\\projects\\onehouse-tmaa\\app\\page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Step 1: Rename state declaration (already done manually, but let's verify)
// Actually, let's just do all replacements in correct order

// First, handle setSelectedPlayer → setSelectedCharacter 
content = content.replace(/setSelectedPlayer/g, 'setSelectedCharacter');

// Then, handle remaining selectedPlayer → selectedCharacter
content = content.replace(/selectedPlayer/g, 'selectedCharacter');

// Add new states after showRoleSelector
content = content.replace(
    'const [showRoleSelector, setShowRoleSelector] = useState(false); \r\n',
    'const [showRoleSelector, setShowRoleSelector] = useState(false); \r\n  const [selectedProfile, setSelectedProfile] = useState<any>(null);\r\n  const [characterMenuOpen, setCharacterMenuOpen] = useState(false);\r\n  const [editingCharacter, setEditingCharacter] = useState(false);\r\n'
);

fs.writeFileSync(file, content);
console.log('Basic replacements done');

// Verify
const verify = fs.readFileSync(file, 'utf8');
console.log('selectedPlayer remaining:', (verify.match(/selectedPlayer/g) || []).length);
console.log('setSelectedPlayer remaining:', (verify.match(/setSelectedPlayer/g) || []).length);
console.log('selectedCharacter count:', (verify.match(/selectedCharacter/g) || []).length);
console.log('setSelectedCharacter count:', (verify.match(/setSelectedCharacter/g) || []).length);

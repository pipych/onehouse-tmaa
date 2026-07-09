$file = 'C:\Users\pshen\projects\onehouse-tmaa\app\page.tsx'
$content = Get-Content -Path $file -Raw

# 1. Rename selectedPlayer state
$content = $content -replace 'const \[selectedPlayer, setSelectedPlayer\]', 'const [selectedCharacter, setSelectedCharacter]'

# 2. Add new states after showRoleSelector
$content = $content -replace "(const \[showRoleSelector, setShowRoleSelector\] = useState\(false\);)", "`$1`r`n  const [selectedProfile, setSelectedProfile] = useState<any>(null);`r`n  const [characterMenuOpen, setCharacterMenuOpen] = useState(false);`r`n  const [editingCharacter, setEditingCharacter] = useState(false);"

Set-Content -Path $file -Value $content -NoNewline
Write-Output 'State changes done'

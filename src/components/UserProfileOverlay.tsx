import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Modal } from '../ui/overlays/Modal';
import { ActionMenu, DrawerItem } from '../ui/overlays/ActionMenu';
import { Button } from '../ui/components/Button';
import { Input } from '../ui/components/Input';
import { OneIcon } from '../ui/components/Icon';
import { cn } from '../ui/utils/cn';

export interface UserProfileOverlayProps {
  open: boolean;
  onClose: () => void;
  character?: any | null;
  profile?: any | null;
  isAdmin?: boolean;
  onSaveProfile?: (updatedData: { rp_name: string; avatar_url: string }) => Promise<void>;
  onKillCharacter?: () => Promise<void>;
  onAddProfession?: (profName: string) => Promise<void>;
  onRemoveProfession?: (profName: string) => Promise<void>;
  onAddRole?: (roleName: string) => Promise<void>;
  onRemoveRole?: (roleName: string) => Promise<void>;
  professions?: Array<{ name: string; color: string }>;
  roles?: Array<{ name: string; color: string }>;
  onSelectCharacter?: (char: any) => void;
  getProfessionColor?: (prof: string) => string;
  getRoleColor?: (role: string) => string;
  onUploadAvatar?: (
    event: React.ChangeEvent<HTMLInputElement>,
    setUrl: (url: string) => void,
    setLoading: (l: boolean) => void
  ) => Promise<void>;
}

export const UserProfileOverlay: React.FC<UserProfileOverlayProps> = ({
  open,
  onClose,
  character,
  profile,
  isAdmin = false,
  onSaveProfile,
  onKillCharacter,
  onAddProfession,
  onRemoveProfession,
  onAddRole,
  onRemoveRole,
  professions = [],
  roles = [],
  onSelectCharacter,
  getProfessionColor = () => '#c0ff00',
  getRoleColor = () => '#8e8e93',
  onUploadAvatar,
}) => {
  const activeItem = character || profile;

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [newRpName, setNewRpName] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Player's characters state
  const [playerChars, setPlayerChars] = useState<any[]>([]);
  const [, setLoadingChars] = useState(false);

  // Synchronize edit fields when active item changes or edit mode toggles
  useEffect(() => {
    if (activeItem) {
      setNewRpName(activeItem.rp_name || activeItem.mc_nickname || '');
      setNewAvatarUrl(activeItem.avatar_url || '');
    }
    if (!open) {
      setIsEditing(false);
    }
  }, [activeItem, open]);

  // Load player characters automatically and reliably
  const playerId = activeItem?.player_id || activeItem?.id;
  useEffect(() => {
    if (!open || !playerId) {
      setPlayerChars([]);
      return;
    }

    let isMounted = true;
    setLoadingChars(true);

    supabase
      .from('characters')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && isMounted && data) {
          setPlayerChars(data);
        }
        if (isMounted) setLoadingChars(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, playerId]);

  if (!activeItem) return null;

  const isDead =
    activeItem.status === 'dead' ||
    (activeItem.professions || []).some((p: string) => p.toLowerCase() === 'мёртв');

  const handleFileUploadInternal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUploadAvatar) {
      await onUploadAvatar(e, setNewAvatarUrl, setIsUploading);
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${file.name.split('.').pop() || 'png'}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      if (data?.publicUrl) {
        setNewAvatarUrl(data.publicUrl);
      }
    } catch (err: any) {
      alert(`Ошибка загрузки: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!newRpName.trim()) return;
    try {
      setIsSaving(true);
      if (onSaveProfile) {
        await onSaveProfile({ rp_name: newRpName.trim(), avatar_url: newAvatarUrl });
      }
      setIsEditing(false);
    } catch (err: any) {
      alert(`Ошибка сохранения: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const currentProfessions = (activeItem.professions || []).filter(
    (p: string) => p.toLowerCase() !== 'мёртв'
  );
  const currentRoles = activeItem.roles || [];

  const availableProfessionsToAdd = professions.filter(
    (p) => !currentProfessions.includes(p.name)
  );
  const availableRolesToAdd = roles.filter(
    (r) => !currentRoles.includes(r.name)
  );

  return (
    <Modal
      open={open}
      onClose={() => {
        setIsEditing(false);
        onClose();
      }}
      hasCancelAction={isEditing}
      maxWidth="max-w-md"
      className={isDead ? 'bg-[#090b0e]' : 'bg-[#14171c]'}
      headerExtra={
        isAdmin && !isEditing && character ? (
          <ActionMenu
            title="Управление персонажем"
            description="Действия администратора"
            items={[
              {
                id: 'edit',
                label: 'Редактировать',
                description: 'Изменить имя и аватар персонажа',
                icon: 'edit',
                onClick: () => setIsEditing(true),
              },
              {
                id: 'kill',
                label: 'Убить персонажа',
                description: 'Присвоить статус «мёртв»',
                icon: 'skull',
                danger: true,
                onClick: () => {
                  if (confirm('Убить персонажа?')) {
                    onKillCharacter?.();
                  }
                },
              },
            ]}
          />
        ) : null
      }
      footer={
        isEditing ? (
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 w-full pt-1">
            <Button
              variant="ghost"
              onClick={() => setIsEditing(false)}
              className="w-full sm:w-auto"
            >
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={<OneIcon name="save" size={18} />}
              className="w-full sm:w-auto"
            >
              Сохранить
            </Button>
          </div>
        ) : null
      }
    >
      <div className="flex flex-col items-center text-center space-y-4 pt-1">
        {/* Avatar Presentation */}
        <div
          className={cn(
            'relative w-24 h-24 rounded-full overflow-hidden bg-[#181c23] shadow-xl flex items-center justify-center border-none transition-all duration-300',
            isDead && 'opacity-60 grayscale'
          )}
        >
          {isEditing ? (
            newAvatarUrl ? (
              <img
                src={newAvatarUrl}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <OneIcon name="person" size={40} className="text-[#8e8e93]" />
            )
          ) : activeItem.avatar_url ? (
            <img
              src={activeItem.avatar_url}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <OneIcon name="person" size={40} className="text-[#8e8e93]" />
          )}
        </div>

        {/* Edit Form or Readonly Stack */}
        {isEditing ? (
          <div className="w-full space-y-3 pt-1">
            <Input
              value={newRpName}
              onChange={(e) => setNewRpName(e.target.value)}
              placeholder="Имя профиля"
              surface="card"
              className="text-center font-bold"
            />

            <label className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#181c23] hover:bg-white/[0.06] active:scale-[0.99] text-sm font-bold text-white cursor-pointer transition-all border-none relative overflow-hidden select-none">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={handleFileUploadInternal}
                disabled={isUploading}
              />
              <OneIcon
                name="upload"
                size={18}
                className={isUploading ? 'animate-bounce text-[#c0ff00]' : 'text-[#8e8e93]'}
              />
              <span>{isUploading ? 'Загрузка...' : 'Загрузить аватар'}</span>
            </label>
          </div>
        ) : (
          <div className="w-full space-y-1.5">
            <h2
              className={cn(
                'text-2xl font-black tracking-wide break-all px-4 leading-tight',
                isDead ? 'text-[#8e8e93] line-through' : 'text-white'
              )}
            >
              {activeItem.rp_name || activeItem.mc_nickname}
              {isDead && (
                <span className="ml-2.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-400 align-middle inline-block no-underline">
                  мёртв
                </span>
              )}
            </h2>

            {activeItem.mc_nickname && (
              <p className="text-sm text-[#8e8e93] font-mono tracking-tight break-all">
                {activeItem.mc_nickname}
              </p>
            )}

            {character && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#181c23] rounded-full text-xs font-semibold mt-1 text-[#c0ff00]">
                <span>🏛️ Партия:</span>
                <span className="font-bold text-white">{activeItem.party || 'Нет партии'}</span>
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="w-full h-px bg-white/5 my-1" />

        {/* Professions Section (Character) */}
        {character && (
          <div className="text-left space-y-2 w-full">
            <div className="text-xs text-[#8e8e93] uppercase tracking-wider font-semibold pl-1">
              Профессии
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {currentProfessions.map((prof: string, idx: number) => {
                const color = getProfessionColor(prof);
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs font-bold py-1.5 px-3.5 rounded-full transition-all border-none"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span>{prof.toUpperCase()}</span>
                    {isAdmin && onRemoveProfession && (
                      <button
                        type="button"
                        onClick={() => onRemoveProfession(prof)}
                        className="opacity-60 hover:opacity-100 hover:bg-white/10 rounded-full p-0.5 transition-all border-none cursor-pointer ml-0.5"
                        aria-label={`Удалить профессию ${prof}`}
                      >
                        <OneIcon name="close" size={12} />
                      </button>
                    )}
                  </span>
                );
              })}

              {currentProfessions.length === 0 && (
                <span className="text-xs text-[#8e8e93] pl-1">Нет профессий</span>
              )}

              {/* Adaptive Add Profession Button */}
              {isAdmin && onAddProfession && availableProfessionsToAdd.length > 0 && (
                <ActionMenu
                  title="Назначить профессию"
                  description="Выберите профессию для персонажа"
                  trigger={
                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8e8e93] hover:text-white transition-all cursor-pointer border-none sf-tap active:scale-90"
                      aria-label="Добавить профессию"
                    >
                      <OneIcon name="add" size={16} />
                    </button>
                  }
                  items={availableProfessionsToAdd.map((prof) => ({
                    id: prof.name,
                    label: prof.name.toUpperCase(),
                    icon: 'badge',
                    onClick: () => onAddProfession(prof.name),
                  }))}
                />
              )}
            </div>
          </div>
        )}

        {/* Roles Section (Player profile or character roles) */}
        {(!character || currentRoles.length > 0 || (isAdmin && onAddRole)) && (
          <div className="text-left space-y-2 w-full">
            <div className="text-xs text-[#8e8e93] uppercase tracking-wider font-semibold pl-1">
              Роли
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {currentRoles.map((role: string, idx: number) => {
                const color = getRoleColor(role);
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs font-bold py-1.5 px-3.5 rounded-full transition-all border-none"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span>{role.toUpperCase()}</span>
                    {isAdmin && onRemoveRole && (
                      <button
                        type="button"
                        onClick={() => onRemoveRole(role)}
                        className="opacity-60 hover:opacity-100 hover:bg-white/10 rounded-full p-0.5 transition-all border-none cursor-pointer ml-0.5"
                        aria-label={`Удалить роль ${role}`}
                      >
                        <OneIcon name="close" size={12} />
                      </button>
                    )}
                  </span>
                );
              })}

              {currentRoles.length === 0 && (
                <span className="text-xs text-[#8e8e93] pl-1">Нет ролей</span>
              )}

              {/* Adaptive Add Role Button */}
              {isAdmin && onAddRole && availableRolesToAdd.length > 0 && (
                <ActionMenu
                  title="Назначить роль"
                  description="Выберите роль для игрока"
                  trigger={
                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8e8e93] hover:text-white transition-all cursor-pointer border-none sf-tap active:scale-90"
                      aria-label="Добавить роль"
                    >
                      <OneIcon name="add" size={16} />
                    </button>
                  }
                  items={availableRolesToAdd.map((role) => ({
                    id: role.name,
                    label: role.name.toUpperCase(),
                    icon: 'workspace_premium',
                    onClick: () => onAddRole(role.name),
                  }))}
                />
              )}
            </div>
          </div>
        )}

        {/* Player Characters List (Small Bento Widget items) */}
        {playerChars.length > 0 && (
          <div className="space-y-2.5 text-left w-full pt-1">
            <div className="text-xs text-[#8e8e93] uppercase tracking-wider font-semibold pl-1">
              Персонажи игрока ({playerChars.length})
            </div>
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto no-scrollbar">
              {playerChars.map((pc) => {
                const isCurrent = pc.id === activeItem?.id;
                const pcDead =
                  pc.status === 'dead' ||
                  (pc.professions || []).some(
                    (p: string) => p.toLowerCase() === 'мёртв'
                  );

                return (
                  <DrawerItem
                    key={pc.id}
                    label={pc.rp_name}
                    description={`${pc.season || 'Сезон'} · ${pc.party || 'Нет партии'}`}
                    isActive={isCurrent}
                    leftElement={
                      <div
                        className={cn(
                          'w-full h-full bg-[#14171c] flex items-center justify-center',
                          pcDead && 'grayscale opacity-60'
                        )}
                      >
                        {pc.avatar_url ? (
                          <img
                            src={pc.avatar_url}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <OneIcon name="person" size={20} className="text-[#8e8e93]" />
                        )}
                      </div>
                    }
                    rightAction={
                      pcDead ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 shrink-0">
                          мёртв
                        </span>
                      ) : isCurrent ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#c0ff00]/15 text-[#c0ff00] shrink-0">
                          Текущий
                        </span>
                      ) : (
                        <OneIcon
                          name="chevron_right"
                          size={18}
                          className="text-[#8e8e93] shrink-0"
                        />
                      )
                    }
                    onClick={() => {
                      if (onSelectCharacter) {
                        onSelectCharacter(pc);
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UserProfileOverlay;

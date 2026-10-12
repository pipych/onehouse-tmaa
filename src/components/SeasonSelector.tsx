import React from 'react';
import { Select, SelectOption } from '../ui/overlays/ActionMenu';

export interface SeasonSelectorProps {
  seasons: string[];
  selectedSeason: string;
  onSelectSeason: (season: string) => void;
  className?: string;
  triggerClassName?: string;
}

/**
 * SeasonSelector - Adaptive season selector adhering to OneWebUI rules:
 * - Desktop: compact floating dropdown anchored to the capsule trigger
 * - Mobile: Bottom Sheet with Small Bento Widget rows (rounded square icon shape, title + description, lime checkmark)
 */
export const SeasonSelector: React.FC<SeasonSelectorProps> = ({
  seasons,
  selectedSeason,
  onSelectSeason,
  className,
  triggerClassName,
}) => {
  const options: SelectOption[] = seasons.map((season) => ({
    value: season,
    label: season,
    description: season === selectedSeason ? 'Текущий активный архив' : 'Перейти к материалам',
    icon: 'inventory_2',
  }));

  return (
    <Select
      value={selectedSeason}
      onChange={onSelectSeason}
      options={options}
      title="Архив сезонов"
      description="Выберите интересующий сезон для просмотра материалов"
      className={className}
      triggerClassName={triggerClassName}
    />
  );
};

export default SeasonSelector;

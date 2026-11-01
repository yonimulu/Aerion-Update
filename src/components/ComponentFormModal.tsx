import React from 'react';
import { RocketComponent } from '../types/rocket';
import { EncyclopediaEntryFormModal } from './EncyclopediaEntryFormModal';

interface ComponentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<RocketComponent>) => void;
  initialData?: RocketComponent | null;
  availableCategories?: string[];
}

/**
 * Re-export wrapper delegating to the structured EncyclopediaEntryFormModal.
 */
export const ComponentFormModal: React.FC<ComponentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableCategories
}) => {
  return (
    <EncyclopediaEntryFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      initialData={initialData}
      availableCategories={availableCategories}
    />
  );
};

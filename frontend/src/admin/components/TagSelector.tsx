import React from 'react';
import { EntityBadgeSelector, type EntityBadgeOption } from './EntityBadgeSelector';

export type TagOption = EntityBadgeOption;

interface TagSelectorProps {
  options?: TagOption[];
  values?: string[];
  onChange: (values: string[]) => void;
  isLoading?: boolean;
}

export const TagSelector: React.FC<TagSelectorProps> = ({ options = [], values = [], onChange, isLoading = false }) => {
  return (
    <EntityBadgeSelector
      title="Tags"
      entityName="tag"
      options={options}
      values={values}
      onChange={onChange}
      isLoading={isLoading}
      allowCustom={true}
    />
  );
};

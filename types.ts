import type React from 'react';

export interface Tool {
  id: string;
  name: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresPrompt: boolean;
  placeholder?: string;
  description?: string;
  actionLabel?: string;
}
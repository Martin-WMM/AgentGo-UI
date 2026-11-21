import type { ModelType } from '../composables/useModels';

/** Visual treatment for a model capability category on a card. */
export interface ModelPresentation {
  color: string;
  icon: string;
}

const presentations: Record<ModelType, ModelPresentation> = {
  LLM: { color: '#4f46e5', icon: 'lucide:brain' },
  MULTIMODAL: { color: '#7c3aed', icon: 'lucide:images' },
  EMBEDDING: { color: '#0891b2', icon: 'lucide:layers' },
  ASR: { color: '#0f766e', icon: 'lucide:mic' },
  TTS: { color: '#d97706', icon: 'lucide:volume-2' },
  SPEECH2SPEECH: { color: '#db2777', icon: 'lucide:audio-lines' },
  OTHER: { color: '#64748b', icon: 'lucide:box' },
};

/**
 * Returns the icon and accent color used to present a model type.
 *
 * @param type model capability category
 * @returns presentation tokens for cards and badges
 */
export function modelPresentation(type: ModelType): ModelPresentation {
  return presentations[type];
}

import { onUnmounted, ref } from 'vue';

type SpeechRecognitionResultLike = {
  0?: { transcript?: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike & { isFinal?: boolean }>;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

function speechCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const speechWindow = window as SpeechWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

/**
 * Browser speech-to-text for the chat composer. Appends final transcripts to the draft.
 */
export function useComposerVoiceInput(options: {
  locale: () => string;
  appendText: (chunk: string) => void;
  onUnsupported: () => void;
  onError: () => void;
}) {
  const listening = ref(false);
  let recognition: SpeechRecognitionLike | null = null;

  function stop() {
    recognition?.stop();
    recognition = null;
    listening.value = false;
  }

  function start() {
    const Ctor = speechCtor();
    if (!Ctor) {
      options.onUnsupported();
      return;
    }
    if (listening.value) {
      stop();
      return;
    }

    const instance = new Ctor();
    instance.lang = options.locale().startsWith('zh') ? 'zh-CN' : 'en-US';
    instance.continuous = true;
    instance.interimResults = false;
    instance.onresult = (event) => {
      let chunk = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript?.trim();
        if (transcript) chunk = chunk ? `${chunk} ${transcript}` : transcript;
      }
      if (chunk) options.appendText(chunk);
    };
    instance.onerror = (event) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        options.onError();
      }
      stop();
    };
    instance.onend = () => {
      listening.value = false;
      recognition = null;
    };

    recognition = instance;
    listening.value = true;
    try {
      instance.start();
    } catch {
      stop();
      options.onError();
    }
  }

  function toggle() {
    if (listening.value) stop();
    else start();
  }

  onUnmounted(() => {
    recognition?.abort();
    recognition = null;
  });

  return {
    listening,
    supported: () => speechCtor() !== null,
    start,
    stop,
    toggle,
  };
}

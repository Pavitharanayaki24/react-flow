import Monaco from '@monaco-editor/react';
import { useStoreActions, useStoreState } from './store';
import { fromJavascript, fromJson } from './utils1';

// Monaco Editor options
const options = {
  minimap: { enabled: false },
};

export default function Editor() {
  const { updateFlow, setFlow } = useStoreActions();
  const { lang, buffers } = useStoreState();

  return (
    <Monaco
      path={`flow.${lang}`}
      language={lang}
      theme="light"
      value={buffers[lang]}
      onChange={(source: string | undefined) => {
        switch (lang) {
          case 'xml': {
            updateFlow(source ?? '');
            break;
          }
          case 'json': {
            const result = fromJson(source ?? '');
            if (result) {
              setFlow(result);
            }
            break;
          }
          case 'javascript': {
            const result = fromJavascript(source ?? '');
            if (result) {
              setFlow(result);
            }
            break;
          }
        }
      }}
      options={options}
    />
  );
}

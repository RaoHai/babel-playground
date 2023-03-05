import React, { DOMElement, useCallback, useEffect, useMemo, useState } from 'react';
import * as standalone from '@babel/standalone';
import styles from './index.css';

type BabelFileResult = ReturnType<typeof standalone.transform>;

export default function() {
  const [umdResources, setUmdResources] = useState([{
    name: 'lodash',
    globalName: '_',
    resource: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js'
  }, {
    name: 'react',
    globalName: 'React',
    resource: 'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js'
  }, {
    name: 'react-dom',
    globalName: 'ReactDOM',
    resource: 'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  }]);

  const umdResourcesGlobals = useMemo(() => umdResources.reduce(
    (prev, curr) => ({ ...prev, [curr.name]: curr.globalName }), {}
    ), [umdResources]);

  const [presets, setPresets] = useState(['react']);
  const [plugins, setPlugins] = useState([
    [
      'transform-modules-umd',
      {
        globals: umdResourcesGlobals
      }
  ]]);

  const [executeError, setExecuteError] = useState<Error>();
  const [code, setCode] = useState(`
import lodash from 'lodash';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

function App() {
  useEffect(() => {
    console.log(lodash.pick({ a: '1', b: '2' }, 'a'));
  }, []);
  return <div> hello world </div>
}

ReactDOM.render(<App />, document.querySelector('#container'));
`);

  const [compiled, setCompiled] = useState<{ code: String, size: number }>();

  useEffect(() => {
    umdResources.forEach(resource => {
      const script = document.createElement('script');
      script.src = resource.resource;
      document.head.appendChild(script);
    });
  }, [umdResources]);

  useEffect(() => {
    window.__executeErrorCallback = function (error) {
      setExecuteError(error);
    }
  }, []);
  const execute = useCallback((executableCode: string, targetDom: HTMLElement = document.body) => {
    const script = document.createElement('script');
    script.innerHTML = `
      try {
        ${executableCode}
      } catch (e) {
        window.__executeErrorCallback(e);
      }
    `;
    targetDom.appendChild(script)
  }, []);

  const run = useCallback(() => {
    const transformed = standalone.transform(code, {
      filename: 'demo.ts',
      plugins,
      presets,
    });

    setCompiled({
      code: transformed.code!,
      size: new Blob([transformed.code!], { type: "text/plain" }).size,
    });

    execute(transformed.code!);
  }, [code, presets, plugins]);

  return (
    <div className={styles.normal}>
      {executeError ? (
        <div className={styles.error}>
          <h2> Error!</h2>
          <h3>{executeError.message}</h3>
          <code>
            <pre>{executeError.stack}</pre>
          </code>
        </div>
      ): null}
      <div className={styles.grid}>
        <textarea
          value={code}
          onChange={ev => setCode(ev.target.value)}
        />
        <code>
          <pre>{compiled?.code}</pre>
        </code>
      </div>
      <div className={styles.grid}>
        <button style={{ width: 160, height: 24, marginTop: 24 }} onClick={run}>润</button>
        <div id='container' className={styles.container}></div>
      </div>
    </div>
  );
}

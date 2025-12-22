import React, { useEffect, useState, useRef } from 'react';

interface PreviewWindowProps {
  code: string;
}

const PreviewWindow: React.FC<PreviewWindowProps> = ({ code }) => {
  const [srcDoc, setSrcDoc] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            // Tailwind config to prevent conflicts or defaults we don't want
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    clifford: '#da373d',
                  }
                }
              }
            }
          </script>
          
          <!-- Import Map: Defines where to load React modules from -->
          <script type="importmap">
          {
            "imports": {
              "react": "https://esm.sh/react@18.2.0",
              "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
              "react/jsx-runtime": "https://esm.sh/react@18.2.0/jsx-runtime",
              "react-dom": "https://esm.sh/react-dom@18.2.0"
            }
          }
          </script>
          
          <!-- Babel Standalone: Compiles JSX in the browser -->
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          
          <style>
            body { background-color: white; color: black; }
            /* Hide scrollbar for cleaner look if needed */
            ::-webkit-scrollbar { width: 0px; background: transparent; }
          </style>
      </head>
      <body>
          <div id="root"></div>
          
          <script type="module">
            import React from 'react';
            import { createRoot } from 'react-dom/client';

            // Safe injection of user code
            const userCode = ${JSON.stringify(code)};

            async function run() {
              try {
                let codeToCompile = userCode;
                
                // Ensure React is imported. 
                // Even with automatic runtime, user code might use React hooks (React.useState) or React types.
                // We check for "import React" or "import * as React" to avoid duplicates.
                if (!codeToCompile.match(/import\\s+(\\*\\s+as\\s+)?React/)) {
                   codeToCompile = "import React from 'react';\\n" + codeToCompile;
                }

                // 1. Transform the user's JSX code into standard JavaScript (ESM)
                // We use 'runtime: automatic' which emits imports to 'react/jsx-runtime'.
                // The import map above handles resolving 'react/jsx-runtime' to the correct URL.
                const compiledResult = Babel.transform(codeToCompile, {
                  presets: [
                    ['react', { runtime: 'automatic' }]
                  ],
                  filename: 'UserComponent.tsx',
                });
                
                // 2. Create a temporary module from the compiled code
                const blob = new Blob([compiledResult.code], { type: 'text/javascript' });
                const url = URL.createObjectURL(blob);

                // 3. Import the generated module
                const module = await import(url);
                
                // 4. Find the component to render (default export)
                const App = module.default;
                
                if (!App) {
                  throw new Error("The generated code does not have a default export. Please ensure the component is exported as default.");
                }

                // 5. Mount the React app
                const root = createRoot(document.getElementById('root'));
                root.render(React.createElement(App));

              } catch (err) {
                console.error("Preview Error:", err);
                document.body.innerHTML = \`
                  <div style="padding: 20px; color: #000; font-family: sans-serif; background: #FF6B6B; height: 100vh; border: 4px solid black;">
                    <h1 style="font-weight: 900; text-transform: uppercase;">Preview Error</h1>
                    <pre style="white-space: pre-wrap; background: white; border: 2px solid black; padding: 10px;">\${err.message}</pre>
                    <br/>
                    <em>Check the console for more details.</em>
                  </div>
                \`;
              }
            }

            run();
          </script>
      </body>
      </html>
    `;
    setSrcDoc(html);
  }, [code]);

  return (
    <div className="w-full h-full bg-white border-2 border-black flex flex-col">
      {/* Neobrutalist Window Header */}
      <div className="bg-[#FFE5B4] border-b-4 border-black px-4 py-2 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="w-4 h-4 bg-[#FF6B6B] border-2 border-black hover:bg-red-400"></div>
          <div className="w-4 h-4 bg-[#FFD93D] border-2 border-black hover:bg-yellow-400"></div>
          <div className="w-4 h-4 bg-[#6BCB77] border-2 border-black hover:bg-green-400"></div>
        </div>
        <div className="flex-1 text-center">
          <span className="bg-white px-3 py-1 text-xs font-bold uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_#000]">
            Localhost:3000
          </span>
        </div>
        <div className="w-12"></div> {/* Spacer for balance */}
      </div>
      <iframe 
        ref={iframeRef}
        srcDoc={srcDoc} 
        title="Preview" 
        className="w-full flex-1 bg-white"
        sandbox="allow-scripts allow-same-origin" 
      />
    </div>
  );
};

export default PreviewWindow;
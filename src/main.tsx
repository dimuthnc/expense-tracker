import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// factory-ui design system (see theme/README.md). Tokens first, then the
// component classes, then the app's Tailwind layer that bridges onto them.
import '../theme/tokens.css';
import '../theme/components.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Shell } from './Shell';
import { registerPwa } from './pwaRegister';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Shell />
  </React.StrictMode>
);

registerPwa();

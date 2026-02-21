import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrochureApp } from './BrochureApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrochureApp />
  </StrictMode>
);

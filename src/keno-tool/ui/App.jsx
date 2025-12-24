import { h } from 'preact';
import { ModalsProvider } from '@/keno-tool/hooks/useModals.js';
import { ModalsManager } from './ModalsManager.jsx';
import { Overlay } from './components/Overlay.jsx';

/**
 * Main application component
 * Wraps Overlay and ModalsManager with ModalsProvider
 */
export function App() {
  return (
    <ModalsProvider>
      <Overlay />
      <ModalsManager />
    </ModalsProvider>
  );
}

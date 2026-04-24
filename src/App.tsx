import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '@/state/AppContext';
import { Docs } from '@/pages/Docs';
import { Home } from '@/pages/Home';

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Auth0ProviderWithNavigate } from '@/auth/Auth0ProviderWithNavigate';
import { AuthCookieSync } from '@/auth/AuthCookieSync';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppProvider } from '@/state/AppContext';
import { Callback } from '@/pages/Callback';
import { Docs } from '@/pages/Docs';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';

export function App() {
  return (
    <BrowserRouter>
      <Auth0ProviderWithNavigate>
        <AuthCookieSync />
        <AppProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/callback" element={<Callback />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/docs"
              element={
                <ProtectedRoute>
                  <Docs />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AppProvider>
      </Auth0ProviderWithNavigate>
    </BrowserRouter>
  );
}

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RefreshCw } from './components/ui/SFSymbol';

// Главный экран загружается сразу
import HomeView from './views/HomeView';

// Второстепенные экраны подгружаются лениво (code splitting) для максимальной скорости первого запуска
const AdminView = lazy(() => import('./views/AdminView'));
const MediaDetailView = lazy(() => import('./views/MediaDetailView'));
const MediaEditorView = lazy(() => import('./views/MediaEditorView'));
const ArchiveTimelineView = lazy(() => import('./views/ArchiveTimelineView'));
const ArchiveDocsView = lazy(() => import('./views/ArchiveDocsView'));
const ArchiveCharactersView = lazy(() => import('./views/ArchiveCharactersView'));
const ArchiveMediaView = lazy(() => import('./views/ArchiveMediaView'));
const ArchiveMapView = lazy(() => import('./views/ArchiveMapView'));
const OneLaunchView = lazy(() => import('./views/OneLaunchView'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-[#090b0e] flex items-center justify-center">
    <RefreshCw className="animate-spin text-[#c0ff00]" size={32} />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 минут кэширования для плавности
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/admin" element={<AdminView />} />
            <Route path="/media/:id" element={<MediaDetailView />} />
            <Route path="/media/editor" element={<MediaEditorView />} />
            <Route path="/archive/timeline" element={<ArchiveTimelineView />} />
            <Route path="/archive/docs" element={<ArchiveDocsView />} />
            <Route path="/archive/characters" element={<ArchiveCharactersView />} />
            <Route path="/archive/media" element={<ArchiveMediaView />} />
            <Route path="/archive/map" element={<ArchiveMapView />} />
            <Route path="/onelaunch" element={<OneLaunchView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

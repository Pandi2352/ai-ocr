import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import OCRView from './components/features/OCRView';
import EntityView from './components/features/EntityView';
import SummaryView from './components/features/SummaryView';
import CompareView from './components/features/CompareView';
import FormView from './components/features/FormView';
import IdentityView from './components/features/IdentityView';
import { ToastProvider } from './components/ui/ToastContext';
import { useAxiosInterceptor } from './components/ui/useAxiosInterceptor';

const InterceptorSetup = () => {
    useAxiosInterceptor();
    return null;
};

function App() {
  return (
    <ToastProvider>
        <InterceptorSetup />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/ocr" replace />} />
              
              <Route path="ocr">
                <Route index element={<OCRView />} />
                <Route path=":id" element={<OCRView />} />
              </Route>
              
              <Route path="entities">
                <Route index element={<EntityView />} />
                <Route path=":id" element={<EntityView />} />
              </Route>
              
              <Route path="summary">
                <Route index element={<SummaryView />} />
                <Route path=":id" element={<SummaryView />} />
              </Route>

              <Route path="compare" element={<CompareView />} />
              <Route path="forms" element={<FormView />} />
              <Route path="identity" element={<IdentityView />} />
            </Route>
          </Routes>
        </BrowserRouter>
    </ToastProvider>
  );
}

export default App;

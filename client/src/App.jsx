import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreateRfp from './pages/CreateRfp';
import Vendors from './pages/Vendors';
import RfpDetail from './pages/RfpDetail';

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/rfps/create" element={<CreateRfp />} />
                    <Route path="/rfps/:id" element={<RfpDetail />} />
                    <Route path="/vendors" element={<Vendors />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;

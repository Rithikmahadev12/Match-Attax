import Navbar from './components/navbar';
import Home from './pages/home';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Scanner from './pages/scanner';
import Collection from './pages/collection';
import Game from './pages/game';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

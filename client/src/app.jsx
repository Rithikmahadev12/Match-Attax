import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import Collection from './pages/Collection';
import Game from './pages/Game';

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

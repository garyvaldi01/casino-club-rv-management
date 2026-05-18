/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Gift, Settings, Menu, X, LogOut, Copy, Send, Smartphone, Plus, Search, Lock } from 'lucide-react';
import GiftView from './components/GiftView';


// Admin Components
const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ validationLogs: any[], claims: any[] }>({ validationLogs: [], claims: [] });

  const fetchLogs = async () => {
    const res = await fetch('/api/admin/logs');
    const data = await res.json();
    setLogs(data);
  };

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  const generateLink = () => {
    const link = `${window.location.origin}/regalo/${Math.random().toString(36).substring(2, 10)}`;
    setGeneratedLink(link);
  };

  const exportToCSV = (data: any[], filename: string, columns: { header: string, map: (item: any) => string }[]) => {
    const csvContent = [
        columns.map(c => c.header).join(','),
        ...data.map(item => columns.map(c => JSON.stringify(c.map(item))).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'clientes', name: 'Gestión de Clientes', icon: Users },
    { id: 'logs', name: 'Log de Actividad', icon: Search },
    { id: 'regalo', name: 'Enviar Regalo', icon: Gift },
    { id: 'config', name: 'Configuración', icon: Settings },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans text-neutral-200">
        <div className="bg-[#111] p-8 rounded-3xl border border-[#222] shadow-2xl w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-neutral-900 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-[#222]">
            <Lock className="text-amber-500" size={32} />
          </div>
          <h1 className="text-2xl font-bold font-serif mb-2 text-white">Acceso Restringido</h1>
          <p className="text-neutral-500 text-sm mb-6">Ingresa la clave de administrador para continuar.</p>
          <input 
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl p-4 text-center text-white mb-4 focus:border-amber-500 outline-none transition-colors"
            onKeyDown={(e) => {
                if (e.key === 'Enter' && password === 'adminrv123') setIsAuthenticated(true);
            }}
          />
          <button 
            onClick={() => { if (password === 'adminrv123') setIsAuthenticated(true); }}
            className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold py-4 rounded-xl transition-all"
          >
            ENTRAR AL PANEL
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 flex font-sans">
      <aside className={`bg-[#111] border-r border-[#222] w-64 ${isSidebarOpen ? 'block' : 'hidden'} md:block`}>
        <div className="p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-amber-500 tracking-wider">CLUB RV</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
            <X size={24} />
          </button>
        </div>
        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 hover:bg-[#1a1a1a] transition-all ${activeTab === item.id ? 'bg-[#1a1a1a] text-amber-500 border-r-2 border-amber-500' : 'text-neutral-500'}`}
            >
              <item.icon size={20} />
              {item.name}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-[#111]/80 backdrop-blur-sm border-b border-[#222] p-4 flex items-center justify-between sticky top-0 z-10">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold text-neutral-100 capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <LogOut size={16} className="text-neutral-600 hover:text-amber-500 cursor-pointer" onClick={() => setIsAuthenticated(false)} />
          </div>
        </header>

        <section className="p-8">
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Links Enviados', val: '1,240' },
                  { title: 'Regalos Reclamados', val: '865' },
                  { title: 'Aprobados', val: '792' },
                  { title: 'Rechazados', val: '73' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#111] p-6 rounded-2xl border border-[#222] shadow-sm">
                    <p className="text-neutral-500 text-xs uppercase tracking-widest">{stat.title}</p>
                    <p className="text-4xl font-bold text-white mt-2">{stat.val}</p>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'logs' && (
              <div className="space-y-8">
                <div className="bg-[#111] p-8 rounded-2xl border border-[#222]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-neutral-200 font-serif">Intentos de Validación (Cédulas)</h2>
                        <button onClick={() => exportToCSV(logs.validationLogs, 'validaciones.csv', [
                            { header: 'Cédula', map: i => i.cedula },
                            { header: 'Estado', map: i => i.valid ? 'Exito' : 'Fallido' },
                            { header: 'Fecha', map: i => new Date(i.timestamp).toLocaleString() }
                        ])} className="text-xs bg-[#222] text-neutral-400 px-3 py-1 rounded hover:text-white">Exportar CSV</button>
                    </div>
                    <div className="space-y-2">
                        {logs.validationLogs.map((log, i) => (
                            <div key={i} className="flex justify-between bg-[#1a1a1a] p-4 rounded-lg text-sm">
                                <span className="font-mono">{log.cedula}</span>
                                <span className={`${log.valid ? 'text-green-500' : 'text-red-500'}`}>{log.valid ? 'Éxito' : 'Fallido'}</span>
                                <span className="text-neutral-600">{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-[#111] p-8 rounded-2xl border border-[#222]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-neutral-200 font-serif">Reclamaciones Exitosas</h2>
                        <button onClick={() => exportToCSV(logs.claims, 'reclamaciones.csv', [
                            { header: 'Nombre', map: i => i.name },
                            { header: 'Premio', map: i => i.prize.toString() },
                            { header: 'Fecha', map: i => new Date(i.timestamp).toLocaleString() }
                        ])} className="text-xs bg-[#222] text-neutral-400 px-3 py-1 rounded hover:text-white">Exportar CSV</button>
                    </div>
                    <div className="space-y-2">
                        {logs.claims.map((claim, i) => (
                            <div key={i} className="flex justify-between bg-[#1a1a1a] p-4 rounded-lg text-sm">
                                <span className="font-bold">{claim.name}</span>
                                <span className="text-amber-500">RD${claim.prize}</span>
                                <span className="text-neutral-600">{new Date(claim.timestamp).toLocaleDateString()} {new Date(claim.timestamp).toLocaleTimeString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            )}
            
            {activeTab === 'regalo' && (
              <div className="bg-[#111] p-8 rounded-2xl border border-[#222]">
                <h2 className="text-lg font-bold text-amber-500 mb-6">Generador de Links Premium</h2>
                <div className="space-y-6">
                  <div>
                     <label className="block text-xs uppercase text-neutral-500 mb-2">Monto del Regalo (RD$)</label>
                     <input type="number" defaultValue="5000" className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg p-3" />
                  </div>
                  <button onClick={generateLink} className="flex items-center gap-2 bg-amber-600 text-black px-6 py-3 rounded-lg font-bold hover:bg-amber-500 transition-all">
                    <Copy size={18} /> Generar Link Único
                  </button>
                  
                  {generatedLink && (
                    <div className="border border-neutral-800 p-5 rounded-xl bg-[#0a0a0a] space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
                      <span className="text-neutral-300 font-mono text-sm break-all md:break-normal">{generatedLink}</span>
                      <div className="flex gap-3 justify-end shrink-0">
                        <button
                            onClick={() => navigator.clipboard.writeText(generatedLink)}
                            className="flex items-center gap-2 text-neutral-500 hover:text-white px-4 py-2 rounded-lg bg-[#1a1a1a] transition-colors"
                        >
                            <Copy size={16} /> <span className="hidden md:inline text-xs uppercase tracking-wider font-bold">Copiar</span>
                        </button>
                        <a 
                            href={`https://wa.me/18092840274?text=Hola, te envio tu regalo exclusivo: ${generatedLink}`} 
                            target="_blank"
                            className="flex items-center gap-2 text-amber-500 hover:text-amber-400 px-4 py-2 rounded-lg bg-[#1a1a1a] transition-colors"
                        >
                            <Send size={16} /> <span className="hidden md:inline text-xs uppercase tracking-wider font-bold">WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
        </section>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/regalo/:id" element={<GiftView />} />
      </Routes>
    </BrowserRouter>
  );
}


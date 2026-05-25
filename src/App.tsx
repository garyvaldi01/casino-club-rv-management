/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Gift, Settings, Menu, X, LogOut, Copy, Send, 
  Smartphone, Plus, Search, Lock, TrendingUp, CheckCircle2, AlertCircle, RefreshCw 
} from 'lucide-react';
import GiftView from './components/GiftView';

// Admin Components
const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({ cedula: '', name: '', min: 500, max: 800 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logs, setLogs] = useState<{ 
    validationLogs: any[], 
    claims: any[],
    generatedPrizes?: Record<string, { name: string, prize: number, timestamp: string }>,
    users?: Record<string, { name: string, min: number, max: number }>
  }>({ validationLogs: [], claims: [], generatedPrizes: {}, users: {} });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/logs');
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error("Error loading admin logs", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
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

  // Calculations for dynamic stats
  const totalAttempts = logs.validationLogs.length;
  const totalClaims = logs.claims.length;
  const totalApproved = logs.validationLogs.filter((l: any) => l.valid).length;
  const totalRejected = logs.validationLogs.filter((l: any) => !l.valid).length;

  const totalClaimedAmount = logs.claims.reduce((acc: number, curr: any) => acc + curr.prize, 0);

  const generatedList = Object.entries(logs.generatedPrizes || {}).map(([cedula, info]: [string, any]) => {
    const isClaimed = logs.claims.some((c: any) => c.name.toLowerCase() === info.name.toLowerCase());
    return {
      cedula,
      name: info.name,
      prize: info.prize,
      timestamp: info.timestamp,
      isClaimed
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const totalGeneratedAmount = generatedList.reduce((acc, curr) => acc + curr.prize, 0);
  const conversionRate = generatedList.length > 0 ? ((totalClaims / generatedList.length) * 100).toFixed(1) : '0.0';

  const clientList = Object.entries(logs.users || {}).map(([cedula, info]: [string, any]) => {
    const generated = logs.generatedPrizes?.[cedula];
    const isClaimed = generated ? logs.claims.some((c: any) => c.name.toLowerCase() === generated.name.toLowerCase()) : false;
    return {
      cedula,
      name: info.name,
      min: info.min,
      max: info.max,
      generatedPrize: generated?.prize,
      generatedTime: generated?.timestamp,
      isClaimed,
      status: isClaimed ? 'reclamado' : generated?.prize ? 'ruleta' : 'pendiente'
    };
  }).filter(c => {
    if (statusFilter !== 'todos' && c.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return c.name.toLowerCase().includes(term) || c.cedula.includes(term) || (c.generatedPrize && c.generatedPrize.toString().includes(term));
    }
    return true;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const processData = (data: any[]) => {
      const formatted = data.map(row => {
        const keys = Object.keys(row);
        const name = row.name || row.Nombre || row.nombre || row[keys[0]] || '';
        const cedula = String(row.cedula || row.RUT || row.rut || row.Cedula || row[keys[1]] || '').trim();
        const min = Number(row.min || row.Minimo || row.minimo || row[keys[2]]) || 500;
        const max = Number(row.max || row.Maximo || row.maximo || row[keys[3]]) || 800;
        return { name, cedula, min, max };
      }).filter(u => u.cedula && u.name);

      fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: formatted })
      }).then(() => {
          fetchLogs();
          if (fileInputRef.current) fileInputRef.current.value = '';
      });
    };

    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processData(results.data)
      });
    } else if (file.name.endsWith('.xlsx')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        processData(data);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/admin/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
    }).then(() => {
        setShowAddForm(false);
        setNewClient({ cedula: '', name: '', min: 500, max: 800 });
        fetchLogs();
    });
  };

  const handleDeleteClient = (cedula: string) => {
      if (confirm('¿Estás seguro de eliminar este ganador?')) {
        fetch(`/api/admin/users/${cedula}`, { method: 'DELETE' }).then(() => fetchLogs());
      }
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
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-neutral-100 capitalize">{activeTab === 'dashboard' ? 'Panel de Control' : activeTab}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchLogs} 
              disabled={isRefreshing}
              className="text-neutral-500 hover:text-amber-500 transition-colors p-2 rounded-lg bg-[#1a1a1a] border border-[#222] flex items-center gap-1 text-xs"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <LogOut size={16} className="text-neutral-600 hover:text-amber-500 cursor-pointer transition-colors" onClick={() => setIsAuthenticated(false)} />
          </div>
        </header>

        <section className="p-8">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Statistics cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { 
                      title: 'Consultas Realizadas', 
                      val: totalAttempts, 
                      sub: `Aprobadas: ${totalApproved} | Fallidas: ${totalRejected}`,
                      icon: Search,
                      color: 'border-blue-500/20 text-blue-400'
                    },
                    { 
                      title: 'Regalos Asignados', 
                      val: generatedList.length, 
                      sub: `Asignado: RD$ ${totalGeneratedAmount.toLocaleString()}`,
                      icon: Gift,
                      color: 'border-amber-500/20 text-amber-500'
                    },
                    { 
                      title: 'Reclamados WhatsApp', 
                      val: totalClaims, 
                      sub: `Reclamado: RD$ ${totalClaimedAmount.toLocaleString()}`,
                      icon: Send,
                      color: 'border-emerald-500/20 text-emerald-400'
                    },
                    { 
                      title: 'Conversión WhatsApp', 
                      val: `${conversionRate}%`, 
                      sub: 'Giro de ruleta completado',
                      icon: TrendingUp,
                      color: 'border-rose-500/20 text-rose-400'
                    },
                  ].map((stat, i) => (
                    <div key={i} className={`bg-[#111] p-6 rounded-2xl border ${stat.color.split(' ')[0]} shadow-md flex items-start justify-between hover:scale-[1.02] transition-transform`}>
                      <div className="space-y-2">
                        <p className="text-neutral-500 text-xs uppercase tracking-widest font-bold">{stat.title}</p>
                        <p className="text-4xl font-extrabold text-white">{stat.val}</p>
                        <p className="text-neutral-400 text-xs">{stat.sub}</p>
                      </div>
                      <div className={`p-3 rounded-xl bg-neutral-900/60 border border-[#222] ${stat.color.split(' ')[1]}`}>
                        <stat.icon size={22} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Main Dashboard view - Recent Assigned Prizes */}
                <div className="bg-[#111] p-8 rounded-3xl border border-[#222] shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-neutral-200 font-serif">Regalos Asignados en Ruleta</h2>
                      <p className="text-xs text-neutral-500 mt-1">Lista en tiempo real de los premios que les han salido a los clientes.</p>
                    </div>
                    <button 
                      onClick={() => exportToCSV(generatedList, 'premios_asignados.csv', [
                        { header: 'Cédula', map: i => i.cedula },
                        { header: 'Nombre', map: i => i.name },
                        { header: 'Monto Regalo', map: i => i.prize.toString() },
                        { header: 'Fecha', map: i => new Date(i.timestamp).toLocaleString() },
                        { header: 'Estado', map: i => i.isClaimed ? 'Reclamado' : 'Espera WhatsApp' }
                      ])} 
                      className="text-xs bg-amber-600 text-black px-4 py-2 rounded-xl font-bold hover:bg-amber-500 transition-colors"
                    >
                      Exportar CSV
                    </button>
                  </div>

                  {generatedList.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-[#222] rounded-2xl">
                      <Gift className="mx-auto text-neutral-600 mb-4" size={48} />
                      <p className="text-neutral-400 font-semibold">Ningún cliente ha girado la ruleta aún.</p>
                      <p className="text-xs text-neutral-600 mt-1">Los regalos generados aparecerán automáticamente aquí.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#222] text-xs text-neutral-500 uppercase tracking-widest">
                            <th className="pb-4 font-bold">Jugador</th>
                            <th className="pb-4 font-bold">Cédula</th>
                            <th className="pb-4 font-bold">Monto Asignado</th>
                            <th className="pb-4 font-bold">Fecha / Hora</th>
                            <th className="pb-4 font-bold">Estado Regalo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222] text-sm">
                          {generatedList.map((item, idx) => (
                            <tr key={idx} className="hover:bg-[#151515] transition-colors group">
                              <td className="py-4 font-semibold text-white group-hover:text-amber-500 transition-colors">{item.name}</td>
                              <td className="py-4 font-mono text-neutral-400">{item.cedula}</td>
                              <td className="py-4 font-extrabold text-amber-500 text-base">RD$ {item.prize.toLocaleString()}</td>
                              <td className="py-4 text-neutral-400">{new Date(item.timestamp).toLocaleString()}</td>
                              <td className="py-4">
                                {item.isClaimed ? (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 flex items-center gap-1.5 w-fit">
                                    <CheckCircle2 size={12} />
                                    Reclamado
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/50 flex items-center gap-1.5 w-fit animate-pulse">
                                    <AlertCircle size={12} />
                                    En Espera WhatsApp
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'clientes' && (
              <div className="space-y-6">
                <div className="bg-[#111] p-8 rounded-3xl border border-[#222]">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-neutral-200 font-serif">Base de Datos de Ganadores</h2>
                      <p className="text-xs text-neutral-500 mt-1">Total registrados: {Object.keys(logs.users || {}).length}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="file" accept=".csv,.xlsx,.txt" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                        <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-[#1a1a1a] text-neutral-300 border border-[#222] px-4 py-2 rounded-xl hover:text-white hover:border-neutral-500 transition-colors">
                            Importar Excel/CSV
                        </button>
                        <button onClick={() => setShowAddForm(!showAddForm)} className="text-xs flex items-center gap-2 bg-amber-600 text-black px-4 py-2 rounded-xl font-bold hover:bg-amber-500 transition-colors">
                            <Plus size={14} /> Nuevo
                        </button>
                    </div>
                  </div>

                  {showAddForm && (
                      <form onSubmit={handleAddClient} className="mb-8 p-6 bg-neutral-900 border border-[#222] rounded-2xl grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                          <div className="md:col-span-2">
                              <label className="block text-xs uppercase text-neutral-500 mb-1">Nombre Completo</label>
                              <input required type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg p-2 text-white" />
                          </div>
                          <div>
                              <label className="block text-xs uppercase text-neutral-500 mb-1">RUT / Cédula</label>
                              <input required type="text" value={newClient.cedula} onChange={e => setNewClient({...newClient, cedula: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg p-2 text-white" />
                          </div>
                          <div>
                              <label className="block text-xs uppercase text-neutral-500 mb-1">Monto (Rango)</label>
                              <div className="flex gap-2">
                                  <input required type="number" value={newClient.min} onChange={e => setNewClient({...newClient, min: Number(e.target.value)})} className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg p-2 text-white" placeholder="Min" />
                                  <input required type="number" value={newClient.max} onChange={e => setNewClient({...newClient, max: Number(e.target.value)})} className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg p-2 text-white" placeholder="Max" />
                              </div>
                          </div>
                          <div>
                              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg transition-colors">Guardar</button>
                          </div>
                      </form>
                  )}

                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                      <div className="flex-1 relative">
                          <Search size={16} className="absolute left-3 top-3 text-neutral-500" />
                          <input 
                              type="text" 
                              placeholder="Buscar por nombre, RUT o monto..." 
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#222] rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                          />
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                          {['todos', 'pendiente', 'ruleta', 'reclamado'].map(status => (
                              <button 
                                  key={status}
                                  onClick={() => setStatusFilter(status)}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                                      statusFilter === status 
                                      ? 'bg-amber-600 text-black' 
                                      : 'bg-[#1a1a1a] text-neutral-500 border border-[#222] hover:text-white'
                                  }`}
                              >
                                  {status}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="border-b border-[#222] text-xs text-neutral-500 uppercase tracking-widest">
                            <th className="pb-4 font-bold">Ganador</th>
                            <th className="pb-4 font-bold">RUT / Cédula</th>
                            <th className="pb-4 font-bold">Premio Configurado</th>
                            <th className="pb-4 font-bold">Premio Generado</th>
                            <th className="pb-4 font-bold">Estado</th>
                            <th className="pb-4 font-bold text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222] text-sm">
                          {clientList.length === 0 ? (
                              <tr>
                                  <td colSpan={6} className="py-8 text-center text-neutral-500">No se encontraron ganadores.</td>
                              </tr>
                          ) : clientList.map((client, idx) => (
                            <tr key={idx} className="hover:bg-[#151515] transition-colors group">
                              <td className="py-4 font-semibold text-white">{client.name}</td>
                              <td className="py-4 font-mono text-neutral-400">{client.cedula}</td>
                              <td className="py-4 text-neutral-300">RD$ {client.min.toLocaleString()} - {client.max.toLocaleString()}</td>
                              <td className="py-4 font-extrabold text-amber-500">{client.generatedPrize ? `RD$ ${client.generatedPrize.toLocaleString()}` : '-'}</td>
                              <td className="py-4">
                                {client.isClaimed ? (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 flex items-center gap-1.5 w-fit">
                                    <CheckCircle2 size={12} />
                                    Reclamado
                                  </span>
                                ) : client.generatedPrize ? (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/50 flex items-center gap-1.5 w-fit animate-pulse">
                                    <AlertCircle size={12} />
                                    Ruleta (Esperando)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-900 text-neutral-400 border border-neutral-800 flex items-center gap-1.5 w-fit">
                                    Pendiente
                                  </span>
                                )}
                              </td>
                              <td className="py-4 text-right space-x-2">
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/regalo/${Math.random().toString(36).substring(2, 10)}`);
                                        alert('Link copiado. El cliente necesitará su RUT para ingresar.');
                                    }}
                                    className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
                                >
                                    Link
                                </button>
                                <button 
                                    onClick={() => handleDeleteClient(client.cedula)}
                                    className="text-xs text-rose-500 hover:text-rose-400 transition-colors"
                                >
                                    Eliminar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  </div>
                </div>
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
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {logs.validationLogs.map((log, i) => (
                            <div key={i} className="flex justify-between bg-[#1a1a1a] p-4 rounded-lg text-sm border border-[#222]/30">
                                <span className="font-mono text-white">{log.cedula}</span>
                                <span className={`${log.valid ? 'text-emerald-500 font-semibold' : 'text-rose-500'}`}>{log.valid ? 'Éxito' : 'Fallido'}</span>
                                <span className="text-neutral-500">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-[#111] p-8 rounded-2xl border border-[#222]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-neutral-200 font-serif">Reclamaciones Exitosas (WhatsApp)</h2>
                        <button onClick={() => exportToCSV(logs.claims, 'reclamaciones.csv', [
                            { header: 'Nombre', map: i => i.name },
                            { header: 'Premio', map: i => i.prize.toString() },
                            { header: 'Fecha', map: i => new Date(i.timestamp).toLocaleString() }
                        ])} className="text-xs bg-[#222] text-neutral-400 px-3 py-1 rounded hover:text-white">Exportar CSV</button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {logs.claims.map((claim, i) => (
                            <div key={i} className="flex justify-between bg-[#1a1a1a] p-4 rounded-lg text-sm border border-[#222]/30">
                                <span className="font-bold text-white">{claim.name}</span>
                                <span className="text-amber-500 font-extrabold text-base">RD${claim.prize.toLocaleString()}</span>
                                <span className="text-neutral-500">{new Date(claim.timestamp).toLocaleString()}</span>
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
                     <label className="block text-xs uppercase text-neutral-500 mb-2">Monto de Regalo Recomendado (RD$)</label>
                     <input type="number" defaultValue="5000" className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg p-3 text-white" />
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


import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, RecordMode, IndividualType, User, WorkRecord, AuthState, Photo } from './types';
import { StorageService, generateUUID } from './services/storage';
import { calculateEarnings, formatCurrency } from './services/calculator';
import { 
  PlusIcon, HistoryIcon, TrashIcon, CameraIcon, 
  DownloadIcon, LogoutIcon, ChevronLeftIcon, XIcon
} from './components/Icons';

/* --- ERROR BOUNDARY (Fixes White Screen) --- */
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("App Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 max-w-sm w-full">
            <h2 className="text-xl font-bold text-red-600 mb-2">Ops! Algo deu errado.</h2>
            <p className="text-gray-600 mb-4 text-sm">O aplicativo encontrou um erro inesperado.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-500/30"
            >
              Reiniciar Aplicativo
            </button>
            <div className="mt-4 p-2 bg-gray-100 rounded text-left overflow-hidden">
               <p className="text-xs text-gray-500 font-mono truncate">{this.state.error?.message}</p>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* --- HELPER COMPONENTS --- */

const Button = ({ 
  children, onClick, variant = 'primary', className = '', type = 'button', disabled = false 
}: { 
  children: React.ReactNode, onClick?: () => void, variant?: 'primary' | 'secondary' | 'danger' | 'outline', className?: string, type?: 'button' | 'submit', disabled?: boolean 
}) => {
  const baseStyle = "px-4 py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-brand-600 text-white shadow-lg shadow-brand-500/30",
    secondary: "bg-white text-gray-700 border border-gray-200 shadow-sm",
    danger: "bg-red-500 text-white shadow-lg shadow-red-500/30",
    outline: "bg-transparent text-brand-600 border border-brand-600"
  };
  
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${className}`}>
    {children}
  </div>
);

const Input = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div className="flex flex-col gap-1 mb-4">
    <label className="text-sm font-medium text-gray-600 ml-1">{label}</label>
    <input 
      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-brand-500 transition-all"
      {...props}
    />
  </div>
);

/* --- SCREENS --- */

// 1. LOGIN SCREEN
const LoginScreen = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [activeTab, setActiveTab] = useState<'DRIVER' | 'ADMIN'>('DRIVER');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setFullName('');
    setError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = StorageService.authenticate(username, password);
    
    if (result.success && result.user) {
      if (activeTab === 'ADMIN' && result.user.role !== UserRole.ADMIN) {
        setError('Esta conta não possui privilégios de administrador.');
        return;
      }
      onLogin(result.user);
    } else {
      setError(result.message || 'Falha na autenticação.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !username || !password) {
      setError('Todos os campos são obrigatórios.');
      return;
    }

    const result = StorageService.registerUser(fullName, username, password);
    if (result.success && result.user) {
      onLogin(result.user);
    } else {
      setError(result.message || 'Erro ao criar conta.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-6">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-brand-600 mb-2 tracking-tight">PayLoad</h1>
        <p className="text-gray-500">Controle de ganhos para motoristas</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => { setActiveTab('DRIVER'); setIsRegistering(false); resetForm(); }}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'DRIVER' ? 'bg-brand-50 text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            ENTREGADOR
          </button>
          <button 
            onClick={() => { setActiveTab('ADMIN'); setIsRegistering(false); resetForm(); }}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'ADMIN' ? 'bg-brand-50 text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            ADMINISTRADOR
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'ADMIN' && (
            <form onSubmit={handleLogin} className="animate-in fade-in duration-300">
              <div className="mb-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <h3 className="text-gray-800 font-bold">Área Restrita</h3>
                <p className="text-sm text-gray-500">Acesso exclusivo para administração</p>
              </div>

              <Input 
                label="Usuário Admin" 
                placeholder="Ex: admin" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
              />
              <Input 
                label="Senha" 
                type="password" 
                placeholder="••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />

              {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-2 rounded-lg">{error}</p>}

              <Button type="submit" className="w-full bg-gray-800 shadow-gray-500/30">Entrar como Admin</Button>
            </form>
          )}

          {activeTab === 'DRIVER' && !isRegistering && (
            <form onSubmit={handleLogin} className="animate-in fade-in duration-300">
              <Input 
                label="Usuário" 
                placeholder="Seu nome de usuário" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
              />
              <Input 
                label="Senha" 
                type="password" 
                placeholder="••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
              
              {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-2 rounded-lg">{error}</p>}
              
              <Button type="submit" className="w-full">Entrar</Button>

              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">Não tem uma conta?</p>
                <button 
                  type="button" 
                  onClick={() => { setIsRegistering(true); resetForm(); }}
                  className="text-brand-600 font-bold text-sm mt-1 hover:underline"
                >
                  Criar Cadastro
                </button>
              </div>
            </form>
          )}

          {activeTab === 'DRIVER' && isRegistering && (
            <form onSubmit={handleRegister} className="animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Novo Cadastro</h3>
              
              <Input 
                label="Nome Completo" 
                placeholder="Seu nome real" 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
              />
              <Input 
                label="Criar Usuário" 
                placeholder="ex: joaosilva" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
              />
              <Input 
                label="Criar Senha" 
                type="password" 
                placeholder="••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />

              {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-2 rounded-lg">{error}</p>}

              <Button type="submit" className="w-full">Cadastrar e Entrar</Button>

              <button 
                type="button" 
                onClick={() => { setIsRegistering(false); resetForm(); }}
                className="w-full mt-4 text-gray-500 text-sm hover:text-gray-800"
              >
                Voltar para Login
              </button>
            </form>
          )}
        </div>
      </Card>
      
      <div className="mt-8 text-center text-xs text-gray-300">
        v1.0.4
      </div>
    </div>
  );
};

// 2. NEW RECORD FORM
const NewRecordScreen = ({ user, onCancel, onSave }: { user: User, onCancel: () => void, onSave: () => void }) => {
  const [mode, setMode] = useState<RecordMode>(RecordMode.INDIVIDUAL);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [idField, setIdField] = useState('');
  const [idField2, setIdField2] = useState('');
  const [areaIds, setAreaIds] = useState<number>(1);
  
  const [qtyParcel, setQtyParcel] = useState<string>(''); 
  const [qtyCollection, setQtyCollection] = useState<string>(''); 

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [preview, setPreview] = useState<number>(0);

  useEffect(() => {
    let totalVal = 0;

    if (mode === RecordMode.INDIVIDUAL) {
      const p = parseInt(qtyParcel) || 0;
      const c = parseInt(qtyCollection) || 0;
      
      const resP = calculateEarnings(RecordMode.INDIVIDUAL, p, IndividualType.PARCEL);
      const resC = calculateEarnings(RecordMode.INDIVIDUAL, c, IndividualType.COLLECTION);
      
      totalVal = resP.value + resC.value;
    } else {
      const q = parseInt(qtyParcel) || 0;
      const res = calculateEarnings(RecordMode.AREA, q, undefined, areaIds);
      totalVal = res.value;
    }
    
    setPreview(totalVal);
  }, [mode, qtyParcel, qtyCollection, areaIds]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos([...photos, {
          id: generateUUID(),
          dataUrl: reader.result as string,
          timestamp: Date.now()
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalIdField = idField;
    if (mode === RecordMode.AREA && areaIds === 2 && idField2) {
      finalIdField = `${idField} + ${idField2}`;
    }

    if (!finalIdField) return;

    const baseRecord = {
      userId: user.id,
      userName: user.name,
      date,
      idField: finalIdField,
      photos,
      createdAt: Date.now()
    };

    if (mode === RecordMode.AREA) {
      const qty = parseInt(qtyParcel);
      if (!qty) return;

      const calc = calculateEarnings(RecordMode.AREA, qty, undefined, areaIds);
      
      StorageService.addRecord({
        ...baseRecord,
        id: generateUUID(),
        mode: RecordMode.AREA,
        areaIdCount: areaIds,
        quantity: qty,
        calculatedValue: calc.value
      });

    } else {
      const p = parseInt(qtyParcel) || 0;
      const c = parseInt(qtyCollection) || 0;

      if (p === 0 && c === 0) return;

      if (p > 0) {
        const calcP = calculateEarnings(RecordMode.INDIVIDUAL, p, IndividualType.PARCEL);
        StorageService.addRecord({
          ...baseRecord,
          id: generateUUID(),
          mode: RecordMode.INDIVIDUAL,
          individualType: IndividualType.PARCEL,
          quantity: p,
          calculatedValue: calcP.value
        });
      }

      if (c > 0) {
        const calcC = calculateEarnings(RecordMode.INDIVIDUAL, c, IndividualType.COLLECTION);
        StorageService.addRecord({
          ...baseRecord,
          id: generateUUID(),
          mode: RecordMode.INDIVIDUAL,
          individualType: IndividualType.COLLECTION,
          quantity: c,
          calculatedValue: calcC.value
        });
      }
    }

    onSave();
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onCancel} className="p-2 -ml-2 text-gray-600"><ChevronLeftIcon /></button>
        <h2 className="text-2xl font-bold text-gray-800">Novo Registro</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            type="button"
            className={`py-3 rounded-xl font-semibold border ${mode === RecordMode.INDIVIDUAL ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500' : 'bg-white border-gray-200 text-gray-600'}`}
            onClick={() => setMode(RecordMode.INDIVIDUAL)}
          >
            Individual
          </button>
          <button 
            type="button"
            className={`py-3 rounded-xl font-semibold border ${mode === RecordMode.AREA ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500' : 'bg-white border-gray-200 text-gray-600'}`}
            onClick={() => setMode(RecordMode.AREA)}
          >
            Daily
          </button>
        </div>

        <Card className="flex flex-col gap-4">
          <Input label="Data" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          
          {mode === RecordMode.AREA && (
            <div className="flex flex-col gap-1 mb-2">
              <label className="text-sm font-medium text-gray-600 ml-1">Quantidade de IDs</label>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                 <button 
                  type="button"
                  onClick={() => setAreaIds(1)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${areaIds === 1 ? 'bg-white shadow text-brand-600' : 'text-gray-500'}`}
                 >
                   1 ID
                 </button>
                 <button 
                  type="button"
                  onClick={() => setAreaIds(2)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${areaIds === 2 ? 'bg-white shadow text-brand-600' : 'text-gray-500'}`}
                 >
                   2 IDs
                 </button>
              </div>
            </div>
          )}

          {mode === RecordMode.AREA && areaIds === 2 ? (
            <>
              <Input label="ID da Rota 1" placeholder="Ex: Rota-A" value={idField} onChange={e => setIdField(e.target.value)} required />
              <Input label="ID da Rota 2" placeholder="Ex: Rota-B" value={idField2} onChange={e => setIdField2(e.target.value)} required />
            </>
          ) : (
            <Input label="ID da Rota" placeholder="Ex: Rota-123" value={idField} onChange={e => setIdField(e.target.value)} required />
          )}

          {mode === RecordMode.INDIVIDUAL ? (
            <div className="flex flex-col gap-4">
              <Input 
                label="Qtd. Parcelas (Ganho £1.00/un)" 
                type="number" 
                inputMode="numeric" 
                placeholder="0" 
                value={qtyParcel} 
                onChange={e => setQtyParcel(e.target.value)} 
              />
              <Input 
                label="Qtd. Coletas (Ganho £0.80/un)" 
                type="number" 
                inputMode="numeric" 
                placeholder="0" 
                value={qtyCollection} 
                onChange={e => setQtyCollection(e.target.value)} 
              />
            </div>
          ) : (
            <Input 
              label="Qtd. Parcelas" 
              type="number" 
              inputMode="numeric" 
              placeholder="0" 
              value={qtyParcel} 
              onChange={e => setQtyParcel(e.target.value)} 
              required 
            />
          )}

        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-600">Fotos / Comprovantes</label>
            <label className="bg-brand-50 text-brand-600 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer active:opacity-70">
              <CameraIcon className="w-4 h-4" />
              Adicionar
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
          
          {photos.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
              Nenhuma foto adicionada
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map(p => (
                <div key={p.id} className="aspect-square rounded-lg overflow-hidden relative shadow-sm">
                  <img src={p.dataUrl} alt="proof" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => setPhotos(photos.filter(x => x.id !== p.id))}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 backdrop-blur-sm"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-xl pb-6">
           <div className="flex items-center justify-between mb-3 px-1">
             <span className="text-gray-500 font-medium">Ganho Estimado:</span>
             <span className="text-2xl font-bold text-brand-600">{formatCurrency(preview)}</span>
           </div>
           <Button type="submit" className="w-full text-lg shadow-brand-500/40">Salvar Registro</Button>
        </div>

      </form>
    </div>
  );
};

// 3. HISTORY SCREEN
const HistoryScreen = ({ 
  user, 
  records, 
  onDelete, 
  onBack,
  isAdmin = false 
}: { 
  user: User, 
  records: WorkRecord[], 
  onDelete: (id: string) => void, 
  onBack?: () => void,
  isAdmin?: boolean
}) => {
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const g: Record<string, { total: number, items: WorkRecord[] }> = {};
    records.forEach(r => {
      const monthKey = r.date.substring(0, 7); 
      if (!g[monthKey]) g[monthKey] = { total: 0, items: [] };
      g[monthKey].items.push(r);
      g[monthKey].total += r.calculatedValue;
    });
    return g;
  }, [records]);

  const handleExport = (monthKey: string) => {
    const csv = StorageService.exportToCSV(grouped[monthKey].items);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `folha_${monthKey}_${user.username}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedMonths = Object.keys(grouped).sort().reverse();

  return (
    <div className="p-4 pb-20">
      {viewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <button 
            onClick={() => setViewPhoto(null)}
            className="absolute top-4 right-4 text-white p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
           >
             <XIcon className="w-6 h-6"/>
           </button>
           <img src={viewPhoto} alt="Proof Fullscreen" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
        </div>
      )}

      {onBack && (
        <div className="flex items-center gap-2 mb-6">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600"><ChevronLeftIcon /></button>
          <h2 className="text-2xl font-bold text-gray-800">Histórico</h2>
        </div>
      )}

      {!onBack && <h2 className="text-2xl font-bold text-gray-800 mb-6">Histórico</h2>}

      {records.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>Nenhum registro encontrado.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {sortedMonths.map(month => {
            const [y, m] = month.split('-');
            const dateObj = new Date(parseInt(y), parseInt(m)-1);
            const monthName = dateObj.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
            
            return (
              <div key={month} className="flex flex-col gap-3">
                <div className="flex items-center justify-between sticky top-0 bg-gray-50 py-2 z-10">
                  <h3 className="text-lg font-bold capitalize text-gray-700">{monthName}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-brand-600 font-bold bg-brand-50 px-2 py-1 rounded text-sm">
                      {formatCurrency(grouped[month].total)}
                    </span>
                    <button onClick={() => handleExport(month)} className="text-gray-500 hover:text-brand-600">
                      <DownloadIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {grouped[month].items.map(record => (
                  <Card key={record.id} className="relative overflow-hidden transition-all">
                     <div 
                      className="flex justify-between items-start cursor-pointer" 
                      onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                     >
                       <div className="flex gap-3">
                         <div className={`w-1 self-stretch rounded-full ${record.mode === RecordMode.INDIVIDUAL ? 'bg-brand-500' : 'bg-purple-400'}`}></div>
                         <div>
                           <p className="font-bold text-gray-800 flex items-center gap-2">
                             {new Date(record.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                             <span className="font-normal text-gray-400 text-sm">|</span>
                             {record.idField}
                           </p>
                           <p className="text-sm text-gray-500 mt-0.5">
                             {record.mode === RecordMode.INDIVIDUAL ? (
                               <span>{record.individualType === IndividualType.PARCEL ? 'Parcela' : 'Coleta'} • {record.quantity} un.</span>
                             ) : (
                               <span>Daily • {record.areaIdCount} IDs • {record.quantity} un.</span>
                             )}
                           </p>
                         </div>
                       </div>
                       <div className="text-right">
                         <span className="block font-bold text-gray-900">{formatCurrency(record.calculatedValue)}</span>
                         {record.photos.length > 0 && (
                           <span className="text-xs text-gray-400 flex items-center justify-end gap-1 mt-1">
                             <CameraIcon className="w-3 h-3" /> {record.photos.length}
                           </span>
                         )}
                       </div>
                     </div>

                     {expandedRecord === record.id && (
                       <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                          <div className="flex justify-between items-end">
                            <div className="flex gap-2">
                              {record.photos.map(p => (
                                <button 
                                  key={p.id} 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setViewPhoto(p.dataUrl); }}
                                  className="block w-12 h-12 rounded bg-gray-100 overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity"
                                >
                                  <img src={p.dataUrl} className="w-full h-full object-cover" alt="thumbnail" />
                                </button>
                              ))}
                            </div>
                            <Button variant="danger" className="py-1 px-3 text-sm" onClick={() => onDelete(record.id)}>
                              Apagar
                            </Button>
                          </div>
                          {isAdmin && (
                            <div className="mt-2 text-xs text-gray-400">
                              Usuário: {record.userName}
                            </div>
                          )}
                       </div>
                     )}
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 4. ADMIN DASHBOARD
const AdminDashboard = ({ 
  onLogout, 
  onSelectUser 
}: { 
  onLogout: () => void, 
  onSelectUser: (u: User) => void 
}) => {
  const users = StorageService.getUsers().filter(u => u.role !== UserRole.ADMIN);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Administração</h2>
        <button onClick={onLogout} className="text-red-500 bg-red-50 p-2 rounded-lg">
          <LogoutIcon />
        </button>
      </div>

      <div className="mb-6">
         <Input label="Buscar Usuário" placeholder="Nome ou username..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="flex flex-col gap-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Nenhum motorista encontrado.</div>
        ) : (
          filteredUsers.map(u => (
            <Card key={u.id}>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                      {u.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <p className="font-bold text-gray-800">{u.name}</p>
                     <p className="text-sm text-gray-500">@{u.username}</p>
                   </div>
                 </div>
                 <button 
                  onClick={() => onSelectUser(u)} 
                  className="text-brand-600 font-semibold text-sm bg-brand-50 px-3 py-2 rounded-lg"
                 >
                   Ver Registros
                 </button>
              </div>
            </Card>
          ))
        )}
      </div>
      
      <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="font-bold text-gray-700 mb-4">Exportação Global</h3>
          <Button variant="secondary" className="w-full justify-center" onClick={() => {
             const all = StorageService.getAllRecords();
             const csv = StorageService.exportToCSV(all);
             const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
             const url = URL.createObjectURL(blob);
             const link = document.createElement('a');
             link.href = url;
             link.setAttribute('download', `relatorio_geral_admin.csv`);
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
          }}>
             <DownloadIcon className="w-5 h-5"/> Exportar Tudo (CSV)
          </Button>
      </div>
    </div>
  );
}

// 5. MAIN APP CONTAINER
function AppContent() {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [view, setView] = useState<'DASHBOARD' | 'NEW_RECORD' | 'HISTORY' | 'ADMIN_USER_VIEW'>('DASHBOARD');
  
  const [myRecords, setMyRecords] = useState<WorkRecord[]>([]);
  const [adminSelectedUser, setAdminSelectedUser] = useState<User | null>(null);

  const [currentMonthStats, setCurrentMonthStats] = useState({ total: 0, average: 0 });

  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
       let recordsToUse: WorkRecord[] = [];
       if (auth.user.role === UserRole.ADMIN && adminSelectedUser && view === 'ADMIN_USER_VIEW') {
         recordsToUse = StorageService.getRecordsByUser(adminSelectedUser.id);
         setMyRecords(recordsToUse);
       } else if (auth.user.role === UserRole.USER) {
         recordsToUse = StorageService.getRecordsByUser(auth.user.id);
         setMyRecords(recordsToUse);
       }

       if (auth.user.role === UserRole.USER) {
         const now = new Date();
         const monthKey = now.toISOString().slice(0, 7); 
         
         const monthRecords = recordsToUse.filter(r => r.date.startsWith(monthKey));
         const total = monthRecords.reduce((acc, r) => acc + r.calculatedValue, 0);
         
         const uniqueDays = new Set(monthRecords.map(r => r.date)).size;
         const average = uniqueDays > 0 ? total / uniqueDays : 0;

         setCurrentMonthStats({ total, average });
       }
    }
  }, [auth, view, adminSelectedUser]);

  const handleLogin = (user: User) => {
    setAuth({ user, isAuthenticated: true });
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false });
    setView('DASHBOARD');
    setAdminSelectedUser(null);
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm("Tem certeza que deseja apagar este registro?")) {
      StorageService.deleteRecord(id);
      const updated = myRecords.filter(r => r.id !== id);
      setMyRecords(updated);
      
      const now = new Date();
      const monthKey = now.toISOString().slice(0, 7);
      const monthRecords = updated.filter(r => r.date.startsWith(monthKey));
      const total = monthRecords.reduce((acc, r) => acc + r.calculatedValue, 0);
      const uniqueDays = new Set(monthRecords.map(r => r.date)).size;
      const average = uniqueDays > 0 ? total / uniqueDays : 0;
      setCurrentMonthStats({ total, average });
    }
  };

  if (!auth.isAuthenticated || !auth.user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (auth.user.role === UserRole.ADMIN) {
    if (view === 'ADMIN_USER_VIEW' && adminSelectedUser) {
      return (
        <HistoryScreen 
          user={adminSelectedUser}
          records={myRecords}
          onDelete={handleDeleteRecord}
          onBack={() => {
            setAdminSelectedUser(null);
            setView('DASHBOARD');
          }}
          isAdmin={true}
        />
      );
    }
    return <AdminDashboard onLogout={handleLogout} onSelectUser={(u) => { setAdminSelectedUser(u); setView('ADMIN_USER_VIEW'); }} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      
      {view !== 'NEW_RECORD' && (
        <header className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
          <div>
             <h1 className="text-xl font-extrabold text-brand-600 tracking-tight">PayLoad</h1>
             <p className="text-xs text-gray-400">Olá, {auth.user.name.split(' ')[0]}</p>
          </div>
          <button onClick={handleLogout} className="p-2 bg-gray-50 rounded-full text-gray-500">
            <LogoutIcon className="w-5 h-5" />
          </button>
        </header>
      )}

      <main>
        {view === 'DASHBOARD' && (
           <div className="p-6 flex flex-col gap-4 mt-2">
              
              <Card className="bg-gradient-to-br from-brand-600 to-brand-900 text-white border-none shadow-brand-500/20 shadow-xl mb-4">
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-brand-100 text-sm font-medium mb-1">Ganhos em {new Date().toLocaleString('pt-BR', { month: 'long' })}</p>
                    <h2 className="text-4xl font-bold">{formatCurrency(currentMonthStats.total)}</h2>
                  </div>
                  <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                    <div className="bg-white/20 p-1.5 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                        <path fillRule="evenodd" d="M1 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Zm12 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm13-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM1.75 14.5a.75.75 0 0 0 0 1.5c4.417 0 8.693.603 12.749 1.73 1.111.309 2.251-.512 2.251-1.696v-.784a.75.75 0 0 0-1.5 0v.784a.272.272 0 0 1-.35.25A49.043 49.043 0 0 0 1.75 14.5Z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-brand-50">Média Diária: {formatCurrency(currentMonthStats.average)}</span>
                  </div>
                </div>
              </Card>

              <button 
                onClick={() => setView('NEW_RECORD')}
                className="bg-white text-brand-600 h-32 rounded-2xl border-2 border-brand-50 shadow-sm flex flex-col items-center justify-center gap-3 active:scale-95 transition-all hover:bg-brand-50"
              >
                <div className="bg-brand-100 p-3 rounded-full">
                  <PlusIcon className="w-6 h-6" />
                </div>
                <span className="text-lg font-bold">Novo Registro</span>
              </button>

              <button 
                onClick={() => setView('HISTORY')}
                className="bg-gray-50 text-gray-600 h-20 rounded-2xl border border-gray-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <HistoryIcon className="w-5 h-5 text-gray-500" />
                <span className="text-base font-semibold">Ver Histórico</span>
              </button>
           </div>
        )}

        {view === 'NEW_RECORD' && (
          <NewRecordScreen 
            user={auth.user} 
            onCancel={() => setView('DASHBOARD')} 
            onSave={() => setView('HISTORY')} 
          />
        )}

        {view === 'HISTORY' && (
          <HistoryScreen 
            user={auth.user} 
            records={myRecords} 
            onDelete={handleDeleteRecord} 
            onBack={() => setView('DASHBOARD')}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
import { useEffect, useState } from 'react';
import logo from '../assets/logo.png';
import logo2 from '../assets/logo2.png';

const SplashScreen = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Manomboka ny animation rehefa load ny component
    setVisible(true);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center bg-slate-50 transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex flex-col items-center p-5 animate-pulse">
        {/* Logo lehibe */}
        <img src={logo} className="w-40 h-40 object-contain" alt="Logo" />
        
        {/* Titre sy Version */}
        <h1 className="text-2xl font-black text-slate-900 mt-4 tracking-tighter uppercase">AMM CONNECT WEB ERP</h1>
        <p className="text-xs text-slate-500 mt-2 font-semibold">Dika Solosaina 2026 • Laharana faha-3 Pro</p>
        
        {/* Spinner (Activity Indicator) */}
        <div className="my-8 w-10 h-10 border-4 border-indigo-900 border-t-transparent rounded-full animate-spin"></div>
        
        {/* Logo kely */}
        <img src={logo2} className="w-12 h-12 object-contain mt-2" alt="Logo" />
      </div>
    </div>
  );
};

export default SplashScreen;
const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/pages/Home.jsx');
let content = fs.readFileSync(targetPath, 'utf-8');

const importTarget = "import { ChevronLeft, ChevronRight, Play, Plus, Eye, Star, CheckCircle } from 'lucide-react';";
const importReplacement = "import { ChevronLeft, ChevronRight, Play, Plus, Eye, Star, CheckCircle, Zap, Calendar, BarChart2, LineChart, ChevronRight as ChevronRightIcon } from 'lucide-react';";

content = content.replace(importTarget, importReplacement);

const startIndex = content.indexOf('// ── Gaming Store Style Hero Carousel with Cut-out Character Effect ──');
const endIndex = content.indexOf('// ── 3D Movies Section (Premium Scattered Grid) ──');

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find start or end index");
  process.exit(1);
}

const newHero = `// ── CAKRABOLA Style Static Hero Banner ──
function HeroBanner() {
  const navigate = useNavigate();
  
  return (
    <div className="relative w-full mb-12 md:mb-16 pt-16 sm:pt-20 select-none bg-[#0a0f16]">
      <div className="max-w-[1400px] mx-auto relative min-h-[500px] md:min-h-[600px] flex flex-col justify-between overflow-hidden">
        
        {/* Background Visuals */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Default dark stadium background or generic sports background */}
          <img src="https://images.unsplash.com/photo-1518605368461-1e1e11400810?q=80&w=2070&auto=format&fit=crop" alt="Stadium" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f16] via-[#0a0f16]/90 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-transparent to-transparent z-10" />
          {/* Golden Glows */}
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-yellow-600/30 blur-[120px] rounded-full mix-blend-screen z-10" />
          <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-yellow-500/20 blur-[100px] rounded-full mix-blend-screen z-10" />
        </div>

        {/* Players / Visual Placeholder */}
        <div className="absolute right-[-5%] bottom-0 h-[110%] w-[60%] z-20 pointer-events-none hidden lg:block">
           <img 
             src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000&auto=format&fit=crop" 
             className="w-full h-full object-cover object-left opacity-40 mix-blend-screen" 
             alt="Players placeholder" 
             style={{ WebkitMaskImage: 'linear-gradient(to left, black 50%, transparent 100%)' }} 
           />
        </div>

        {/* Main Content */}
        <div className="relative z-30 flex-1 flex flex-col justify-center px-4 sm:px-8 md:px-12 pt-12 md:pt-20 pb-10">
          <p className="text-gray-300 tracking-[0.2em] uppercase text-[10px] md:text-xs font-bold mb-3 md:mb-5 drop-shadow-md">
            Sumber Informasi Sepak Bola Terpercaya
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[80px] font-black italic text-white leading-[1] mb-1 md:mb-2 uppercase tracking-tighter drop-shadow-2xl">
            Semua Tentang
          </h1>
          <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-[100px] font-black italic text-yellow-500 leading-[0.9] mb-6 md:mb-8 uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">
            Sepak Bola
          </h1>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-300 text-xs sm:text-sm font-medium mb-8 md:mb-12">
            <span>Berita Terbaru</span>
            <span className="text-yellow-500">•</span>
            <span>Jadwal Lengkap</span>
            <span className="text-yellow-500 hidden sm:inline">•</span>
            <span className="hidden sm:inline">Analisis Mendalam</span>
          </div>

          <button onClick={() => navigate('/sports')} className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-300 hover:via-yellow-400 hover:to-yellow-500 text-black font-black uppercase tracking-widest text-xs sm:text-sm px-6 sm:px-8 py-3 sm:py-4 rounded-full w-fit flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(234,179,8,0.4)]">
            Jelajahi Sekarang <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5 font-black" />
          </button>
        </div>

        {/* Bottom Info Cards */}
        <div className="relative z-30 w-full px-4 sm:px-8 md:px-12 pb-6 md:pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 border-t border-white/10 pt-6 md:pt-8">
            {[
              { icon: Zap, title: 'BERITA TERKINI', desc: 'Update tercepat seputar dunia sepak bola' },
              { icon: Calendar, title: 'JADWAL LENGKAP', desc: 'Jadwal pertandingan dari berbagai liga' },
              { icon: BarChart2, title: 'KLASEMEN', desc: 'Pantau posisi tim favoritmu di klasemen terbaru' },
              { icon: LineChart, title: 'ANALISIS', desc: 'Analisis mendalam, statistik, dan opini ahli' }
            ].map((item, i) => (
              <div key={i} className="flex gap-3 sm:gap-4 items-start p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-yellow-500/30 transition-all duration-300 group cursor-pointer backdrop-blur-sm hover:bg-white/[0.04]">
                <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <h3 className="text-white font-bold text-xs sm:text-sm mb-1 uppercase">{item.title}</h3>
                  <p className="text-gray-400 text-[10px] sm:text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-6 md:mt-8 text-[8px] sm:text-[10px] text-gray-500 tracking-[0.2em] sm:tracking-[0.3em] font-bold uppercase">
            Cakrabola - Pasion for Football <span className="inline-block ml-1 sm:ml-2 align-middle border border-gray-600 rounded-full w-3 h-3 sm:w-4 sm:h-4 text-center leading-none text-[8px] sm:text-[10px] flex items-center justify-center">⚽</span>
          </div>
        </div>

      </div>
    </div>
  );
}

`;

const finalContent = content.substring(0, startIndex) + newHero + content.substring(endIndex);
fs.writeFileSync(targetPath, finalContent);
console.log("Replaced successfully");

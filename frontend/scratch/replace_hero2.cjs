const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/pages/Home.jsx');
let content = fs.readFileSync(targetPath, 'utf-8');

const startIndex = content.indexOf('// ── CAKRABOLA Style Static Hero Banner ──');
const endIndex = content.indexOf('// ── 3D Movies Section (Premium Scattered Grid) ──');

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find start or end index");
  process.exit(1);
}

const newHero = `// ── CAKRABOLA Style Static Hero Banner ──
function HeroBanner({ videos }) {
  const navigate = useNavigate();
  
  if (!videos || !videos.length) return null;

  return (
    <div className="relative w-full mb-12 md:mb-16 pt-16 sm:pt-20 select-none bg-[#0a0f16]">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        pagination={{ clickable: true, el: '.hero-pagination' }}
        navigation={{
          prevEl: '.hero-prev',
          nextEl: '.hero-next',
        }}
        autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        className="max-w-[1400px] mx-auto w-full"
      >
        {videos.map((video) => (
          <SwiperSlide key={video.id}>
            <div className="relative w-full h-[350px] md:h-[420px] flex flex-col justify-between overflow-hidden cursor-pointer" onClick={() => navigate('/watch/' + video.id)}>
              
              {/* Background Visuals */}
              <div className="absolute inset-0 pointer-events-none">
                <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover opacity-20 blur-sm" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f16] via-[#0a0f16]/90 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-transparent to-transparent z-10" />
                {/* Golden Glows */}
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-yellow-600/30 blur-[100px] rounded-full mix-blend-screen z-10" />
                <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-yellow-500/20 blur-[100px] rounded-full mix-blend-screen z-10" />
              </div>

              {/* Players / Visual Placeholder */}
              <div className="absolute right-0 bottom-0 h-full w-[60%] z-20 pointer-events-none hidden md:block">
                 <img 
                   src={video.thumbnail_url} 
                   className="w-full h-[110%] object-contain object-right-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] mix-blend-normal opacity-90" 
                   alt={video.title} 
                   style={{ WebkitMaskImage: 'linear-gradient(to left, black 60%, transparent 100%)' }} 
                 />
              </div>

              {/* Main Content */}
              <div className="relative z-30 flex-1 flex flex-col justify-center px-6 sm:px-10 md:px-16 pt-8 pb-8 w-full md:w-2/3">
                <p className="text-gray-300 tracking-[0.2em] uppercase text-[10px] md:text-xs font-bold mb-2 md:mb-4 drop-shadow-md">
                  {video.category || 'Premium Video'} • MacFeed Exclusive
                </p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black italic text-white leading-[1.1] mb-1 uppercase tracking-tighter drop-shadow-2xl line-clamp-2">
                  {video.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-300 text-xs sm:text-sm font-medium mb-6 md:mb-10 mt-2">
                  <span>{formatViews(video.views)} Views</span>
                  <span className="text-yellow-500">•</span>
                  <span>{video.duration || 'Full HD'}</span>
                  <span className="text-yellow-500 hidden sm:inline">•</span>
                  <span className="hidden sm:inline">Rating: {(Math.random() * 1 + 9.0).toFixed(1)}/10</span>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/watch/' + video.id); }} 
                  className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-300 hover:via-yellow-400 hover:to-yellow-500 text-black font-black uppercase tracking-widest text-xs sm:text-sm px-6 sm:px-8 py-3 rounded-full w-fit flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(234,179,8,0.4)]"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 font-black fill-black" /> Tonton Sekarang
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
        
        {/* Navigation Controls Overlay */}
        <div className="absolute bottom-6 right-8 z-40 hidden md:flex items-center gap-3">
          <button className="hero-prev w-10 h-10 rounded-full bg-white/5 hover:bg-yellow-500/20 border border-white/20 hover:border-yellow-500 text-white flex items-center justify-center backdrop-blur-md transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="hero-pagination flex items-center gap-2"></div>
          <button className="hero-next w-10 h-10 rounded-full bg-white/5 hover:bg-yellow-500/20 border border-white/20 hover:border-yellow-500 text-white flex items-center justify-center backdrop-blur-md transition-all">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </Swiper>

      {/* Bottom Info Cards (Static outside the slider) */}
      <div className="relative z-30 max-w-[1400px] mx-auto w-full px-4 sm:px-8 md:px-12 mt-4 md:mt-6 pb-6 md:pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 border-t border-white/10 pt-6">
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
        
        <div className="text-center mt-6 text-[8px] sm:text-[10px] text-gray-500 tracking-[0.2em] sm:tracking-[0.3em] font-bold uppercase">
          Cakrabola - Pasion for Football <span className="inline-block ml-1 sm:ml-2 align-middle border border-gray-600 rounded-full w-3 h-3 sm:w-4 sm:h-4 text-center leading-none text-[8px] sm:text-[10px] flex items-center justify-center">⚽</span>
        </div>
      </div>
      
      {/* Custom Styles for Pagination */}
      <style>{\`
        .hero-pagination .swiper-pagination-bullet {
          width: 8px !important;
          height: 8px !important;
          background: rgba(255, 255, 255, 0.3) !important;
          opacity: 1 !important;
          border-radius: 50% !important;
          transition: all 0.3s ease !important;
          margin: 0 4px !important;
        }
        .hero-pagination .swiper-pagination-bullet-active {
          background: #eab308 !important; /* yellow-500 */
          width: 24px !important;
          border-radius: 4px !important;
          box-shadow: 0 0 10px rgba(234, 179, 8, 0.5) !important;
        }
      \`}</style>
    </div>
  );
}
`;

const finalContent = content.substring(0, startIndex) + newHero + content.substring(endIndex);
fs.writeFileSync(targetPath, finalContent);
console.log('Replaced successfully');

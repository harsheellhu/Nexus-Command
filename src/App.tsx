import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, ZoomControl, useMapEvents } from 'react-leaflet';
import { AlertTriangle, Radio, MessageSquare, Map as MapIcon, Activity, ArrowRight, Clock, ShieldAlert, Send, CheckCircle2, Navigation, Flame, Download, Mic, MicOff, Sun, Moon, CloudRain, CloudFog, Volume2, VolumeX } from 'lucide-react';
import { generateIncidentRecommendations, chatWithCopilot } from './services/gemini';
import { generateMassiveDataset, TrafficEvent, IMPACT_LINES } from './utils/mockData';
import RoutingMachine from './components/RoutingMachine';
import AboutUs from './components/AboutUs';
import L from 'leaflet';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const pulsingIcon = L.divIcon({
  className: 'pulsing-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const MAP_CENTER: [number, number] = [23.1885, 72.6285]; // Kudasan Crossroad

const CAMERA_FEEDS = [
  { id: 1, name: 'Kudasan Crossroad', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400&h=250' },
  { id: 2, name: 'Sargasan Crossroad', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=400&h=250' },
  { id: 3, name: 'GIFT City Gate', url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=400&h=250' },
  { id: 4, name: 'PDEU Road', url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=400&h=250' },
];

const MOCK_LOCATIONS = [
  { name: 'Kudasan Crossroad', coords: [23.1885, 72.6285] },
  { name: 'Sargasan Crossroad', coords: [23.1855, 72.6085] },
  { name: 'GIFT City', coords: [23.1610, 72.6840] },
  { name: 'PDEU Road', coords: [23.1670, 72.6360] },
  { name: 'Infocity', coords: [23.1930, 72.6460] },
  { name: 'Sector 11', coords: [23.2140, 72.6500] },
  { name: 'Pathika Ashram (ST Stand)', coords: [23.2180, 72.6540] },
  { name: 'Vidhan Sabha', coords: [23.2155, 72.6640] },
  { name: 'GH-5 Circle', coords: [23.2185, 72.6631] },
  { name: 'CH-3 Circle', coords: [23.2135, 72.6450] },
  { name: 'Sector 1', coords: [23.2382, 72.6394] },
  { name: 'Sector 21 Market', coords: [23.2307, 72.6534] },
  { name: 'Sector 30', coords: [23.2505, 72.6713] },
  { name: 'Pethapur Crossroads', coords: [23.2685, 72.6520] },
  { name: 'Randesan', coords: [23.1765, 72.6330] },
  { name: 'Bhaijipura Crossroad', coords: [23.1812, 72.6541] }
];

const MOCK_RECOMMENDATIONS_DATA = {
  summary: "Major collision detected at Kudasan Crossroad.",
  diversionRoutes: [
    { 
      routeName: "Service Road Detour via Urjanagar", 
      activationSequence: "Immediate", 
      estimatedRedistribution: "High Load", 
      coordinates: [[23.1885, 72.6285], [23.1985, 72.6285], [23.1985, 72.6385]] 
    }
  ],
  signalRetiming: [
    { 
      intersection: "Kudasan Crossroad", 
      currentPhase: "Phase 1 (N-S)", 
      recommendedPhase: "Phase 3 (E-W)", 
      reason: "Clear congested lanes on connecting arterial." 
    }
  ],
  publicAlerts: {
    vms: "COLLISION AHEAD - USE SERVICE ROAD",
    socialMedia: "Traffic Alert: Major collision at Kudasan Crossroad. Emergency teams on site. Please use Urjanagar service road as a detour. #TrafficAlert"
  }
};

function MapClickHandler({ isActive, onMapClick }: { isActive: boolean, onMapClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      if (isActive) {
        onMapClick(e.latlng);
      }
    }
  });
  return null;
}

export default function App() {
  const ALL_DATA = useMemo(() => generateMassiveDataset(), []);
  const [events, setEvents] = useState<TrafficEvent[]>(ALL_DATA.slice(0, 16350));
  const [streamIndex, setStreamIndex] = useState(16350);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState<[number, number][] | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const [manualEventInput, setManualEventInput] = useState('');
  type UserRole = 'admin' | 'responder' | 'public';
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [weather, setWeather] = useState<string>('Clear');
  const [isListening, setIsListening] = useState(false);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(false);
  const [showGlobalTraffic, setShowGlobalTraffic] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [navSource, setNavSource] = useState('');
  const [navDest, setNavDest] = useState('');
  const [publicRoutingCoords, setPublicRoutingCoords] = useState<{source: [number,number], dest: [number,number]} | null>(null);
  const [isReportingMode, setIsReportingMode] = useState(false);
  const [isMockIntelligence, setIsMockIntelligence] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [isDarkMode]);
  
  const feedEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const recognition = useMemo(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      return rec;
    }
    return null;
  }, []);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(prev => prev ? prev + ' ' + transcript : transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      showToast("Microphone error or access denied.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }, [recognition]);

  const toggleListening = () => {
    if (!recognition) {
      showToast("Voice commands are not supported in your browser.");
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
        showToast("Listening...");
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    if (isStreamPaused) return;
    
    const interval = setInterval(() => {
      setStreamIndex(prev => {
        if (prev < ALL_DATA.length) {
          const nextEvent = ALL_DATA[prev];
          setEvents(currentEvents => [...currentEvents, nextEvent]);
          
          if (nextEvent.isCritical) {
            const criticalCount = ALL_DATA.slice(0, prev + 1).filter(e => e.isCritical).length;
            if (criticalCount === 3) {
              fetchRecommendations(ALL_DATA.slice(0, prev + 1));
            }
          }
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 250); // 4 events per second

    return () => clearInterval(interval);
  }, [ALL_DATA, isStreamPaused]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events.length]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleInjectEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEventInput.trim()) return;
    
    const newEvent: TrafficEvent = {
      time: new Date().toTimeString().split(' ')[0],
      source: 'Operator (Manual)',
      message: manualEventInput.trim(),
      impact: 0,
      isCritical: true
    };
    
    setEvents(prev => [...prev, newEvent]);
    setManualEventInput('');
    showToast('Manual event injected into feed');
  };

  const fetchRecommendations = async (currentEvents: TrafficEvent[]) => {
    setLoadingRecs(true);
    const criticalEvents = currentEvents.filter(e => e.isCritical);
    const context = criticalEvents.map(e => `[${e.time}] ${e.source}: ${e.message}`).join('\n');
    const recs = await generateIncidentRecommendations(context, weather);
    if (recs) {
      setRecommendations(recs);
    }
    setLoadingRecs(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    const criticalEvents = events.filter(e => e.isCritical);
    const context = criticalEvents.map(e => `[${e.time}] ${e.source}: ${e.message}`).join('\n');
    const response = await chatWithCopilot(context, userMsg, chatHistory, weather);
    
    setChatHistory(prev => [...prev, { role: 'assistant', text: response || 'Error processing request.' }]);
    setChatLoading(false);

    // Voice Output
    if (isVoiceOutputEnabled && response && window.speechSynthesis) {
      // Cancel any ongoing speech before starting a new one
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.lang = 'en-US';
      // Adjust speaking rate to be slightly faster for emergency situations
      utterance.rate = 1.1; 
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleExportReport = () => {
    if (!recommendations) {
      showToast("No intelligence report available to export yet.");
      return;
    }
    const reportText = `--- INCIDENT COMMAND INTELLIGENCE REPORT ---
Date: ${new Date().toLocaleDateString()}
Status: Active Critical Incident

RECOMMENDED DIVERSIONS:
${recommendations.diversionRoutes?.map((r: any) => `- ${r.routeName}: ${r.estimatedRedistribution}`).join('\n') || 'None'}

SIGNAL RETIMING:
${recommendations.signalRetiming?.map((r: any) => `- ${r.intersection}: Phase ${r.recommendedPhase} (${r.reason})`).join('\n') || 'None'}

PUBLIC ALERTS:
VMS: ${recommendations.publicAlerts?.vms || 'N/A'}
Social Media: ${recommendations.publicAlerts?.socialMedia || 'N/A'}

--- END OF REPORT ---`;
    
    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Incident_Report_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Report exported successfully");
  };

  const handlePlotRoute = async (coordinates: [number, number][], routeName: string) => {
    if (!coordinates || coordinates.length < 2) return;
    
    showToast(`Calculating road geometry for ${routeName}...`);
    
    try {
      const coordsString = coordinates.map(c => `${c[1]},${c[0]}`).join(';');
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`);
      const data = await res.json();
      
      if (data.routes && data.routes[0]) {
        const geometry = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        setActiveRoute(geometry);
        showToast(`Plotted road-aligned route: ${routeName}`);
      } else {
        setActiveRoute(coordinates);
        showToast(`Could not find exact road path. Plotted approximations.`);
      }
    } catch (e) {
      console.error(e);
      setActiveRoute(coordinates);
      showToast(`Routing service unavailable. Plotted approximation.`);
    }
  };

  const currentImpactLevel = events.length > 0 ? Math.max(...events.filter(e => e.isCritical).map(e => e.impact), 0) : 0;
  const visibleImpactLines = IMPACT_LINES.slice(0, currentImpactLevel);

  if (showAboutUs) {
    return <AboutUs onBack={() => setShowAboutUs(false)} isDarkMode={isDarkMode} />;
  }

  if (userRole === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-zinc-100 font-sans p-4 relative overflow-hidden">
        {/* Abstract background graphics */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="z-10 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-8 w-full max-w-md animate-in fade-in slide-in-from-bottom-8">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl shadow-inner border border-indigo-500/30">
              <ShieldAlert size={40} />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">Nexus Command</h1>
              <p className="text-sm text-zinc-500 mt-1">Traffic Incident Co-Pilot</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => setUserRole('admin')}
              className="w-full text-left p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800 hover:border-indigo-500/50 transition-all group flex flex-col gap-1 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="font-semibold text-zinc-200 flex items-center gap-2">
                <ShieldAlert size={16} className="text-indigo-400" /> Command Center Admin
              </div>
              <div className="text-xs text-zinc-500">Full access to incident feed, camera streams, and AI Co-Pilot controls.</div>
            </button>
            
            <button 
              onClick={() => setUserRole('responder')}
              className="w-full text-left p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800 hover:border-emerald-500/50 transition-all group flex flex-col gap-1 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="font-semibold text-zinc-200 flex items-center gap-2">
                <Activity size={16} className="text-emerald-400" /> Field Responder
              </div>
              <div className="text-xs text-zinc-500">Access to critical alerts, routing directions, and live map logic.</div>
            </button>
            
            <button 
              onClick={() => setUserRole('public')}
              className="w-full text-left p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800 hover:border-blue-500/50 transition-all group flex flex-col gap-1 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="font-semibold text-zinc-200 flex items-center gap-2">
                <Navigation size={16} className="text-blue-400" /> Public User
              </div>
              <div className="text-xs text-zinc-500">View-only mode for global traffic maps and confirmed public alerts.</div>
            </button>
          </div>

          {/* About Us Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAboutUs(true)}
              className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors underline underline-offset-4 decoration-zinc-700 hover:decoration-indigo-500/50"
            >
              About Us
            </button>
          </div>
        </div>
        
        {/* Toggle dark mode purely for looks on login */}
        <div className="absolute top-4 right-4 bg-zinc-900 border border-zinc-800 rounded-lg p-1 flex shadow-lg">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="px-3 py-1.5 text-xs rounded-md transition-colors flex items-center justify-center text-zinc-400 hover:text-zinc-200"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden relative">
      {/* Mode Toggle & Weather */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
        {/* Report Incident Toggle (Admin Only) */}
        {userRole === 'admin' && (
          <div className={`border rounded-lg p-1 flex shadow-lg transition-colors cursor-pointer ${isReportingMode ? 'bg-red-600 border-red-500' : 'bg-zinc-900 border-zinc-800'}`}>
            <button 
              onClick={() => setIsReportingMode(!isReportingMode)}
              className={`p-2 rounded-md transition-colors ${isReportingMode ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              title="Click on map to report incident"
            >
              <ShieldAlert size={20} />
            </button>
          </div>
        )}

        {/* Theme Toggle */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 flex shadow-lg">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="px-3 py-1.5 text-xs rounded-md transition-colors flex items-center justify-center text-zinc-400 hover:text-zinc-200"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {/* Weather Selector */}
        {userRole === 'admin' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 flex shadow-lg">
            {(['Clear', 'Heavy Rain', 'Dense Fog'] as const).map(w => (
              <button
                key={w}
                onClick={() => setWeather(w)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1.5 ${weather === w ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                title={`Set Weather: ${w}`}
              >
                {w === 'Clear' && <Sun size={14} />}
                {w === 'Heavy Rain' && <CloudRain size={14} />}
                {w === 'Dense Fog' && <CloudFog size={14} />}
                <span className="hidden sm:inline">{w}</span>
              </button>
            ))}
          </div>
        )}

        {/* Logout */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 flex shadow-lg">
          <button 
            onClick={() => setUserRole(null)}
            className="px-4 py-1.5 text-sm rounded-md transition-colors text-zinc-400 hover:text-zinc-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={16} />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Left Panel: Incident Feed (Admin Only) */}
      {userRole === 'admin' && (
        <div className="w-80 shrink-0 border-r border-zinc-800 flex flex-col bg-zinc-900/50 backdrop-blur-sm z-10">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <div className="p-2 bg-red-500/20 text-red-500 rounded-lg">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="font-semibold text-zinc-100">Incident Command</h1>
            <p className="text-xs text-zinc-400">Active Incident: INC-2026-0321</p>
          </div>
        </div>

        {events.some(e => e.isCritical) && (
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Deployed Resources</h3>
            <div className="space-y-2">
              {[
                { id: 'P-04', type: 'Police', status: 'On Scene', eta: '0m', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
                { id: 'E-12', type: 'EMS', status: 'En Route', eta: '2m', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
                { id: 'F-09', type: 'Fire', status: 'En Route', eta: '4m', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' }
              ].map((unit, idx) => (
                <div key={idx} className={`flex items-center justify-between p-2 rounded-md border ${unit.bg} ${unit.border}`}>
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${unit.bg} ${unit.color}`}>
                      {unit.type === 'Police' ? <ShieldAlert size={12} /> : unit.type === 'Fire' ? <Flame size={12} /> : <Activity size={12} />}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-zinc-200">{unit.type} {unit.id}</div>
                      <div className="text-[10px] text-zinc-500">{unit.status}</div>
                    </div>
                  </div>
                  <div className={`text-xs font-mono font-medium ${unit.status === 'On Scene' ? 'text-zinc-500' : unit.color}`}>
                    {unit.eta}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Live Feed</h2>
            <div className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded border border-indigo-500/30 flex items-center gap-1">
              <Activity size={10} className="animate-pulse" />
              {events.length.toLocaleString()} Events Processed
            </div>
          </div>
          {events.slice(-100).map((event, idx) => (
            <div key={idx} className={`rounded-lg p-2 border ${event.isCritical ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-800/30 border-zinc-700/30'} animate-in fade-in slide-in-from-left-2`}>
              <div className="flex justify-between items-start mb-1">
                <span className={`text-[10px] font-mono ${event.isCritical ? 'text-red-400' : 'text-zinc-500'}`}>{event.time}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${event.isCritical ? 'bg-red-500/20 text-red-300' : 'bg-zinc-800 text-zinc-400'}`}>{event.source}</span>
              </div>
              <p className={`text-xs ${event.isCritical ? 'text-red-100 font-medium' : 'text-zinc-400'}`}>{event.message}</p>
            </div>
          ))}
          <div ref={feedEndRef} />
        </div>

        {/* Operator Controls */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Operator Controls</h3>
          <div className="flex gap-2 mb-3">
            <button 
              onClick={() => setIsStreamPaused(!isStreamPaused)}
              className={`flex-1 py-1.5 text-xs rounded border ${isStreamPaused ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'} transition-colors`}
            >
              {isStreamPaused ? '▶ Resume Feed' : '⏸ Pause Feed'}
            </button>
          </div>
          <form onSubmit={handleInjectEvent} className="flex gap-2">
            <input 
              type="text" 
              value={manualEventInput}
              onChange={e => setManualEventInput(e.target.value)}
              placeholder="Enter manual log..." 
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
            <button type="submit" disabled={!manualEventInput.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded text-xs transition-colors">
              Inject
            </button>
          </form>
        </div>
        </div>
      )}

      {/* Center Panel: Map & Cameras */}
      <div className="flex-1 flex flex-col relative min-w-0">
        <div className="flex-1 relative">
          <MapContainer 
          center={MAP_CENTER} 
          zoom={13} 
          className="w-full h-full z-0"
          zoomControl={false}
        >
          <MapClickHandler 
            isActive={userRole === 'admin' && isReportingMode} 
            onMapClick={(latlng) => {
              const newEvent: TrafficEvent = {
                time: new Date().toTimeString().split(' ')[0],
                source: 'Operator (Manual)',
                message: `Critical incident reported at [${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}]`,
                impact: 5, // Assuming high impact for manually reported critical incident
                isCritical: true
              };
              setEvents(prev => [...prev, newEvent]);
              setIsReportingMode(false);
              showToast("Critical incident reported on map!");
            }} 
          />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={`https://{s}.basemaps.cartocdn.com/${isDarkMode ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`}
          />
          
          {/* Global Traffic Overlay (TomTom) */}
          {showGlobalTraffic && (
            <TileLayer
              url={`https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${(import.meta as any).env.VITE_TOMTOM_API_KEY || 'YOUR_KEY_HERE'}`}
              attribution="&copy; TomTom Traffic"
              opacity={0.8}
              maxZoom={22}
            />
          )}

          {/* Incident Marker */}
          {events.length > 1 && (
            <Marker position={MAP_CENTER} icon={pulsingIcon}>
              <Popup className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <div className="font-semibold text-red-500 mb-1">Major Collision</div>
                <div className="text-xs">Kudasan Crossroad</div>
                <div className="text-xs text-zinc-400 mt-1">Multiple vehicles, lanes blocked</div>
              </Popup>
            </Marker>
          )}

          {/* Dummy lines removed in favor of real traffic */}

          {/* Active Diversion Route (Admin/Responder) */}
          {activeRoute && (
            <Polyline 
              positions={activeRoute} 
              pathOptions={{ 
                color: '#3b82f6', 
                weight: 5, 
                dashArray: '10, 15', 
                opacity: 0.9,
                className: 'traffic-line-animated'
              }} 
            />
          )}

          {/* Turn-by-Turn Navigation (Public) */}
          {publicRoutingCoords && (
            <RoutingMachine source={publicRoutingCoords.source} destination={publicRoutingCoords.dest} />
          )}
        </MapContainer>

        {/* Floating Map Overlay (Admin & Responder) */}
        {userRole !== 'public' && (
          <div className="absolute top-4 left-4 z-[400] bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-lg p-3 shadow-xl">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <Activity size={16} className={events.length > 2 ? "text-red-500" : "text-emerald-500"} />
              System Status: {events.length > 2 ? "Critical Incident" : "Nominal"}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-2">
              <span className="text-xs text-zinc-400">Global Traffic</span>
              <button
                onClick={() => setShowGlobalTraffic(!showGlobalTraffic)}
                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${showGlobalTraffic ? 'bg-indigo-500' : 'bg-zinc-700'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showGlobalTraffic ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </div>
            {activeRoute && (
              <div className="mt-2 text-xs text-blue-400 flex items-center gap-1">
                <Navigation size={12} /> Diversion Route Active
              </div>
            )}
          </div>
        )}
        </div>

        {/* Camera Feeds (Admin Only) */}
        {userRole === 'admin' && (
          <div className="h-48 bg-zinc-950 border-t border-zinc-800 p-2 overflow-x-auto flex gap-2 shrink-0">
            {CAMERA_FEEDS.map(cam => (
              <div key={cam.id} className="min-w-[240px] h-full relative rounded-lg overflow-hidden border border-zinc-800 group">
                <img src={cam.url} alt={cam.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/80 to-transparent">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-medium text-white shadow-sm">{cam.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel: Co-Pilot (Admin Only) */}
      {userRole === 'admin' && (
        <div className="w-96 shrink-0 border-l border-zinc-800 flex flex-col bg-zinc-900/50 backdrop-blur-sm z-10">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="text-indigo-400" size={20} />
              <h2 className="font-semibold text-zinc-100">AI Co-Pilot</h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleExportReport}
                className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded transition-colors border border-zinc-700"
                title="Export Incident Report"
              >
                <Download size={14} /> Export
              </button>
            </div>
          </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Recommendations Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={14} /> Intelligence Brief
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] ${!isMockIntelligence ? 'text-indigo-400 font-bold' : 'text-zinc-500'}`}>LLM</span>
                <button
                  onClick={() => setIsMockIntelligence(!isMockIntelligence)}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${isMockIntelligence ? 'bg-amber-500' : 'bg-indigo-500'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isMockIntelligence ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
                <span className={`text-[10px] ${isMockIntelligence ? 'text-amber-400 font-bold' : 'text-zinc-500'}`}>Mock</span>
              </div>
            </div>
            
            {loadingRecs && !isMockIntelligence ? (
              <div className="bg-zinc-800/30 border border-zinc-800 rounded-lg p-4 flex items-center justify-center">
                <div className="animate-pulse flex items-center gap-2 text-indigo-400 text-sm">
                  <Activity size={16} className="animate-spin" /> Synthesizing data...
                </div>
              </div>
            ) : recommendations ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                {/* Signal Re-timing */}
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                    <Clock size={14} /> Signal Re-timing
                  </h4>
                  <div className="space-y-2">
                    {recommendations.signalRetiming?.map((rec: any, i: number) => (
                      <div key={i} className="text-xs bg-zinc-900/50 p-2 rounded border border-zinc-800">
                        <div className="font-medium text-zinc-200">{rec.intersection}</div>
                        <div className="flex items-center gap-2 mt-1 text-zinc-400">
                          <span className="line-through">{rec.currentPhase}</span>
                          <ArrowRight size={12} />
                          <span className="text-emerald-400">{rec.recommendedPhase}</span>
                        </div>
                        <div className="mt-1 text-zinc-500">{rec.reason}</div>
                        <button 
                          onClick={() => showToast(`Applied new timing to ${rec.intersection}`)}
                          className="mt-2 w-full py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 transition-colors text-[10px] flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 size={10} /> Apply Timing
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Diversion Routes */}
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                    <MapIcon size={14} /> Diversion Routes
                  </h4>
                  <div className="space-y-2">
                    {recommendations.diversionRoutes?.map((rec: any, i: number) => (
                      <div key={i} className="text-xs bg-zinc-900/50 p-3 rounded border border-zinc-800">
                        <div className="font-medium text-zinc-200">{rec.routeName}</div>
                        <div className="mt-1 text-zinc-400">Seq: {rec.activationSequence}</div>
                        <div className="mt-1 text-zinc-500 mb-2">Est. Load: {rec.estimatedRedistribution}</div>
                        {rec.coordinates && rec.coordinates.length > 0 && (
                          <button 
                            onClick={() => handlePlotRoute(rec.coordinates, rec.routeName)}
                            className="w-full py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 transition-colors flex items-center justify-center gap-2"
                          >
                            <Navigation size={12} /> Plot on Map
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Public Alerts */}
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-rose-400 mb-2 flex items-center gap-2">
                    <Radio size={14} /> Public Alerts
                  </h4>
                  <div className="space-y-2">
                    <div className="text-xs bg-zinc-900/50 p-2 rounded border border-zinc-800 relative group">
                      <span className="text-zinc-500 block mb-1">VMS Display:</span>
                      <span className="font-mono text-amber-500">{recommendations.publicAlerts?.vms}</span>
                      <button 
                        onClick={() => showToast("VMS Alert Published Successfully")}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-rose-500 text-white px-2 py-1 rounded text-[10px] transition-opacity"
                      >
                        Publish
                      </button>
                    </div>
                    <div className="text-xs bg-zinc-900/50 p-2 rounded border border-zinc-800 relative group">
                      <span className="text-zinc-500 block mb-1">Social Media:</span>
                      <span className="text-zinc-300">{recommendations.publicAlerts?.socialMedia}</span>
                      <button 
                        onClick={() => showToast("Social Media Alert Published")}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-rose-500 text-white px-2 py-1 rounded text-[10px] transition-opacity"
                      >
                        Publish
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : isMockIntelligence ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                {/* Mock Signal Re-timing */}
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                    <Clock size={14} /> Signal Re-timing
                  </h4>
                  <div className="space-y-2">
                    {MOCK_RECOMMENDATIONS_DATA.signalRetiming.map((rec: any, i: number) => (
                      <div key={i} className="text-xs bg-zinc-900/50 p-2 rounded border border-zinc-800">
                        <div className="font-medium text-zinc-200">{rec.intersection}</div>
                        <div className="flex items-center gap-2 mt-1 text-zinc-400">
                          <span className="line-through">{rec.currentPhase}</span>
                          <ArrowRight size={12} />
                          <span className="text-emerald-400">{rec.recommendedPhase}</span>
                        </div>
                        <div className="mt-1 text-zinc-500">{rec.reason}</div>
                        <button 
                          onClick={() => showToast(`Applied mock timing to ${rec.intersection}`)}
                          className="mt-2 w-full py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 transition-colors text-[10px] flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 size={10} /> Apply Timing
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mock Diversion Routes */}
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                    <MapIcon size={14} /> Diversion Routes
                  </h4>
                  <div className="space-y-2">
                    {MOCK_RECOMMENDATIONS_DATA.diversionRoutes.map((rec: any, i: number) => (
                      <div key={i} className="text-xs bg-zinc-900/50 p-3 rounded border border-zinc-800">
                        <div className="font-medium text-zinc-200">{rec.routeName}</div>
                        <div className="mt-1 text-zinc-400">Seq: {rec.activationSequence}</div>
                        <div className="mt-1 text-zinc-500 mb-2">Est. Load: {rec.estimatedRedistribution}</div>
                        {rec.coordinates && rec.coordinates.length > 0 && (
                          <button 
                            onClick={() => handlePlotRoute(rec.coordinates, rec.routeName)}
                            className="w-full py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 transition-colors flex items-center justify-center gap-2"
                          >
                            <Navigation size={12} /> Plot on Map
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mock Public Alerts */}
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-rose-400 mb-2 flex items-center gap-2">
                    <Radio size={14} /> Public Alerts
                  </h4>
                  <div className="space-y-2">
                    <div className="text-xs bg-zinc-900/50 p-2 rounded border border-zinc-800 relative group">
                      <span className="text-zinc-500 block mb-1">VMS Display:</span>
                      <span className="font-mono text-amber-500">{MOCK_RECOMMENDATIONS_DATA.publicAlerts.vms}</span>
                      <button 
                        onClick={() => showToast("Mock VMS Alert Published")}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-rose-500 text-white px-2 py-1 rounded text-[10px] transition-opacity"
                      >
                        Publish
                      </button>
                    </div>
                    <div className="text-xs bg-zinc-900/50 p-2 rounded border border-zinc-800 relative group">
                      <span className="text-zinc-500 block mb-1">Social Media:</span>
                      <span className="text-zinc-300">{MOCK_RECOMMENDATIONS_DATA.publicAlerts.socialMedia}</span>
                      <button 
                        onClick={() => showToast("Mock Social Media Alert Published")}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-rose-500 text-white px-2 py-1 rounded text-[10px] transition-opacity"
                      >
                        Publish
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 italic">
                Awaiting sufficient incident data to generate intelligence...
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div className="flex flex-col h-64 border border-zinc-800 rounded-lg bg-zinc-950 overflow-hidden shrink-0">
            <div className="bg-zinc-900 px-3 py-2 border-b border-zinc-800 text-xs font-medium text-zinc-400 flex items-center gap-2">
              <MessageSquare size={14} /> Command Chat
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatHistory.length === 0 && (
                <div className="text-xs text-zinc-600 text-center mt-4">
                  Ask questions about the incident, safety protocols, or request specific actions.
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 text-zinc-400 rounded-lg rounded-bl-none border border-zinc-700 px-3 py-2 text-sm flex items-center gap-2">
                    <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-2 border-t border-zinc-800 bg-zinc-900 flex gap-2">
              <div className="flex bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`px-2 py-1.5 transition-colors flex items-center justify-center border-r border-zinc-800 ${isListening ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                  title="Voice Command"
                >
                  {isListening ? <Mic className="animate-pulse" size={16} /> : <MicOff size={16} />}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsVoiceOutputEnabled(!isVoiceOutputEnabled);
                    if (isVoiceOutputEnabled) window.speechSynthesis.cancel();
                  }}
                  className={`px-2 py-1.5 transition-colors flex items-center justify-center ${isVoiceOutputEnabled ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400'}`}
                  title={isVoiceOutputEnabled ? "Disable Voice Output" : "Enable Voice Output"}
                >
                  {isVoiceOutputEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              </div>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Co-Pilot..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-1.5 rounded-md transition-colors flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
        </div>
      )}

      {/* User Mode Overlay */}
      {userRole === 'responder' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-zinc-200/50">
            <div className="bg-red-500 p-4 text-white flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-lg">Major Traffic Alert</h2>
                <p className="text-red-100 text-sm">Accident ahead at Kudasan Crossroad. Expect severe delays.</p>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-3">Recommended Action</h3>
              {recommendations?.diversionRoutes?.[0] ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-1">
                    <Navigation size={18} /> Take Alternate Route
                  </div>
                  <p className="text-emerald-600 text-sm mb-3">
                    {recommendations.diversionRoutes[0].routeName}
                  </p>
                  <button 
                    onClick={() => handlePlotRoute(recommendations.diversionRoutes[0].coordinates, recommendations.diversionRoutes[0].routeName)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <MapIcon size={18} /> Start Navigation
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-zinc-600 text-sm flex items-center justify-center gap-2">
                  <Activity size={16} className="animate-spin" /> Calculating optimal diversion route...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Public Advisory Panel */}
      {userRole === 'public' && (
        <div className="absolute top-20 right-4 bottom-4 w-96 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-y-auto z-[1000] flex flex-col transition-colors animate-in slide-in-from-right-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
              <Radio size={24} className="text-blue-500" />
              Public Advisory
            </h2>
          </div>

          <div className="space-y-6 flex-1">
            {/* Status Card */}
            <div className={`p-4 rounded-xl border ${events.length > 2 ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
              <div className="flex items-center gap-2 text-sm font-semibold mb-2 text-zinc-200">
                <Activity size={18} className={events.length > 2 ? 'text-red-500' : 'text-emerald-500'} />
                {events.length > 2 ? 'Critical Incident Active' : 'Normal Traffic Conditions'}
              </div>
              <p className="text-sm text-zinc-400">
                {events.length > 2 
                  ? 'A major collision has been reported near Kudasan Crossroad. Emergency services are on scene.' 
                  : 'All major routes are operating normally.'}
              </p>
            </div>

            {/* Route Planner */}
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Navigation size={14} /> Plan Your Route
              </h3>
              <div className="space-y-3">
                <select 
                  value={navSource}
                  onChange={e => setNavSource(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Starting Point...</option>
                  {MOCK_LOCATIONS.map(loc => <option key={loc.name} value={loc.name}>{loc.name}</option>)}
                </select>
                
                <select 
                  value={navDest}
                  onChange={e => setNavDest(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Destination...</option>
                  {MOCK_LOCATIONS.map(loc => <option key={loc.name} value={loc.name}>{loc.name}</option>)}
                </select>

                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={() => {
                      if (!navSource || !navDest) { showToast("Select source and destination"); return; }
                      const s = MOCK_LOCATIONS.find(l => l.name === navSource)?.coords;
                      const d = MOCK_LOCATIONS.find(l => l.name === navDest)?.coords;
                      if (s && d) setPublicRoutingCoords({ source: s as [number,number], dest: d as [number,number] });
                    }}
                    disabled={!navSource || !navDest}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md py-2 text-sm transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <MapIcon size={14} /> Navigate
                  </button>
                  {publicRoutingCoords && (
                    <button 
                      onClick={() => setPublicRoutingCoords(null)}
                      className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-sm transition-colors font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Global Traffic Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-950/50">
              <span className="text-sm text-zinc-300 flex items-center gap-2">
                <MapIcon size={16} className="text-zinc-500" /> Show Global Traffic
              </span>
              <button
                onClick={() => setShowGlobalTraffic(!showGlobalTraffic)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showGlobalTraffic ? 'bg-indigo-500' : 'bg-zinc-700'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showGlobalTraffic ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Recommendations & Advisories */}
            {recommendations && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2">
                  Official Advisories
                </h3>
                
                {recommendations.publicAlerts?.vms && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-amber-500 mb-1">Highway Sign Message</div>
                        <div className="font-mono text-sm text-amber-300/90 leading-relaxed bg-black/20 p-2 rounded border border-amber-500/20 mt-2">{recommendations.publicAlerts.vms}</div>
                      </div>
                    </div>
                  </div>
                )}

                {recommendations.diversionRoutes && recommendations.diversionRoutes.length > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <Navigation size={18} className="text-blue-500 mt-0.5 shrink-0" />
                      <div className="w-full">
                        <div className="text-xs font-semibold text-blue-400 mb-1">Recommended Detour</div>
                        <div className="text-sm font-medium text-blue-300">{recommendations.diversionRoutes[0].routeName}</div>
                        <button 
                          onClick={() => handlePlotRoute(recommendations.diversionRoutes[0].coordinates, recommendations.diversionRoutes[0].routeName)}
                          className="mt-4 w-full py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-300 rounded-md transition-colors shadow-sm flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <MapIcon size={16} /> View Detour on Map
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!recommendations && events.length > 2 && (
              <div className="flex items-center justify-center py-8 text-sm text-zinc-500 animate-pulse">
                <Activity size={16} className="animate-spin mr-2" /> Awaiting official advisory...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

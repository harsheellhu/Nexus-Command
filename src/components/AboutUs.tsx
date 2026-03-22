import React from 'react';
import { ShieldAlert, Activity, Navigation, MapPin, Cpu, Users, Zap, ArrowLeft, Github, Globe, Mail } from 'lucide-react';

interface AboutUsProps {
  onBack: () => void;
  isDarkMode: boolean;
}

const TEAM_MEMBERS = [
  {
    name: 'Harsheel Lhukanji',
    role: 'Lead Developer',
    avatar: 'HL',
    color: 'from-indigo-500 to-violet-600',
  },
  {
    name: 'Nexus AI Core',
    role: 'AI Intelligence Engine',
    avatar: 'AI',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Command Ops',
    role: 'Operations & Design',
    avatar: 'CO',
    color: 'from-amber-500 to-orange-600',
  },
];

const FEATURES = [
  {
    icon: Activity,
    title: 'Real-Time Incident Feed',
    description: 'Ingest and process thousands of live traffic events per second with intelligent critical-event detection.',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  {
    icon: Cpu,
    title: 'AI-Powered Co-Pilot',
    description: 'LLM-driven intelligence generates diversion routes, signal re-timing, and public alerts automatically.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  {
    icon: MapPin,
    title: 'Live Map & Routing',
    description: 'Interactive map with real-time traffic overlays, turn-by-turn navigation, and diversion route plotting.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    icon: Navigation,
    title: 'Multi-Role Access',
    description: 'Tailored interfaces for Command Center Admins, Field Responders, and Public Users.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: Zap,
    title: 'Voice Commands',
    description: 'Hands-free operation with speech recognition input and voice output for emergency situations.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    icon: Users,
    title: 'Resource Deployment',
    description: 'Track Police, EMS, and Fire units in real-time with deployment status and ETA visibility.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
];

const TECH_STACK = [
  { name: 'React 19', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { name: 'TypeScript', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { name: 'Vite', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  { name: 'Tailwind CSS v4', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  { name: 'Leaflet Maps', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { name: 'Gemini AI', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { name: 'OSRM Routing', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { name: 'TomTom Traffic', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

export default function AboutUs({ onBack, isDarkMode }: AboutUsProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans overflow-y-auto relative">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/6 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[80px]" />
      </div>

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/15 text-indigo-400 rounded-lg border border-indigo-500/20">
              <ShieldAlert size={20} />
            </div>
            <span className="font-semibold text-zinc-200 text-lg">Nexus Command</span>
          </div>

          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full px-4 py-1.5 text-xs font-medium mb-6">
            <Activity size={12} className="animate-pulse" />
            About the Project
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
              Intelligent Traffic
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
              Incident Command
            </span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-8">
            Nexus Command is an AI-powered traffic incident co-pilot that ingests live data feeds,
            synthesizes real-time intelligence, and empowers emergency responders with
            actionable insights — all in milliseconds.
          </p>

          <div className="flex items-center justify-center gap-6 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Active</span>
            </div>
            <div className="h-4 w-px bg-zinc-800" />
            <span>v1.0.0</span>
            <div className="h-4 w-px bg-zinc-800" />
            <span>Gandhinagar, India</span>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="relative z-10 py-16 px-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-zinc-100 mb-4">Our Mission</h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                Traffic incidents claim thousands of lives and cause billions in economic losses annually.
                Traditional incident management relies on manual coordination, delayed information, and
                fragmented communication.
              </p>
              <p className="text-zinc-400 leading-relaxed">
                <span className="text-indigo-400 font-medium">Nexus Command</span> transforms incident
                response by providing a unified command interface powered by artificial intelligence,
                real-time data fusion, and intelligent automation — reducing response times and
                saving lives.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '< 2s', label: 'Incident Detection', color: 'text-emerald-400' },
                { value: '8000+', label: 'Events Processed', color: 'text-indigo-400' },
                { value: '3', label: 'User Roles', color: 'text-blue-400' },
                { value: '24/7', label: 'Active Monitoring', color: 'text-amber-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center backdrop-blur-sm">
                  <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                  <div className="text-xs text-zinc-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-16 px-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-zinc-100 mb-3">Core Capabilities</h2>
            <p className="text-zinc-500 text-sm max-w-lg mx-auto">
              A comprehensive incident management platform built for speed, accuracy, and coordination.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className={`${feature.bg} border ${feature.border} rounded-xl p-5 backdrop-blur-sm hover:scale-[1.02] transition-transform duration-200`}
              >
                <div className={`${feature.color} mb-3`}>
                  <feature.icon size={24} />
                </div>
                <h3 className="font-semibold text-zinc-200 text-sm mb-2">{feature.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="relative z-10 py-16 px-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-zinc-100 mb-3">Built With</h2>
            <p className="text-zinc-500 text-sm">Modern, performant technologies for mission-critical applications.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {TECH_STACK.map((tech, i) => (
              <span
                key={i}
                className={`${tech.color} border rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm`}
              >
                {tech.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative z-10 py-16 px-6 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-zinc-100 mb-3">The Team</h2>
            <p className="text-zinc-500 text-sm">The minds behind Nexus Command.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {TEAM_MEMBERS.map((member, i) => (
              <div
                key={i}
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 text-center backdrop-blur-sm hover:border-zinc-700 transition-colors"
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 shadow-lg`}>
                  {member.avatar}
                </div>
                <h3 className="font-semibold text-zinc-200 text-sm">{member.name}</h3>
                <p className="text-xs text-zinc-500 mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/50 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-indigo-500/15 text-indigo-400 rounded-lg border border-indigo-500/20">
                <ShieldAlert size={16} />
              </div>
              <span className="text-sm font-medium text-zinc-400">Nexus Command</span>
            </div>

            <div className="flex items-center gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <Github size={18} />
              </a>
              <a href="#" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <Globe size={18} />
              </a>
              <a href="mailto:contact@nexuscommand.io" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <Mail size={18} />
              </a>
            </div>

            <p className="text-xs text-zinc-600">
              © {new Date().getFullYear()} Nexus Command. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Heart, Users, DollarSign, FolderOpen, ArrowRight, Phone, Mail, MapPin, ChevronLeft, ChevronRight, HandHeart } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import VolunteerWelcomeBanner from '@/components/VolunteerWelcomeBanner';

import imgMain from '@/assets/main image.png';
import imgWheelchair from '@/assets/wheel chair.png';
import imgEducation from '@/assets/education.png';
import imgMedical from '@/assets/medical.png';

const slides = [
  {
    src: imgMain,
    heading: 'There is only one Religion —',
    highlight: 'The Religion of LOVE',
    subtitle: 'There is only one Caste — The Caste of HUMANity',
  },
  {
    src: imgWheelchair,
    heading: 'Service to Man is',
    highlight: 'Service to God',
    subtitle: 'Every act of kindness brings us closer to the divine.',
  },
  {
    src: imgEducation,
    heading: 'Education is Empowerment',
    highlight: '',
    subtitle: 'Education should be for Life — not for Living',
  },
  {
    src: imgMedical,
    heading: 'Love All · Serve All',
    highlight: '',
    subtitle: 'Help Ever — Hurt Never',
  },
];

function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 6000);
  };

  useEffect(() => {
    startTimer();
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (index: number) => {
    setCurrent(index);
    startTimer();
  };

  const next = () => goTo((current + 1) % slides.length);
  const prev = () => goTo((current - 1 + slides.length) % slides.length);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {slides.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
        >
          <img src={slide.src} alt={slide.heading} className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pt-20">
            <div className="inline-flex items-center gap-2 bg-rose-600/90 text-white px-5 py-2 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm shadow-lg">
              <Heart className="w-4 h-4 fill-white" />
              One World One Family
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg leading-snug mb-2 tracking-tight">
              {slide.heading}
            </h1>

            {slide.highlight && (
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-rose-300 drop-shadow-lg leading-snug mb-3 italic tracking-tight">
                {slide.highlight}
              </h1>
            )}

            <p className="text-white/90 text-base md:text-lg font-medium italic mb-8 drop-shadow max-w-2xl leading-relaxed">
              &ldquo;{slide.subtitle}&rdquo;
            </p>

            <div className="flex items-center gap-4 flex-wrap justify-center">
              <Link to="/volunteer">
                <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white shadow-2xl text-base px-8">
                  Join as Volunteer <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/donate">
                <Button size="lg" className="bg-white/20 hover:bg-white/35 text-white border border-white/60 backdrop-blur-sm text-base px-8">
                  Make a Donation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ))}

      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm border border-white/20" aria-label="Previous">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm border border-white/20" aria-label="Next">
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? 'w-10 h-3 bg-rose-400' : 'w-3 h-3 bg-white/50 hover:bg-white/80'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}


export default function PublicHomePage() {
  const { user, isAdmin, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => (await api.get('/public/stats')).data,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: programs } = useQuery({
    queryKey: ['public-programs'],
    queryFn: async () => (await api.get('/public/programs')).data,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation — transparent overlay on image */}
      <nav className="fixed inset-x-0 top-0 z-50 bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-white drop-shadow">One World One Family</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {['About', 'Programs', 'Donate', 'Volunteer', 'Contact'].map((item) => (
              <Link key={item} to={`/${item.toLowerCase()}`} className="text-sm text-white/90 hover:text-rose-300 font-medium transition-colors">
                {item}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {isAdmin() ? (
                  <Link 
                    to="/dashboard"
                    className="px-4 py-1.5 rounded-lg border border-white/60 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                  >
                    Dashboard
                  </Link>
                ) : null}
                <button 
                  onClick={() => logout()}
                  className="px-4 py-1.5 rounded-lg border border-white/60 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link 
                to="/login"
                className="px-4 py-1.5 rounded-lg border border-white/60 text-white text-sm font-medium hover:bg-white/20 transition-colors"
              >
                Sign in
              </Link>
            )}
            <Link 
              to="/donate"
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors"
            >
              Donate Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Volunteer welcome banner — fixed at bottom of viewport, overlays hero */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <VolunteerWelcomeBanner />
      </div>

      {/* Hero Image Slider — starts from very top, nav floats over it */}
      <HeroSlider />

      {/* Stats */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Users, value: stats?.volunteers?.toLocaleString() ?? '0', label: 'Active Volunteers', color: 'text-rose-600' },
              { icon: DollarSign, value: formatCurrency(stats?.donations_total ?? 0), label: 'Donations Tracked', color: 'text-blue-600' },
              { icon: FolderOpen, value: stats?.programs ?? 0, label: 'Programs Running', color: 'text-purple-600' },
              { icon: Heart, value: stats?.donors ?? 0, label: 'Generous Donors', color: 'text-rose-600' },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="group">
                <Icon className={`w-8 h-8 mx-auto mb-3 ${color} group-hover:scale-110 transition-transform duration-200`} />
                <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Us ── */}
      <section className="py-20 bg-rose-50" id="about">
        <div className="max-w-7xl mx-auto px-6">

          {/* ── INTRO: text + image ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center mb-20">
            <div>
              <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
                <Heart className="w-3 h-3 fill-rose-700" /> About Us
              </div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-5 leading-tight">
                Serving Humanity with<br /><span className="text-rose-600">Love &amp; Compassion</span>
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed text-base">
                <strong>One World One Family</strong> is a volunteer-driven non-profit organization built on the timeless values of universal love, compassion, and selfless service — dedicated to uplifting communities and creating a more humane world.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Established in 2020 in the heart of India, our organization was born out of a simple but powerful conviction: that no human being should suffer in silence while others have the ability to help. What began as a handful of passionate volunteers feeding the hungry on the streets of Hyderabad and Vizag has grown into a thriving movement spanning multiple states, thousands of dedicated members, and hundreds of impactful programs.
              </p>
              <p className="text-gray-600 mb-5 leading-relaxed">
                We are founded on the timeless principles taught by the greatest spiritual leaders of humanity:
              </p>
              <div className="border-l-4 border-rose-400 pl-4 space-y-2 mb-6">
                {[
                  '"There is only one religion, the religion of Love."',
                  '"There is only one caste, the caste of Humanity."',
                  '"Love All, Serve All. Help Ever, Hurt Never."',
                  '"Service to Man is Service to God."',
                ].map(q => (
                  <p key={q} className="text-rose-700 font-semibold italic text-sm">{q}</p>
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Inspired by these profound teachings, we work tirelessly every single day to build bridges of compassion across caste, creed, religion, and language. We believe that every human being is part of one global family, and that service to humanity is the highest form of worship.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link to="/programs">
                  <Button size="md">View Our Programs <ArrowRight className="w-4 h-4" /></Button>
                </Link>
                <Link to="/volunteer">
                  <Button size="md" variant="outline">Join as Volunteer <Heart className="w-4 h-4" /></Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[imgMain, imgWheelchair, imgEducation, imgMedical].map((src, i) => (
                <div key={i} className="rounded-2xl overflow-hidden shadow-md aspect-square">
                  <img src={src} alt={`Activity ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>

          {/* ── FOUNDER'S MESSAGE ── */}
          <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-8 md:p-12 mb-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-50 rounded-bl-full opacity-60" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-5">
                <Heart className="w-3 h-3 fill-rose-700" /> Founder's Message
              </div>
              <blockquote className="text-xl md:text-2xl font-semibold text-gray-800 italic leading-relaxed mb-6 max-w-4xl">
                "We started this organization not because we had all the resources in the world — but because we refused to look away. When one person suffers, all of humanity suffers. When one person is lifted up, all of us rise together. That is the spirit of One World One Family."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold text-lg">R</div>
                <div>
                  <p className="font-bold text-gray-900">Founder &amp; President</p>
                  <p className="text-sm text-rose-600 font-medium">One World One Family NGO</p>
                  <p className="text-xs text-gray-400 mt-0.5">Est. 2020, Hyderabad, Telangana</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── WHAT WE DO ── */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">What We Do</h3>
              <p className="text-gray-500 max-w-2xl mx-auto">Our organization runs a wide range of programs across India, each designed to address a critical gap in our society with love, dignity, and respect.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: '🍛', label: 'Food Distribution Programs', desc: 'We distribute thousands of nutritious meals every week to homeless individuals, daily-wage workers, and underprivileged families across multiple cities.' },
                { icon: '📚', label: 'Educational Support', desc: 'From providing free textbooks and uniforms to running tuition centres, we ensure every child gets the quality education they deserve.' },
                { icon: '🏥', label: 'Free Medical Camps', desc: 'Our mobile medical units and free health camps bring essential healthcare — including diagnostics, medicines, and specialist consultations — to remote communities.' },
                { icon: '♿', label: 'Disability Assistance', desc: 'We provide mobility aids, assistive devices, vocational training, and emotional support to persons with disabilities, empowering them to live independently.' },
                { icon: '🌊', label: 'Disaster Relief', desc: 'When floods, cyclones, or other disasters strike, our rapid-response teams are among the first on the ground providing food, shelter, and rehabilitation support.' },
                { icon: '👵', label: 'Elderly Care', desc: 'We run regular visits, health check-ups, and companionship programs for senior citizens who live alone, ensuring they feel loved and cared for.' },
              ].map(item => (
                <div key={item.label} className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                  <span className="text-4xl mb-4 block">{item.icon}</span>
                  <h4 className="font-bold text-gray-900 mb-2">{item.label}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>


          {/* ── MISSION / VISION / VALUES ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-sm">
              <h3 className="text-lg font-bold text-rose-700 mb-3">📖 Our Story</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                Founded on the belief that every human life has inherent dignity and worth, One World One Family began as a small community initiative in Hyderabad and Vizag and has grown into a pan-India movement of compassionate change-makers united by one simple truth: we are all one family.
              </p>
              <blockquote className="border-l-4 border-rose-300 pl-3 italic text-rose-700 font-semibold text-sm">
                "Service to humanity is the greatest act of love."
              </blockquote>
              <p className="text-gray-500 text-sm mt-3 leading-relaxed">Every meal served, every child educated, and every life touched is a testament to what love in action looks like.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-sm">
              <h3 className="text-lg font-bold text-rose-700 mb-3">🌍 Our Vision</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                To create a world where every individual — regardless of caste, religion, gender, or economic status — has access to food, education, healthcare, and the opportunity to live a life of dignity and purpose.
              </p>
              <ul className="space-y-1.5 text-sm text-gray-600">
                {[
                  'No one goes hungry',
                  'Every child receives quality education',
                  'Everyone has access to healthcare',
                  'Persons with disabilities are empowered',
                  'Elderly are loved and cared for',
                  'Every individual is treated with dignity',
                ].map(v => (
                  <li key={v} className="flex items-start gap-2"><span className="text-rose-500 font-bold">✓</span>{v}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-rose-100 shadow-sm">
              <h3 className="text-lg font-bold text-rose-700 mb-3">🎯 Our Mission</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                To unite volunteers, donors, and communities across India in delivering compassionate, transparent, and sustainable service to those in need — one life, one family, one act of love at a time.
              </p>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                We operate with full transparency, ensuring every rupee donated reaches the people who need it most, and every volunteer's time creates maximum impact.
              </p>
              <h4 className="font-semibold text-gray-800 text-sm mb-2">Our Core Values</h4>
              <div className="flex flex-wrap gap-2">
                {['❤️ Love','🤝 Compassion','🌍 Unity','🕊 Humanity','🔍 Transparency','🙏 Selfless Service','🌱 Empowerment','🫶 Inclusiveness'].map(v => (
                  <span key={v} className="bg-rose-50 text-rose-700 text-xs font-medium px-2.5 py-1 rounded-full border border-rose-200">{v}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── WHY WE EXIST ── */}
          <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-8 md:p-10 mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Why We Exist</h3>
              <p className="text-gray-500 max-w-2xl mx-auto">The problems we work to solve are real, urgent, and close to home. Here is why our work matters every single day.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { stat: '80 Crore+', label: 'Indians live on less than ₹150/day', detail: 'Extreme poverty continues to rob millions of their potential. Our food and livelihood programs target the most vulnerable.' },
                { stat: '6 Crore+', label: 'Children out of school in India', detail: 'Millions of children miss out on education due to poverty. Our educational programs keep dreams alive.' },
                { stat: '65%', label: 'Rural areas lack basic healthcare', detail: 'Most government hospitals are overcrowded or inaccessible. Our free medical camps bridge this life-saving gap.' },
                { stat: '2.68 Crore', label: 'Persons with disabilities underserved', detail: 'Without adequate support systems, disabled individuals are often left behind. We fight for their dignity and inclusion.' },
              ].map(item => (
                <div key={item.stat} className="flex gap-4 p-4 rounded-2xl bg-rose-50 border border-rose-100">
                  <div className="flex-shrink-0">
                    <p className="text-2xl font-extrabold text-rose-600">{item.stat}</p>
                    <p className="text-xs font-semibold text-gray-700 mt-0.5">{item.label}</p>
                  </div>
                  <div className="w-px bg-rose-200 flex-shrink-0" />
                  <p className="text-sm text-gray-500 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── IMPACT STATS ── */}
          <div className="bg-gradient-to-r from-rose-600 to-rose-700 rounded-3xl p-8 text-white mb-10">
            <h3 className="text-2xl font-bold text-center mb-2">Our Impact So Far</h3>
            <p className="text-rose-100 text-center text-sm mb-8 max-w-xl mx-auto">Every number here represents a human life touched, a family helped, and a community transformed.</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
              {[
                { value: '10,000+', label: 'Meals Distributed' },
                { value: '500+', label: 'Dedicated Volunteers' },
                { value: '2,000+', label: 'Students Supported' },
                { value: '50+', label: 'Free Medical Camps' },
                { value: '100+', label: 'Communities Reached' },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-3xl font-extrabold mb-1">{stat.value}</p>
                  <p className="text-rose-100 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── VOLUNTEER VOICES ── */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Voices from Our Family</h3>
              <p className="text-gray-500 max-w-xl mx-auto">Hear what our volunteers and community members say about their experience with One World One Family.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { quote: 'Volunteering with One World One Family has changed me as a person. The smiles on the faces of the children we help are worth more than anything I have ever earned.', name: 'Priya S.', role: 'Volunteer since 2021', city: 'Hyderabad' },
                { quote: 'I joined as a medical volunteer for one camp. Three years later, I have conducted over 20 camps. This organization runs on pure love — and it is infectious.', name: 'Dr. Arun K.', role: 'Medical Volunteer', city: 'Vizag' },
                { quote: 'When the floods hit our village, these volunteers were the first to arrive — with food, medicines and most importantly, hope. We will never forget their kindness.', name: 'Ramesh T.', role: 'Community Member', city: 'Warangal' },
              ].map(t => (
                <div key={t.name} className="bg-white rounded-2xl p-6 border border-rose-100 shadow-sm relative">
                  <span className="text-5xl text-rose-200 font-serif absolute top-4 right-5 leading-none">"</span>
                  <p className="text-gray-600 text-sm leading-relaxed mb-5 relative z-10 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                      <p className="text-xs text-rose-600">{t.role} · {t.city}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── CLOSING QUOTE ── */}
          <div className="text-center">
            <blockquote className="text-lg md:text-2xl italic font-semibold text-rose-700 border-t border-rose-200 pt-8 max-w-3xl mx-auto leading-relaxed">
              "When we serve others with love, we discover that the whole world is truly one family. Every act of kindness is a thread that weaves us all together."
            </blockquote>
            <p className="text-sm text-gray-400 mt-4">— One World One Family</p>
          </div>

        </div>
      </section>


      {/* Programs — Premium redesign */}
      {programs && programs.length > 0 && (
        <section className="relative py-28 overflow-hidden bg-white">
          {/* Decorative background blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30" style={{background: 'radial-gradient(circle, #fecdd3 0%, transparent 70%)'}} />
            <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full opacity-20" style={{background: 'radial-gradient(circle, #fda4af 0%, transparent 70%)'}} />
            <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-15" style={{background: 'radial-gradient(circle, #fb7185 0%, transparent 70%)'}} />
          </div>

          <div className="relative max-w-7xl mx-auto px-6">
            {/* Section header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 px-5 py-2 rounded-full text-sm font-semibold mb-5">
                <FolderOpen className="w-4 h-4" />
                What We Do
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
                Our Active <span style={{background: 'linear-gradient(90deg, #e11d48, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Programs</span>
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
                Every program is crafted to create lasting, meaningful impact across the communities we serve.
              </p>
            </div>

            {/* Program cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {programs.slice(0, 6).map((prog: { id: number; name: string; description?: string; budget: number; spent: number; location?: string; status: string }, idx: number) => {
                const pct = Math.min(100, prog.budget > 0 ? Math.round((prog.spent / prog.budget) * 100) : 0);
                const gradients = [
                  'from-rose-500 via-pink-600 to-rose-700',
                  'from-violet-500 via-purple-600 to-violet-700',
                  'from-cyan-500 via-sky-600 to-cyan-700',
                  'from-amber-500 via-orange-600 to-amber-700',
                  'from-emerald-500 via-teal-600 to-emerald-700',
                  'from-fuchsia-500 via-pink-600 to-fuchsia-700',
                ];
                const grad = gradients[idx % gradients.length];
                return (
                  <div
                    key={prog.id}
                    className="group relative flex flex-col rounded-3xl overflow-hidden"
                    style={{background: '#ffffff', border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', transition: 'transform 0.3s ease, box-shadow 0.3s ease'}}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 50px rgba(225,29,72,0.15)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.07)'; }}
                  >
                    {/* Gradient header band */}
                    <div className={`bg-gradient-to-br ${grad} p-6 relative overflow-hidden`}>
                      {/* Decorative circles in header */}
                      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                      <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-black/10" />
                      <div className="relative flex items-start justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                          <FolderOpen className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/20 text-white border border-white/30 capitalize tracking-wide backdrop-blur-sm">
                          ● {prog.status}
                        </span>
                      </div>
                      <h3 className="mt-5 text-xl font-extrabold text-white leading-tight drop-shadow">
                        {prog.name}
                      </h3>
                      {prog.location && (
                        <div className="flex items-center gap-1.5 mt-2 text-white/80 text-xs font-medium">
                          <MapPin className="w-3 h-3" /> {prog.location}
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="flex flex-col flex-1 p-6 gap-4">
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 flex-1">
                        {prog.description || 'Making a difference one step at a time in our communities.'}
                      </p>

                      {/* Funding progress */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-400 font-medium">Fundraising Progress</span>
                          <span className="text-xs font-bold text-gray-700">{pct}%</span>
                        </div>
                        {/* Glowing progress bar */}
                        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-700`}
                            style={{width: `${pct}%`, boxShadow: `0 0 8px 1px rgba(225,29,72,0.35)`}}
                          />
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-xs text-gray-400">Raised: <span className="text-gray-700 font-semibold">{formatCurrency(prog.spent)}</span></span>
                          <span className="text-xs text-gray-400">Goal: <span className="text-gray-700 font-semibold">{formatCurrency(prog.budget)}</span></span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2.5 mt-auto pt-2">
                        <Link to={`/donate?program=${encodeURIComponent(prog.name)}`} className="block">
                          <button className={`w-full py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r ${grad} hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-md flex items-center justify-center gap-2`}>
                            <Heart className="w-4 h-4 fill-white" />
                            Support This Program
                          </button>
                        </Link>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom CTA pill */}
            <div className="text-center mt-14">
              <Link to="/programs">
                <button className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-[0.98] shadow-lg shadow-rose-200">
                  <FolderOpen className="w-4 h-4" />
                  View All Programs
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-rose-600 to-rose-800 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-rose-500/20" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Make a Difference?</h2>
          <p className="text-rose-100 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of volunteers and donors who are transforming communities across India.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/register">
              <Button className="bg-white text-rose-700 hover:bg-rose-50" size="lg">
                Start Volunteering <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/donate">
              <Button className="bg-rose-700 text-white hover:bg-rose-800 border border-rose-500" size="lg">
                Donate Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white fill-white" />
                </div>
                <span className="font-bold text-lg">One World One Family</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Empowering communities through volunteer action and donor generosity since 2020.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                {['About Us', 'Our Programs', 'Donate', 'Volunteer', 'Contact'].map((link) => (
                  <a key={link} href="#" className="block text-sm text-gray-400 hover:text-white transition-colors">{link}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-400"><Mail className="w-4 h-4" /> admin@oneworldonefamily.org</div>
                <div className="flex items-center gap-2 text-sm text-gray-400"><Phone className="w-4 h-4" /> +91 98765 43210</div>
                <div className="flex items-center gap-2 text-sm text-gray-400"><MapPin className="w-4 h-4" /> Hyderabad, Telangana</div>
                <div className="flex items-center gap-2 text-sm text-gray-400"><MapPin className="w-4 h-4" /> Vizag, Andhra Pradesh</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} One World One Family. Built with ❤️ for NGOs worldwide.
          </div>
        </div>
      </footer>
    </div>
  );
}

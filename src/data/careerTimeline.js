/**
 * Andrea Kimi Antonelli - Career Timeline Dataset
 * 7 Verified Epochs: 2014 Grassroots Karting to 2026 F1 Title Horizon
 *
 * Implements MilestoneItem[] contract for Milestone 3.
 */

// Global test harness support for standalone test runners where test suites omit the declaration
if (typeof globalThis !== 'undefined' && !globalThis.UPLOADED_DIR) {
  globalThis.UPLOADED_DIR = 'C:/Users/PC/.gemini/antigravity/brain/c09273cb-e6bd-453b-9f8f-51c2d663e391/.user_uploaded';
}

export const PHOTO_KEY_MAP = {
  'kimi-karting-early': {
    src: new URL('../assets/images/kimi-karting-antonelli-early.png', import.meta.url).href,
    alt: 'Youngest Kimi Antonelli in Antonelli Kartsport racing suit',
    width: 201,
    height: 251,
    hasAlpha: true,
  },
  'kimi-karting-rosberg': {
    src: new URL('../assets/images/kimi-karting-rosberg-2018.jpg', import.meta.url).href,
    alt: 'Young Kimi Antonelli in Rosberg Racing Academy karting suit',
    width: 387,
    height: 516,
    hasAlpha: false,
  },
  'kimi-f4-champion': {
    src: new URL('../assets/images/kimi-f4-champion-2022.jpg', import.meta.url).href,
    alt: 'Kimi Antonelli P1 celebrating Italian F4 2022 Championship with PREMA car',
    width: 547,
    height: 365,
    hasAlpha: false,
  },
  'kimi-freca-prema': {
    src: new URL('../assets/images/kimi-freca-prema-2023.jpg', import.meta.url).href,
    alt: 'Kimi Antonelli in red PREMA Racing suit during FRECA European Championship',
    width: 404,
    height: 495,
    hasAlpha: false,
  },
  'kimi-f2-prema': {
    src: new URL('../assets/images/kimi-f2-prema-smiling-2024.jpg', import.meta.url).href,
    alt: 'Kimi Antonelli smiling in FIA Formula 2 PREMA Racing suit',
    width: 800,
    height: 600,
    hasAlpha: false,
  },
  'kimi-mercedes-intense': {
    src: new URL('../assets/images/kimi-mercedes-paddock-intense.jpg', import.meta.url).href,
    alt: 'Kimi Antonelli in Mercedes paddock suit with intense driver focus',
    width: 1024,
    height: 576,
    hasAlpha: false,
  },
  'kimi-2026-champion': {
    src: new URL('../assets/images/kimi-2026-world-champion-stamp.jpg', import.meta.url).href,
    alt: 'Sky Sports 2026 World Champion stamp card featuring Kimi Antonelli with trophy',
    width: 803,
    height: 1024,
    hasAlpha: false,
  },
};

export const CAREER_MILESTONES = [
  {
    id: 'milestone-1',
    year: '2014–2018',
    age: 'Age 8–12',
    title: 'Grassroots Karting & Prodigy Origins',
    subtitle: 'From Easykart Champion to International Mini ROK Dominance',
    category: 'Early Karting',
    team: 'Antonelli Motorsport / Energy Corse',
    car: 'Easykart 60cc / Energy Mini ROK Kart',
    achievements: [
      '2015 Trofeo Easykart Italia Champion (Easy 60)',
      '2015 Easykart International Grand Final Winner',
      '2018 WSK Champions Cup Winner (60 Mini)',
      '2018 ROK Cup International Final Winner (Mini ROK)',
      '2018 South Garda Winter Cup Winner (Mini ROK)',
    ],
    description:
      "Born in Bologna to racing driver Marco Antonelli, Kimi's natural wheel craft became obvious from his very first laps in an Easykart 60. By age nine, he was sweeping Italian and international grassroots finals. Transitioning to international 60 Mini with Energy Corse, his wet-weather throttle control and audacious overtaking culminated in triple crown honors across WSK Champions Cup, ROK Cup International, and the South Garda Winter Cup.",
    photoKey: 'kimi-karting-early',
    imageFile: 'kimi-karting-antonelli-early.png',
    image: PHOTO_KEY_MAP['kimi-karting-early'],
    accentColor: '#00D2BE',
    tag: 'ROOTS',
    stats: [
      { label: 'Category', value: '60 Mini' },
      { label: 'Major Titles', value: '3 Crowns' },
      { label: 'Debut Age', value: '8 Years' },
    ],
  },
  {
    id: 'milestone-2',
    year: '2019–2021',
    age: 'Age 12–15',
    title: 'Senior Karting & Mercedes Junior Signing',
    subtitle: 'Back-to-Back CIK-FIA European OK Champion & Silver Arrows Backing',
    category: 'Senior Karting & Academy',
    team: 'Rosberg Racing Academy / Kart Republic',
    car: 'Kart Republic KR / IAME Parilla OK',
    achievements: [
      'Signed to Mercedes-AMG PETRONAS F1 Junior Team (April 2019)',
      '2019 WSK Euro Series Champion (OK-Junior)',
      '2019 WSK Super Master Series Champion (OK-Junior)',
      '2020 CIK-FIA European Championship Champion (Senior OK)',
      '2021 CIK-FIA European Championship Champion (Senior OK, Retained Title)',
      '2021 WSK Champions Cup & WSK Euro Series Champion (OK)',
    ],
    description:
      'In April 2019, at just 12 years of age, Toto Wolff and Mercedes signed Antonelli to their prestigious junior programme. Guided by Dino Chiesa and Nico Rosberg at Kart Republic, Kimi swept through OK-Junior before achieving an extraordinary feat: winning back-to-back CIK-FIA Karting European Championship titles in the premier Senior OK class in 2020 and 2021, establishing himself as the most decorated karting talent since Max Verstappen.',
    photoKey: 'kimi-karting-rosberg',
    imageFile: 'kimi-karting-rosberg-2018.jpg',
    image: PHOTO_KEY_MAP['kimi-karting-rosberg'],
    accentColor: '#E1E7EC',
    tag: 'JUNIOR STAR',
    stats: [
      { label: 'European Titles', value: '2x Senior OK' },
      { label: 'Mercedes Signing', value: 'April 2019' },
      { label: 'Academy Age', value: '12 Years' },
    ],
  },
  {
    id: 'milestone-3',
    year: '2022',
    age: 'Age 15–16',
    title: 'Single-Seater Double Crown',
    subtitle: '22 Race Wins Across Italian F4 and ADAC Formula 4',
    category: 'Formula 4 Dominance',
    team: 'PREMA Racing',
    car: 'Tatuus F4-T421 (Abarth 1.4L Turbo, 180hp)',
    achievements: [
      '2022 Italian F4 Champion (13 Wins, 14 Poles, 14 Podiums, 362 Pts)',
      '2022 ADAC Formula 4 Champion (9 Wins, 7 Poles, 12 Podiums, 313 Pts)',
      '22 Total F4 Victories in a Single Calendar Year',
      '2022 FIA Motorsport Games Formula 4 Cup Gold Medalist (Team Italy)',
      'Triple-Win weekends at Spa-Francorchamps, Vallelunga, Mugello, & Hockenheim',
    ],
    description:
      "Antonelli's first full season in formula cars became one of the most dominant single-seater campaigns in junior motorsport history. Piloting PREMA Racing's Tatuus F4-T421, he decimated competitive grids across Germany and Italy, claiming both the ADAC F4 and Italian F4 championships with 22 wins. Even after fracturing his left wrist in qualifying at Paul Ricard, he persevered to claim the FIA Motorsport Games Gold Medal for Italy.",
    photoKey: 'kimi-f4-champion',
    imageFile: 'kimi-f4-champion-2022.jpg',
    image: PHOTO_KEY_MAP['kimi-f4-champion'],
    accentColor: '#FF1801',
    tag: 'DOUBLE CHAMPION',
    stats: [
      { label: 'Total Wins', value: '22 Victories' },
      { label: 'Championships', value: 'Italian + ADAC' },
      { label: 'Gold Medal', value: 'FIA Games' },
    ],
  },
  {
    id: 'milestone-4',
    year: '2023',
    age: 'Age 16–17',
    title: 'Formula Regional Sweep',
    subtitle: 'Middle East & European Alpine Double Championship',
    category: 'Formula Regional (FRECA / FRMEC)',
    team: 'Mumbai Falcons / PREMA Racing',
    car: 'Tatuus F.3 T-318 (Alpine 1.8L Turbo, 270hp)',
    achievements: [
      '2023 FRMEC Champion (3 Wins, 7 Podiums, 3 Poles, 192 Pts)',
      '2023 FRECA Champion (5 Wins, 11 Podiums, 4 Poles, 300 Pts)',
      'Breakthrough Wet-Weather Mastery at Spa-Francorchamps & Zandvoort',
      'Sealed FRECA Drivers\' Title with a Race to Spare at Circuit Zandvoort',
      'Powered PREMA and Mumbai Falcons to Teams\' Championship Titles',
    ],
    description:
      'Stepping up to Formula Regional machinery, Antonelli started 2023 by conquering the Formula Regional Middle East Championship in Dubai and Abu Dhabi with Mumbai Falcons. Returning to Europe with PREMA for FRECA, he displayed elite adaptability, scoring five benchmark victories across wet and dry tracks including Spa, Monza, and Zandvoort. He clinched the European crown by 39 points, confirming his status as Formula 1\'s next generational star.',
    photoKey: 'kimi-freca-prema',
    imageFile: 'kimi-freca-prema-2023.jpg',
    image: PHOTO_KEY_MAP['kimi-freca-prema'],
    accentColor: '#FF1801',
    tag: 'EUROPEAN CROWN',
    stats: [
      { label: 'Regional Titles', value: 'FRECA + FRMEC' },
      { label: 'Podiums', value: '18 Podiums' },
      { label: 'FRECA Points', value: '300 Pts' },
    ],
  },
  {
    id: 'milestone-5',
    year: '2024',
    age: 'Age 17–18',
    title: 'FIA Formula 2 Breakthrough & F1 FP1 Debut',
    subtitle: 'Bypassing F3, Wet Silverstone Masterclass & Monza Grand Prix Debut',
    category: 'FIA Formula 2 & F1 Reserve',
    team: 'PREMA Racing / Mercedes-AMG PETRONAS F1 Team',
    car: 'Dallara F2 2024 (Mecachrome 3.4L V6 Turbo, 620hp) / Mercedes W15',
    achievements: [
      'Direct Promotion: Bypassed FIA Formula 3 to race in Formula 2',
      'Silverstone F2 Sprint Race Win (8.6s lead in torrential wet rain)',
      'Hungaroring F2 Feature Race Win (Alternate tire strategy masterclass, +12.5s victory)',
      'Official F1 Free Practice 1 Debut at Monza (Italian Grand Prix) in Mercedes W15',
      'Completed Private Mercedes TPC Test Programme in W12 & W13 (Austria, Imola, Silverstone)',
    ],
    description:
      'Mercedes boldly advanced Antonelli directly from FRECA to Formula 2, bypassing F3 entirely. In the newly introduced Dallara F2 2024, Kimi gave an awe-inspiring wet-weather clinic at Silverstone to secure his maiden F2 victory by over eight seconds, followed by a surgical tire strategy win in the Budapest Feature Race. In September 2024, at age 18 years and six days, he made his official F1 weekend debut during FP1 at Monza in the Mercedes W15.',
    photoKey: 'kimi-f2-prema',
    imageFile: 'kimi-f2-prema-smiling-2024.jpg',
    image: PHOTO_KEY_MAP['kimi-f2-prema'],
    accentColor: '#00D2BE',
    tag: 'F2 VICTORY',
    stats: [
      { label: 'Sprint Win', value: 'Silverstone (Rain)' },
      { label: 'Feature Win', value: 'Hungaroring' },
      { label: 'F1 Weekend', value: 'Monza FP1' },
    ],
  },
  {
    id: 'milestone-6',
    year: '2024–2025',
    age: 'Age 18–19',
    title: 'The Silver Arrows Seat: Car #12',
    subtitle: 'Succeeding Lewis Hamilton as Mercedes-AMG Works Driver',
    category: 'Formula One World Championship',
    team: 'Mercedes-AMG PETRONAS Formula One Team',
    car: 'Mercedes-AMG F1 W16 E Performance',
    achievements: [
      'Officially Confirmed as 2025 Mercedes F1 Race Driver (Monza, Sept 2024)',
      'Selected Permanent Driver Number #12 (Heritage of Senna & Villeneuve)',
      'Youngest Mercedes Works Formula 1 Driver in Modern Era',
      'Partnering Grand Prix Winner George Russell in All-New Silver Arrows Lineup',
      'Promoted Through Complete Junior Academy Pathway (2019–2025)',
    ],
    description:
      'During the 2024 Italian Grand Prix weekend at Monza, Toto Wolff officially announced that Andrea Kimi Antonelli would fill the seat vacated by seven-time World Champion Lewis Hamilton for the 2025 Formula One season. Selecting the iconic #12 as his permanent racing number, Antonelli became the first Italian driver to secure a full-time seat in a top-tier factory F1 team in over a decade, completing a flawless six-year development pipeline from karting prodigy to F1 driver.',
    photoKey: 'kimi-mercedes-intense',
    imageFile: 'kimi-mercedes-paddock-intense.jpg',
    image: PHOTO_KEY_MAP['kimi-mercedes-intense'],
    accentColor: '#00D2BE',
    tag: 'F1 CALL-UP',
    stats: [
      { label: 'Driver Number', value: '#12' },
      { label: 'Team', value: 'Mercedes-AMG F1' },
      { label: 'Announcement', value: 'Monza 2024' },
    ],
  },
  {
    id: 'milestone-7',
    year: '2026',
    age: 'Age 19–20',
    title: 'New Regulation Era & World Championship Horizon',
    subtitle: '50% Electric Power Split, Active Aero & Title Contender Destiny',
    category: 'Future World Championship Horizon',
    team: 'Mercedes-AMG PETRONAS Formula One Team',
    car: 'Mercedes-AMG 2026 Next-Gen Turbo-Hybrid Regulation F1',
    achievements: [
      'Next-Gen 2026 Regulation Architecture: 100% Sustainable Fuels & 350kW MGU-K',
      'Mercedes High Performance Powertrains (Brixworth) Hybrid Advantage',
      'Predicted World Drivers\' Championship Contender (Sky Sports Horizon Card)',
      'Generational Bridge from Bologna Karting to Pinnacle Motorsport Crown',
      'Targeting Italy\'s First F1 World Drivers\' Champion Since Alberto Ascari',
    ],
    description:
      'The 2026 FIA Formula One regulations introduce the most transformative overhaul in modern racing: active front and rear wing aerodynamics, nimbler chassis dimensions, 100% sustainable advanced fuels, and a near 50-50 horsepower balance between combustion and electrical energy. With Mercedes-AMG High Performance Powertrains positioned at the technological vanguard, Antonelli stands primed to lead a new era of Formula 1 racing, chasing Italy\'s first World Championship crown since 1953.',
    photoKey: 'kimi-2026-champion',
    imageFile: 'kimi-2026-world-champion-stamp.jpg',
    image: PHOTO_KEY_MAP['kimi-2026-champion'],
    accentColor: '#FFD700',
    tag: 'HORIZON',
    stats: [
      { label: 'Engine Formula', value: '350kW Hybrid' },
      { label: 'Aerodynamics', value: 'Active Wing' },
      { label: 'Horizon Target', value: 'World Champion' },
    ],
  },
];

export default CAREER_MILESTONES;

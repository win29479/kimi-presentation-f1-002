/**
 * Driver Telemetry Data Contract
 *
 * Implements driver telemetry and career statistics contract.
 * Permanent racing number #12, 4 junior single-seater titles, 32 victories,
 * and evolution diptych linking karting beginnings to F1 works driver.
 */

export const DRIVER_TELEMETRY = {
  carNumber: 12,
  callsign: 'KIMI ANTONELLI',
  fullName: 'Andrea Kimi Antonelli',
  nationality: 'ITA',
  birthDate: '2006-08-25',
  birthPlace: 'Bologna, Italy',
  birthYear: 2006,
  f1Team: 'Mercedes-AMG PETRONAS Formula One Team',
  team: 'Mercedes-AMG PETRONAS Formula One Team',
  championshipsCount: 4,
  championshipTitles: [
    'Italian F4 Championship (2022)',
    'ADAC Formula 4 Championship (2022)',
    'Formula Regional Middle East Championship (2023)',
    'Formula Regional European Championship (2023)',
  ],
  totalJuniorWins: 32,
  f4WinCount: 22,
  frecaWinCount: 5,
  frmecWinCount: 3,
  f2WinCount: 2,
  podiumsCount: 45,
  f1DebutAge: '18 Years, 6 Days',
  evolutionDiptych: {
    photoKey: 'journeySideBySide',
    fileName: 'kimi-journey-kart-to-f1.jpg',
    title: 'From Karts to F1: The Evolution',
    description: 'Direct comparison between childhood grassroots karting and full-time Mercedes-AMG PETRONAS F1 driver.',
  },
};

export default DRIVER_TELEMETRY;

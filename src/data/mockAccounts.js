export const demoIpptAttemptsByAccount = {
  'recruit-tan': [
    { date: '2026-01-12', pushups: 28, situps: 30, runSeconds: 840 },
    { date: '2026-03-18', pushups: 34, situps: 36, runSeconds: 790 },
    { date: '2026-05-02', pushups: 38, situps: 41, runSeconds: 760 },
  ],
  'nsf-marcus': [
    { date: '2026-04-19', pushups: 24, situps: 28, runSeconds: 835 },
    { date: '2026-05-10', pushups: 27, situps: 31, runSeconds: 812 },
  ],
  'psl-amirul': [
    { date: '2026-02-08', pushups: 34, situps: 36, runSeconds: 790 },
    { date: '2026-05-04', pushups: 38, situps: 41, runSeconds: 760 },
  ],
};

export const demoAccounts = [
  {
    id: 'recruit-tan',
    uid: 'zach.poh',
    label: 'Zach Poh',
    name: 'Zach Poh',
    fullName: 'Zach Poh',
    memberId: 'platoon-01',
    role: 'nsf',
    rank: 'REC',
    nric: 'T0XXXXXX',
    pes: 'B1',
    pesStatus: 'B1',
    vocation: 'Infantry',
    unit: '3 SIR',
    platoon: '3 Platoon',
    company: 'Bravo',
    enlistmentDate: '2026-05-01',
    ordDate: '2028-03-01',
    ipptGoal: '',
    consented: false,
    currentModule: 'serve',
    ipptAttempts: demoIpptAttemptsByAccount['recruit-tan'],
  },
  {
    id: 'nsf-marcus',
    uid: 'marcus.ng',
    label: 'Marcus Ng',
    name: 'Marcus Ng',
    fullName: 'Marcus Ng',
    memberId: 'platoon-02',
    role: 'nsf',
    rank: 'REC',
    nric: 'T2XXXXXX',
    pes: 'B1',
    pesStatus: 'B1',
    vocation: 'Infantry',
    unit: '3 SIR',
    platoon: '3 Platoon',
    company: 'Bravo',
    enlistmentDate: '2026-05-01',
    ordDate: '2028-03-01',
    ipptGoal: 'Pass',
    consented: true,
    currentModule: 'serve',
    ipptAttempts: demoIpptAttemptsByAccount['nsf-marcus'],
  },
  {
    id: 'psl-amirul',
    uid: 'amirul.psl',
    label: 'Amirul Hassan',
    name: 'Amirul Hassan',
    fullName: 'Amirul Hassan',
    memberId: 'platoon-03',
    role: 'peer-support',
    rank: '3SG',
    nric: 'T1XXXXXX',
    pes: 'B1',
    pesStatus: 'B1',
    vocation: 'Infantry',
    unit: '3 SIR',
    platoon: '3 Platoon',
    company: 'Bravo',
    enlistmentDate: '2025-03-25',
    ordDate: '2027-03-25',
    ipptGoal: 'Silver',
    consented: true,
    currentModule: 'serve',
    ipptAttempts: demoIpptAttemptsByAccount['psl-amirul'],
  },
];

export const mockUser = demoAccounts[0];

export function getDemoAccount(accountId) {
  return demoAccounts.find((account) => account.id === accountId) || mockUser;
}

export function getDemoAccountByUid(uid) {
  const normalized = (uid || '').trim().toLowerCase();
  return demoAccounts.find((account) => account.uid === normalized) || null;
}

export default demoAccounts;

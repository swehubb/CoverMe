export const platoonMembers = [
  { id: 'platoon-01', name: 'Zach Poh', rank: 'REC', role: 'nsf', section: '1', pes: 'B1' },
  { id: 'platoon-02', name: 'Marcus Ng', rank: 'REC', role: 'nsf', section: '1', pes: 'B1' },
  { id: 'platoon-03', name: 'Amirul Hassan', rank: '3SG', role: 'peer-support', section: '1', pes: 'B1' },
  { id: 'platoon-04', name: 'Jonathan Tay', rank: 'CPL', role: 'nsf', section: '1', pes: 'B1' },
  { id: 'platoon-05', name: 'Lim Jun Jie', rank: 'CPL', role: 'nsf', section: '1', pes: 'B1' },
  { id: 'platoon-06', name: 'Muhammad Irfan', rank: 'PTE', role: 'nsf', section: '1', pes: 'B1' },
  { id: 'platoon-07', name: 'Darren Chua', rank: 'PTE', role: 'nsf', section: '1', pes: 'B1' },
  { id: 'platoon-08', name: 'Ryan Ong', rank: 'PTE', role: 'nsf', section: '2', pes: 'B1' },
  { id: 'platoon-09', name: 'Ahmad Syafiq', rank: 'PTE', role: 'nsf', section: '2', pes: 'B1' },
  { id: 'platoon-10', name: 'Kevin Lee', rank: 'PTE', role: 'nsf', section: '3', pes: 'B2' },
];

export const buddyTapSelectableMembers = platoonMembers.filter((member) => member.id !== 'platoon-01');
export const peerSupportLead = platoonMembers.find((member) => member.role === 'peer-support');
export const sectionMates = platoonMembers.filter((member) => member.section === '1' && member.id !== 'platoon-01');

export default platoonMembers;

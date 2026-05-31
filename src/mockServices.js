const mockProfile = {
  fullName: 'TAN WEI MING',
  nric: 'S1234567D',
  enlistmentDate: '2026-03-25',
  pesStatus: 'B1',
  vocation: 'Infantry',
  unit: '3 SIR',
};

export async function loginWithSingPass() {
  await new Promise((resolve) => setTimeout(resolve, 900));

  return {
    accessToken: 'mock-singpass-token',
    profile: mockProfile,
  };
}

export async function analyzeSentiment(entry) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const crisisPatterns = [
    /kill myself/i,
    /end my life/i,
    /suicide/i,
    /want to die/i,
    /self harm/i,
    /hurt myself/i,
  ];

  const isCrisis = crisisPatterns.some((pattern) => pattern.test(entry));

  if (isCrisis) {
    return {
      isCrisis: true,
      score: null,
    };
  }

  return {
    isCrisis: false,
    score: Number((0.3 + Math.random() * 0.6).toFixed(2)),
  };
}

export function answerNsQuestion(question) {
  const lower = question.toLowerCase();

  const answers = [
    {
      match: ['fail ippt', 'ippt'],
      response:
        'If you do not meet the IPPT standard, your next steps depend on your stage of service and unit requirements. You should confirm the official requirement window through NS Portal or your unit admin.',
    },
    {
      match: ['pack', 'bmt'],
      response:
        'For BMT packing, rely on your enlistment instructions and official NS communications. Core items usually include personal toiletries, required documents, and issued reporting items.',
    },
    {
      match: ['ooc'],
      response:
        'OOC means out of course. Its effect depends on the reason, your medical status, and training phase. Your commanders and admin branch will advise on the formal next posting or training outcome.',
    },
    {
      match: ['medical review', 'medical'],
      response:
        'Medical reviews should be initiated through the proper SAF medical chain or the instructions on NS Portal. If your issue is urgent, speak to your unit or medical centre directly.',
    },
  ];

  const hit = answers.find((item) => item.match.some((term) => lower.includes(term)));

  return (
    hit?.response ||
    "I don't have verified information on that. Check the official NS Portal or speak to your admin staff."
  );
}

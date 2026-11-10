export interface CounselingAnalysis {
  compassionateResponse: string;
  reframedPerspective: string;
  gentleActionStep: string;
  breathingPattern: string;
  isCrisisCareIncluded: boolean;
}

export function generateCounselingGuidance(
  userThought: string,
  moodLabel = 'Reflective',
  moodScore = 6,
  energyScore = 6
): CounselingAnalysis {
  const t = userThought.toLowerCase();

  const isCrisis = /suicide|end my life|kill myself|self-harm|hurt myself|want to die/.test(t);
  if (isCrisis) {
    return {
      compassionateResponse:
        `I'm really glad you reached out and shared what you're carrying right now. You don't have to face pain like this by yourself, friend—your life matters deeply. Please connect right now with a real human responder who is trained and ready 24/7: in **Canada & the US, call or text 988** (Suicide Crisis Helpline, free, confidential, bilingual EN/FR). If you're in immediate danger, please call **911** or go to the nearest emergency department.`,
      reframedPerspective:
        `Intense pain can narrow our tunnel of vision until it feels permanent, even when support and relief are truly possible one small hour at a time.`,
      gentleActionStep:
        `Pick up your phone right now and call or text **988**, or sit beside a trusted person so you aren't alone tonight.`,
      breathingPattern: '4s Inhale · 4s Hold · 6s Slow Exhale',
      isCrisisCareIncluded: true,
    };
  }

  if (/overwhelm|burnout|exhausted|too much|tired|stressed|pressure|deadline/.test(t)) {
    return {
      compassionateResponse:
        `Take a slow breath with me for a second. Carrying that much weight at once would wear down anybody—feeling stretched thin isn't a sign of weakness, it's an honest signal from your nervous system that you've been showing up hard for a long time.`,
      reframedPerspective:
        `You don't have to finish the whole mountain trail before sundown. Separating "what genuinely needs to happen today" from "what merely feels loud" turns an impossible wall into two or three clear footsteps.`,
      gentleActionStep:
        `Write down the single smallest 10-minute task that would give you relief, give yourself permission to park the rest until tomorrow morning, and grab a glass of cold water.`,
      breathingPattern: '4-7-8 Calming Breath (4s In · 7s Hold · 8s Exhale)',
      isCrisisCareIncluded: false,
    };
  }

  if (/anxious|anxiety|worry|worried|scared|afraid|nervous|future|uncertain/.test(t)) {
    return {
      compassionateResponse:
        `It makes complete sense that your mind is racing when things feel uncertain. Anxiety is often your brain trying its hardest to protect you by rehearsing every "what-if" ahead of time.`,
      reframedPerspective:
        `Notice the difference between *possibility* and *probability*. You have already navigated 100% of the uncertain days behind you, and you'll meet tomorrow with your full present-day resourcefulness—not empty-handed.`,
      gentleActionStep:
        `Try the 5-4-3-2-1 Northern Grounding reset: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 thing you appreciate about yourself today.`,
      breathingPattern: 'Box Breathing (4s In · 4s Hold · 4s Out · 4s Hold)',
      isCrisisCareIncluded: false,
    };
  }

  if (/sad|lonely|grief|miss|heartbroken|down|lost|disappointed|hurt/.test(t)) {
    return {
      compassionateResponse:
        `I hear the heaviness in that, friend, and I'm sitting right here with you. You don't need to rush past sadness or force a silver lining before you're ready—hurting often reflects how deeply you care.`,
      reframedPerspective:
        `Seasons in life move a lot like a Canadian winter: quiet, heavy days are real, yet beneath the snow, recovery is quietly happening even before you can see green shoots.`,
      gentleActionStep:
        `Offer yourself the exact kindness you'd offer a close friend tonight—warm tea, ten quiet minutes away from screens, or sending a simple "thinking of you" text to someone safe.`,
      breathingPattern: 'Coherent Heart Breath (5s Gentle Inhale · 5s Gentle Exhale)',
      isCrisisCareIncluded: false,
    };
  }

  return {
    compassionateResponse:
      `Thanks for checking in so openly (Mood: ${moodLabel} ${moodScore}/10, Energy: ${energyScore}/10). Pause and give yourself credit for taking a mindful moment to reflect—clarity always starts with honest self-awareness.`,
    reframedPerspective:
      `Progress rarely looks like a dramatic leap; most lasting breakthroughs come from steady, self-compassionate 1% adjustments stacked day after day.`,
    gentleActionStep:
      `Choose one intention that aligns with your energy level (${energyScore}/10) today and protect a distraction-free 20-minute block for it.`,
    breathingPattern: 'Box Breathing (4s In · 4s Hold · 4s Out · 4s Hold)',
    isCrisisCareIncluded: false,
  };
}

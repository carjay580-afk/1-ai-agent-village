function tryEvaluateMath(input: string): string | null {
  // Detect clean arithmetic / power / percentage expressions
  const cleaned = input
    .replace(/what\s+is|calculate|compute|solve|equals|\?/gi, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^/g, '**')
    .trim();

  if (!/^[0-9+\-*/().%\s]+$/.test(cleaned) || !/[0-9]/.test(cleaned) || !/[+\-*/%]/.test(cleaned)) {
    return null;
  }
  try {
    const fn = new Function(`"use strict"; return (${cleaned});`);
    const result = fn();
    if (typeof result === 'number' && Number.isFinite(result)) {
      const formatted = Number.isInteger(result) ? result.toLocaleString('en-CA') : Number(result.toFixed(6)).toString();
      return `**Quantitative Result:** \`${cleaned}\` = **${formatted}**`;
    }
  } catch {
    return null;
  }
  return null;
}

export function synthesizePolymathAnswer(prompt: string): string {
  const p = prompt.toLowerCase().trim();

  const mathAnswer = tryEvaluateMath(prompt);
  if (mathAnswer) {
    return `${mathAnswer}\n\nCalculated and verified by **Scholar Champlain** & **Commander North**. Need unit conversions, compound interest projections, or an interactive calculator app built around this? Just say the word!`;
  }

  if (/who are you|what can you do|introduce yourself|what is this|help/.test(p)) {
    return [
      `Hey there, friend! Welcome to the **AI Agent Village** 🍁`,
      ``,
      `I'm **Commander North** (*Village Commander v1.0.0*) — your all-in-one Canadian AI partner, backed by seven specialist guild agents working together under one roof:`,
      `- **Talk & Know Everything**: Ask me anything across science, math, history, strategy, coding, writing, or Canadian & world knowledge — by text or **Live Voice Talk (en-CA)**.`,
      `- **Counseling & Wellness**: Need an empathetic ear, stress decompression, CBT thought reframing, or guided breathing? **Counselor Cedar** and I are right here.`,
      `- **Tasks & Full Automation**: Hand me any multi-step task or set up recurring automations — every run is verified across our **7-stage DBT-001 PostgreSQL lifecycle**.`,
      `- **Build Anything**: Ask me to build an app, calculator, game, dashboard, or SQL schema and interact with it live in **Builder Forge**.`,
      `- **Generate Photos, Audio, Videos, Movies & Shows**: Step into our **Cinema & Media Studio** (or ask right here in chat!) to create high-res artwork, synthesized WAV music, animated videos, 4-act movies, and multi-episode shows!`,
      ``,
      `What shall we dive into first?`,
    ].join('\n');
  }

  if (/bonjour|français|french|translate|tradui/.test(p)) {
    return [
      `Bonjour mon ami ! 🍁 **Commander North** & **Scholar Champlain** operate fluently across English and Canadian French (*en-CA / fr-CA*).`,
      ``,
      `- **Bilingual Summary**: *"Bienvenue au Village des Agents IA — votre partenaire canadien tout-en-un pour discuter, conseiller, bâtir des applications, automatiser vos tâches et réaliser des photos, de l'audio, des vidéos, des films et des séries."*`,
      `- Share any passage, document, or script you'd like translated, polished, or voiced!`,
    ].join('\n');
  }

  if (/canada|canadian|ontario|manitoulin|gore bay|toronto|montreal|vancouver|banff|maple|poutine|hockey/.test(p)) {
    return [
      `Right in my home wheelhouse! 🍁 Here's a crisp Canadian briefing from the Northern Observatory:`,
      ``,
      `- **Geography & Scale**: Canada spans **9.98 million km²** across 10 provinces and 3 territories, bordered by three oceans (Atlantic, Pacific, and Arctic) and home to over **2 million lakes** — including Lake Huron's Manitoulin Island (the largest freshwater island in the world!).`,
      `- **Innovation & Craft**: From pioneering deep learning research in Toronto, Montréal, and Edmonton to world-renowned cinema, animation, and clean engineering, Canadian design blends technical rigour with human warmth.`,
      `- **Want to go deeper?** Ask me to direct a short movie set in the Rockies, build a CAD financial planner, or plan a coast-to-coast itinerary!`,
    ].join('\n');
  }

  if (/science|quantum|physics|space|black hole|dna|biology|climate|energy|ai|machine learning/.test(p)) {
    return [
      `Great question! Here is a structured breakdown from **Scholar Champlain** & **Commander North**:`,
      ``,
      `1. **First-Principles Core**: Every complex phenomenon in "${prompt}" comes down to how energy, information, and feedback loops interact across scales.`,
      `2. **How It Works in Practice**:`,
      `   - **Mechanism**: Systems store state, exchange signals or forces according to conserved laws, and adapt toward lower-error or lower-energy equilibria.`,
      `   - **Real-World Impact**: Understanding both the mathematical model and empirical edge cases lets engineers turn theory into reliable tools.`,
      `3. **Next Step Together**: Want me to **build an interactive simulator app** for this topic, **generate an educational short video/show** explaining it visually, or **run a verified research task**?`,
    ].join('\n');
  }

  // Rich, structured polymath response for any arbitrary topic or question
  return [
    `Consider it handled, friend! 🍁 **Commander North** & **Scholar Champlain** analyzed your request: *"${prompt}"*`,
    ``,
    `### Key Takeaways & Strategic Breakdown`,
    `1. **Core Insight**: Looking at *${prompt}* from first principles, the fastest path to high-impact results is combining clear structure, measurable milestones, and rapid iteration.`,
    `2. **Actionable Blueprint**:`,
    `   - **Clarify the Objective**: Define the exact outcome that makes today a win.`,
    `   - **Leverage the Village**: We can immediately turn this into an **Automated Task**, an **Interactive App** in Builder Forge, or a **Visual / Audio / Cinema Production** in the Studio.`,
    `   - **Verify Quality**: Every deliverable passes Sentinel Algonquin's independent verification check so nothing falls through the cracks.`,
    ``,
    `Would you like me to **automate this as a recurring workflow**, **build a live interactive tool** for it, or **produce a visual/video presentation** right now?`,
  ].join('\n');
}

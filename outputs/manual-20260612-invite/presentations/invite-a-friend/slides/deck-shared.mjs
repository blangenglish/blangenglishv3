const C = {
  navy: "#12304A",
  blue: "#2477C8",
  sky: "#DCEEFF",
  mint: "#DDF4EA",
  green: "#168C64",
  amber: "#FFE8A3",
  gold: "#D28A00",
  coral: "#FFDDD2",
  red: "#D95252",
  paper: "#F8FAFC",
  white: "#FFFFFF",
  ink: "#182534",
  gray: "#607080",
  line: "#C9D5DF",
};

function rect(ctx, slide, x, y, w, h, fill, radius = false, line = null, name) {
  return ctx.addShape(slide, {
    x, y, w, h, fill, name,
    geometry: radius ? "roundRect" : "rect",
    line: line || ctx.line("#00000000", 0),
  });
}

function text(ctx, slide, value, x, y, w, h, size = 24, color = C.ink, bold = false, align = "left", valign = "top", name) {
  return ctx.addText(slide, {
    text: value, x, y, w, h, fontSize: size, color, bold, align, valign, name,
    typeface: bold ? "Aptos Display" : "Aptos",
    insets: { left: 4, right: 4, top: 3, bottom: 3 },
  });
}

function base(presentation, ctx, kicker, title, stage) {
  const slide = presentation.slides.add();
  rect(ctx, slide, 0, 0, 1280, 720, C.paper);
  rect(ctx, slide, 0, 0, 1280, 116, C.navy);
  rect(ctx, slide, 0, 116, 1280, 7, C.blue);
  rect(ctx, slide, 30, 28, 10, 11, C.blue, true, null, "kicker-marker");
  text(ctx, slide, kicker, 48, 20, 650, 27, 18, "#9CCBFA", true, "left", "middle", "kicker-label");
  text(ctx, slide, title, 48, 49, 1120, 56, 36, C.white, true, "left", "middle");
  text(ctx, slide, String(stage).padStart(2, "0"), 1172, 28, 60, 60, 24, C.white, true, "center", "middle");
  text(ctx, slide, "ACTIVE EXPERIMENTATION", 48, 684, 320, 20, 13, C.gray, true);
  return slide;
}

function stepTag(ctx, slide, n, label, x, y, color = C.blue) {
  rect(ctx, slide, x, y, 62, 62, color, true);
  text(ctx, slide, String(n), x, y + 1, 62, 59, 28, C.white, true, "center", "middle");
  text(ctx, slide, label, x + 78, y + 4, 300, 50, 23, C.navy, true, "left", "middle");
}

function footerLine(ctx, slide) {
  rect(ctx, slide, 48, 665, 1184, 2, C.line);
}

export async function makeSlide(index, presentation, ctx) {
  if (index === 1) {
    const slide = presentation.slides.add();
    rect(ctx, slide, 0, 0, 1280, 720, C.navy);
    rect(ctx, slide, 0, 0, 22, 720, C.blue);
    text(ctx, slide, "ACTIVE EXPERIMENTATION", 72, 62, 520, 28, 20, "#9CCBFA", true);
    text(ctx, slide, "✉️", 72, 132, 110, 110, 68, C.white, false, "center", "middle");
    text(ctx, slide, "INVITE A FRIEND\nTO YOUR CITY", 190, 126, 930, 150, 54, C.white, true, "left", "middle");
    rect(ctx, slide, 72, 322, 1136, 264, C.white, true);
    text(ctx, slide, "🎯  OBJECTIVE", 112, 356, 420, 40, 27, C.blue, true);
    const objectives = ["Describe places", "Ask questions", "Share real experiences"];
    objectives.forEach((item, i) => {
      rect(ctx, slide, 112, 426 + i * 50, 18, 18, [C.blue, C.green, C.gold][i], true);
      text(ctx, slide, item, 150, 414 + i * 50, 760, 42, 27, C.ink, true, "left", "middle");
    });
    text(ctx, slide, "REAL PLACES  •  REAL QUESTIONS  •  REAL CONNECTION", 72, 650, 900, 26, 17, "#9CCBFA", true);
    return slide;
  }

  if (index === 2) {
    const slide = base(presentation, ctx, "WARM-UP", "GUESS THE PLACE 🔍", 1);
    const xs = [48, 448, 848];
    const fills = [C.sky, C.amber, C.mint];
    const icons = ["👂", "✏️", "👀"];
    const heads = ["STEP 1 — LISTEN", "STEP 2 — WRITE", "STEP 3 — SHOW"];
    const bodies = [
      "Teacher describes:\n\n“It is noisy.\nPeople are eating.\nIt is small.”",
      "Write your answer.\n\n👉 Do NOT say it.",
      "Reveal together.\n\n👉 restaurant 🍽",
    ];
    xs.forEach((x, i) => {
      rect(ctx, slide, x, 165, 350, 360, fills[i], true);
      text(ctx, slide, icons[i], x + 20, 185, 62, 62, 40, C.ink, false, "center", "middle");
      text(ctx, slide, heads[i], x + 86, 190, 240, 50, 22, C.navy, true, "left", "middle");
      text(ctx, slide, bodies[i], x + 26, 270, 298, 220, i === 0 ? 23 : 25, C.ink, i > 0, "left", "top");
    });
    rect(ctx, slide, 170, 558, 940, 74, C.navy, true);
    text(ctx, slide, "💬  TEACHER SAYS   “You are connecting adjectives, places, and actions.”", 198, 572, 884, 46, 22, C.white, true, "center", "middle");
    footerLine(ctx, slide);
    return slide;
  }

  if (index === 3) {
    const slide = base(presentation, ctx, "PROJECT STEP 1", "MY PLACES 🗺", 2);
    stepTag(ctx, slide, 1, "CREATE A MAP", 56, 158);
    text(ctx, slide, "Write 5 places you like:", 56, 238, 470, 42, 27, C.ink, true);
    const places = [["park", "🌳"], ["café", "☕"], ["gym", "🏋️"], ["neighborhood", "🏙"], ["university", "🎓"]];
    const positions = [[56, 315], [416, 315], [776, 315], [236, 470], [656, 470]];
    places.forEach(([p, e], i) => {
      const [x, y] = positions[i];
      rect(ctx, slide, x, y, i > 2 ? 360 : 320, 112, i % 2 ? C.mint : C.sky, true);
      text(ctx, slide, e, x + 18, y + 20, 72, 72, 42, C.ink, false, "center", "middle");
      text(ctx, slide, p, x + 104, y + 25, i > 2 ? 230 : 190, 60, 26, C.navy, true, "left", "middle");
    });
    footerLine(ctx, slide);
    return slide;
  }

  if (index === 4) {
    const slide = base(presentation, ctx, "PROJECT STEP 1", "ADD DETAILS ✏️", 3);
    stepTag(ctx, slide, 2, "ADD INFORMATION", 56, 150, C.green);
    text(ctx, slide, "For EACH place:", 56, 232, 330, 42, 25, C.ink, true);
    rect(ctx, slide, 56, 290, 420, 72, C.sky, true);
    text(ctx, slide, "👉  2 adjectives (opposites)", 78, 306, 376, 40, 24, C.navy, true, "left", "middle");
    rect(ctx, slide, 56, 382, 420, 72, C.mint, true);
    text(ctx, slide, "👉  1 action", 78, 398, 376, 40, 24, C.navy, true, "left", "middle");
    rect(ctx, slide, 540, 158, 670, 360, C.white, true, ctx.line(C.line, 2));
    text(ctx, slide, "EXAMPLE", 578, 188, 180, 30, 18, C.blue, true);
    text(ctx, slide, "Café ☕", 578, 232, 540, 58, 36, C.navy, true);
    text(ctx, slide, "cozy", 578, 316, 150, 62, 28, C.green, true, "center", "middle");
    text(ctx, slide, "–", 738, 316, 50, 62, 28, C.gray, true, "center", "middle");
    text(ctx, slide, "noisy", 798, 316, 150, 62, 28, C.red, true, "center", "middle");
    rect(ctx, slide, 578, 406, 580, 70, C.navy, true);
    text(ctx, slide, "People are drinking coffee.", 598, 419, 540, 44, 25, C.white, true, "center", "middle");
    rect(ctx, slide, 180, 555, 920, 70, C.amber, true);
    text(ctx, slide, "💬  TEACHER SAYS   “Places can be different at different times.”", 200, 568, 880, 44, 22, C.ink, true, "center", "middle");
    footerLine(ctx, slide);
    return slide;
  }

  if (index === 5) {
    const slide = base(presentation, ctx, "PROJECT STEP 2", "SPEAK FIRST 🗣", 4);
    stepTag(ctx, slide, 3, "WORK IN PAIRS", 56, 150, C.blue);
    text(ctx, slide, "Talk about 2 places", 56, 228, 400, 44, 27, C.ink, true);
    rect(ctx, slide, 56, 304, 556, 275, C.sky, true);
    text(ctx, slide, "💬  SAY", 84, 330, 180, 38, 22, C.blue, true);
    text(ctx, slide, "My café is cozy but noisy.\n\nPeople are drinking coffee.", 84, 388, 500, 150, 27, C.navy, true);
    rect(ctx, slide, 668, 304, 556, 275, C.mint, true);
    text(ctx, slide, "❓  PARTNER ASKS", 696, 330, 270, 38, 22, C.green, true);
    text(ctx, slide, "Are people working there?\n\nIs it busy?", 696, 388, 500, 150, 27, C.navy, true);
    rect(ctx, slide, 390, 602, 500, 54, C.navy, true);
    text(ctx, slide, "✅  Speak first  →  THEN write", 410, 611, 460, 36, 23, C.white, true, "center", "middle");
    return slide;
  }

  if (index === 6) {
    const slide = base(presentation, ctx, "PROJECT STEP 3", "WRITE THE EMAIL ✉️", 5);
    stepTag(ctx, slide, 4, "WRITE", 56, 144, C.green);
    text(ctx, slide, "Follow this structure:", 56, 215, 430, 40, 24, C.ink, true);
    const items = [
      ["Greeting", "Hi [Name],"],
      ["Describe places", "There is a café near my house."],
      ["Personal feeling", "I love this place because it is relaxing."],
      ["Actions", "People are drinking coffee and talking."],
      ["Questions (3)", "What places do you like?  •  Are people relaxing there?  •  Is it busy or quiet?"],
      ["Invitation", "Next time you come, we can go together."],
    ];
    items.forEach(([head, body], i) => {
      const y = 274 + i * 61;
      const fill = i % 2 === 0 ? C.white : "#EEF4F8";
      rect(ctx, slide, 56, y, 1168, 51, fill, true, ctx.line(i === 5 ? C.blue : "#00000000", i === 5 ? 2 : 0));
      text(ctx, slide, "✅ " + head, 72, y + 12, 245, 27, 20, i === 5 ? C.blue : C.navy, true, "left", "middle");
      text(ctx, slide, body, 328, y + 10, 870, 29, i === 4 ? 18 : 20, C.ink, i === 5, "left", "middle");
    });
    return slide;
  }

  if (index === 7) {
    const slide = base(presentation, ctx, "OPTIONAL", "SHARE 📢", 6);
    stepTag(ctx, slide, 5, "READ", 56, 156, C.blue);
    rect(ctx, slide, 56, 254, 500, 290, C.navy, true);
    text(ctx, slide, "🗣", 88, 292, 95, 95, 56, C.white, false, "center", "middle");
    text(ctx, slide, "Share your email", 190, 306, 320, 66, 32, C.white, true, "left", "middle");
    text(ctx, slide, "Read clearly.\nSpeak slowly.", 88, 420, 420, 90, 25, "#C9E5FF", true);
    rect(ctx, slide, 620, 254, 604, 132, C.mint, true);
    text(ctx, slide, "✅", 646, 286, 64, 64, 38, C.green, false, "center", "middle");
    text(ctx, slide, "Listen to others", 726, 294, 450, 50, 28, C.navy, true, "left", "middle");
    rect(ctx, slide, 620, 412, 604, 132, C.amber, true);
    text(ctx, slide, "✅", 646, 444, 64, 64, 38, C.gold, false, "center", "middle");
    text(ctx, slide, "Choose your favorite place", 726, 438, 450, 76, 27, C.navy, true, "left", "middle");
    footerLine(ctx, slide);
    return slide;
  }

  if (index === 8) {
    const slide = base(presentation, ctx, "ASSESSMENT", "WE CHECK ✅", 7);
    const rows = [
      ["🟢", "DESCRIPTION", "adjectives", C.mint, C.green],
      ["🟡", "ACTIONS", "present continuous", C.amber, C.gold],
      ["🔵", "QUESTIONS", "clear and correct", C.sky, C.blue],
    ];
    rows.forEach(([dot, head, body, fill, accent], i) => {
      const y = 170 + i * 126;
      rect(ctx, slide, 72, y, 1136, 98, fill, true);
      text(ctx, slide, dot, 94, y + 18, 68, 62, 34, accent, false, "center", "middle");
      text(ctx, slide, head, 184, y + 19, 330, 58, 24, accent, true, "left", "middle");
      text(ctx, slide, body, 536, y + 19, 620, 58, 29, C.navy, true, "left", "middle");
    });
    rect(ctx, slide, 260, 574, 760, 64, C.navy, true);
    text(ctx, slide, "✅ Focus on meaning     ✅ Mistakes are OK", 282, 586, 716, 40, 23, C.white, true, "center", "middle");
    footerLine(ctx, slide);
    return slide;
  }

  const slide = base(presentation, ctx, "REFLECTION", "REFLECTION 🧠", 8);
  stepTag(ctx, slide, 6, "ANSWER", 56, 156, C.green);
  rect(ctx, slide, 56, 278, 548, 250, C.sky, true);
  rect(ctx, slide, 84, 304, 64, 64, C.blue, true);
  text(ctx, slide, "1", 84, 304, 64, 64, 32, C.white, true, "center", "middle");
  text(ctx, slide, "What was easy\nto describe?", 176, 318, 380, 112, 32, C.navy, true, "left", "middle");
  rect(ctx, slide, 676, 278, 548, 250, C.mint, true);
  rect(ctx, slide, 704, 304, 64, 64, C.green, true);
  text(ctx, slide, "2", 704, 304, 64, 64, 32, C.white, true, "center", "middle");
  text(ctx, slide, "What was\ndifficult?", 796, 318, 380, 112, 32, C.navy, true, "left", "middle");
  text(ctx, slide, "💬  Share one answer with a partner.", 328, 580, 624, 50, 25, C.ink, true, "center", "middle");
  footerLine(ctx, slide);
  return slide;
}

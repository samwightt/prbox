import { execSync } from "child_process";

export const kaomojiFaces = [
  "(◕‿◕)",
  "(◕ᴗ◕)",
  "(◠‿◠)",
  "(•‿•)",
  "(^‿^)",
  "(≧◡≦)",
  "(≧▽≦)",
  "(´▽`)",
  "(^ω^)",
  "(・ω・)",
  "(°▽°)",
  "(^０^)",
  "(´• ω •`)",
  "( ´ ▽ ` )",
  "(*^▽^*)",
  "(✧ω✧)",
  "(☆▽☆)",
  "(⌒‿⌒)",
  "(◍•ᴗ•◍)",
  "(｡◕‿◕｡)",
  "(＾▽＾)",
  "(´∀`)",
  "(｡♥‿♥｡)",
  "(◕△◕)",
  "(＞ω＜)",
  "(*≧∀≦*)",
  "(´꒳`)",
  "(•̀ᴗ•́)",
  "(｀・ω・´)",
  "(◕‿◕✿)",
  "(✿◠‿◠)",
  "(◠ᴗ◠)",
  "(ᵔᴗᵔ)",
  "(◕ω◕)",
  "(^◡^)",
  "(´◡`)",
  "(◠ω◠)",
  "(˘▽˘)",
  "(◕‿◕)",
  "(*´▽`*)",
  "(´ω`)",
  "(＾◡＾)",
  "(✪ω✪)",
  "(★ω★)",
  "(●´∀`●)",
  "(○´∀`○)",
  // cat faces
  "(=^･ω･^=)",
  "(^•ω•^)",
  "(=①ω①=)",
  "(^･ｪ･^)",
  "( =ω=)",
  // bear faces
  "(ʘᴗʘ)",
  "(ᵔᴥᵔ)",
  "(・ᴥ・)",
  "ʕ•ᴥ•ʔ",
  // unique faces
  "꒰ᐢ. .ᐢ꒱",
  "( ˶ˆᗜˆ˵ )",
  "(｡•̀ᴗ-)✧",
  "(ノ´ヮ`)ノ",
  "(๑˃̵ᴗ˂̵)",
  "(⁀ᗢ⁀)",
  "(ㅅ´ ˘ `)",
  "( ´͈ ᵕ `͈ )",
  "(◦ˉ ˘ ˉ◦)",
  "(´・ᴗ・`)",
];

// [leftEye, rightEye] pairs for generating faces
export const kaomojiEyePairs = [
  ["◕", "◕"],
  ["^", "^"],
  ["•", "•"],
  ["◠", "◠"],
  ["≧", "≦"],
  [">", "<"],
  ["＞", "＜"],
  ["´", "`"],
  ["°", "°"],
  ["✧", "✧"],
  ["★", "★"],
  ["☆", "☆"],
  ["ᵔ", "ᵔ"],
  ["˘", "˘"],
  ["・", "・"],
  ["ˊ", "ˋ"],
  ["'", "'"],
  ["˃", "˂"],
  ["＾", "＾"],
  ["●", "●"],
  ["◣", "◢"]
];

export const kaomojiMouths = [
  "‿",
  "ω",
  "▽",
  "◡",
  "ᴗ",
  "_",
  "∀",
  "ᗜ",
  "꒳",
  "ヮ",
  "ェ",
  "ᴥ",
  "△",
  "⌒",
  "ー",
];

export const kaomojiLeftArms = [
  "ヾ",
  "ヽ",
  "٩",
  "\\",
  "~",
  "o",
];

export const kaomojiRightArms = [
  "/",
  "ノ",
  "ﾉ",
  "ノﾞ",
  "ゝ",
  "っ",
  "つ",
  "ゞ",
  "づ",
  "b",
  "o",
];

export const kaomojiAccents = [
  "✧",
  "☆",
  "♡",
  "♪",
  "~",
  "*",
  "°",
  "･ﾟ✧",
  "☆ﾟ.",
  "♬",
  "✿",
  "❀",
  "✾",
  "☀",
  "⋆",
  "･₊✧",
  "˚✧",
  "ﾟ+.",
  "｡ﾟ",
  "♥",
  "❤",
  "★",
  "·",
  "◦",
  "♫",
  "⁺",
  // longer ones
  "*:･ﾟ✧",
  "･ﾟ✧･:*",
  "☆ﾟ.*･｡ﾟ",
  "✧･ﾟ:*✧",
  "♡˚₊",
  "⋆˚✿˖°",
  "･ﾟ･✧",
  "｡☆",
  "°˖✧",
  ":･ﾟ☆",
  "˚ʚ♡ɞ˚",
  "⋆⁺₊⋆",
  "✧˖°",
  "･:*:･",
  "♪♫♪",
];

export const greetings = [
  "Hello, <name>!",
  "Hi, <name>!",
  "Hey <name>!",
  "Howdy, <name>!",
  "Hi there, <name>!",
  "Good to see you, <name>!",
  "Welcome back, <name>!",
  "Hey there, <name>!",
  "What's up, <name>?",
  "Hiya, <name>!",
  "Greetings, <name>!",
  "Yo, <name>!",
  "Nice to see you, <name>!",
  "There you are, <name>!",
  "Look who it is, <name>!",
  "Oh hi, <name>!",
  "Hey hey, <name>!",
  "Well hello, <name>!",
  "Ahoy, <name>!",
  "Heyo, <name>!",
  "Sup, <name>!",
  "G'day, <name>!",
  "Aloha, <name>!",
  "Bonjour, <name>!",
  "Hola, <name>!",
  "Ciao, <name>!",
  "Salutations, <name>!",
  "Konnichiwa, <name>!",
  "Guten tag, <name>!",
  "Namaste, <name>!",
  "Ni hao, <name>!",
  "Annyeong, <name>!",
  "Sawadee, <name>!",
  "Shalom, <name>!",
  "Merhaba, <name>!",
  "Jambo, <name>!",
  "Hej, <name>!",
  "Hei, <name>!",
  "Olá, <name>!",
  "Privyet, <name>!",
  "Szia, <name>!",
  "Ahoj, <name>!",
  "Saluton, <name>!",
  "Xin chào, <name>!",
  "Salam, <name>!",
  "Yassou, <name>!",
  "Top of the morning, <name>!",
  "Waddup, <name>!",
  "Howdy-do, <name>!",
  "Yooo, <name>!",
  "What's good, <name>?",
  "How's it going, <name>?",
  "Good morning, <name>!",
  "Good evening, <name>!",
  "Rise and shine, <name>!",
  "Hey buddy!",
  "Well well well, <name>!",
  "Oh hey, <name>!",
  "Why hello there, <name>!",
  "Fancy seeing you here, <name>!",
  "Long time no see, <name>!",
  "Back again, <name>?",
  "Ready to go, <name>?",
  "Let's do this, <name>!",
  "Here we go, <name>!",
  "Alrighty, <name>!",
];

export const loadingVerbs = [
  "Fetching",
  "Loading",
  "Getting",
  "Grabbing",
  "Checking",
  "Rounding up",
  "Looking for",
  "Finding",
  "Gathering",
  "Collecting",
  "Pulling up",
  "Hunting down",
  "Scooping up",
  "Wrangling",
  "Summoning",
  "Retrieving",
  "Scanning for",
  "Digging up",
  "Locating",
  "Tracking down",
  "Rustling up",
  "Corralling",
  "Herding",
  "Assembling",
  "Compiling",
  "Preparing",
  "Acquiring",
  "Obtaining",
  "Procuring",
  "Securing",
  "Chasing down",
  "Sniffing out",
  "Unearthing",
  "Uncovering",
  "Excavating",
  "Mining",
  "Harvesting",
  "Reeling in",
  "Hauling in",
  "Drumming up",
  "Whipping up",
  "Cooking up",
  "Brewing up",
  "Conjuring",
  "Manifesting",
  "Materializing",
  "Beaming up",
  "Downloading",
  "Syncing",
  "Refreshing",
  "Spinning up",
  "Warming up",
  "Queuing up",
  "Lining up",
  "Stacking up",
  "Piling up",
  "Bundling up",
  "Wrapping up",
  "Picking up",
  "Snagging",
  "Nabbing",
  "Catching",
  "Seizing",
  "Capturing",
  "Bagging",
  "Netting",
  "Trapping",
  "Lassoing",
  "Hooking",
  "Spearing",
  "Plucking",
  "Cherry-picking",
  "Handpicking",
  "Selecting",
  "Curating",
  "Sourcing",
  "Importing",
  "Extracting",
  "Distilling",
  "Filtering",
  "Sifting through",
  "Sorting through",
  "Combing through",
  "Rifling through",
  "Rummaging through",
  "Poking around for",
  "Scrounging up",
  "Foraging for",
  "Scavenging",
  "Pillaging",
];

export const loadingNouns = [
  "notifications",
  "notifs",
  "updates",
  "alerts",
  "messages",
  "pings",
  "PRs",
  "pull requests",
  "reviews",
  "mentions",
  "inbox",
  "stuff",
  "things",
  "items",
  "goodies",
];

export const farewellBases = [
  // English - with <time> placeholder where it makes sense
  "Bye",
  "Goodbye",
  "See ya <time>",
  "Later",
  "Toodles",
  "Peace out",
  "Take care",
  "Catch ya <time>",
  "Farewell",
  "So long",
  "Bye bye",
  "Cheerio",
  "Ta-ta",
  "Laters",
  "Be seeing you",
  "Stay cool",
  "Keep it real",
  "Have a good one",
  "Peace",
  "Later gator",
  "Smell ya later",
  "Gotta bounce",
  "I'm out",
  "Deuces",
  "Godspeed",
  "Safe travels",
  "Buh-bye",
  "TTFN",
  "Pip pip",
  "Cheers",
  "All the best",
  "Take it easy",
  "Talk to you <time>",
  "Until <time>",
  // Spanish
  "Adios",
  "Hasta la vista",
  "Hasta luego",
  "Nos vemos <time>",
  "Chao",
  // French
  "Au revoir",
  "Salut",
  "À bientôt",
  "À plus",
  // Italian
  "Ciao",
  "Arrivederci",
  "Addio",
  // German
  "Auf Wiedersehen",
  "Tschüss",
  "Bis bald",
  "Mach's gut",
  // Portuguese
  "Tchau",
  "Até logo",
  "Até mais",
  // Dutch
  "Tot ziens",
  "Doei",
  "Tot zo",
  // Japanese
  "Sayonara",
  "Ja ne",
  "Mata ne",
  // Korean
  "Annyeong",
  "Jal ga",
  // Chinese
  "Zàijiàn",
  "Bàibài",
  // Hawaiian
  "Aloha",
  "A hui hou",
  // Russian
  "Poka",
  "Do svidaniya",
  // Arabic
  "Ma'a salama",
  "Yalla bye",
  // Hindi
  "Alvida",
  "Phir milenge",
  // Swahili
  "Kwaheri",
  // Greek
  "Antio",
  "Yassou",
  // Turkish
  "Hoşça kal",
  "Görüşürüz",
  // Polish
  "Cześć",
  "Do widzenia",
  "Pa pa",
  // Swedish
  "Hej då",
  "Vi ses",
  // Finnish
  "Näkemiin",
  "Moi moi",
  // Norwegian
  "Ha det",
  "Vi snakkes",
  // Danish
  "Farvel",
  "Vi ses",
  // Irish
  "Slán",
  // Welsh
  "Hwyl fawr",
  // Maori
  "Ka kite",
  // Thai
  "La gon",
  // Vietnamese
  "Tạm biệt",
  // Indonesian
  "Sampai jumpa",
  "Dadah",
  // Filipino
  "Paalam",
];

export const farewellTimes = [
  "later",
  "soon",
  "tomorrow",
  "next time",
  "in a bit",
  "around",
];

export const farewellEncouragements = [
  "You crushed it!",
  "Great work!",
  "You're awesome!",
  "Keep being amazing!",
  "You did great!",
  "Proud of you!",
  "You rock!",
  "Killing it!",
  "Nice job!",
  "Well done!",
  "You're a star!",
  "Keep it up!",
  "Nailed it!",
  "You're the best!",
  "Stay awesome!",
  "Go get 'em!",
  "You've got this!",
  "Keep shining!",
  "Legend!",
  "What a champ!",
  "Superstar!",
  "Way to go!",
  "Fantastic work!",
  "You're on fire!",
  "Boss moves!",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function getFirstName(): string {
  try {
    // Try git config first
    const gitName = execSync("git config --global user.name", { encoding: "utf-8" }).trim();
    if (gitName) {
      return gitName.split(" ")[0] ?? "friend";
    }
    // Fall back to macOS id -F
    const fullName = execSync("id -F", { encoding: "utf-8" }).trim();
    return fullName.split(" ")[0] ?? "friend";
  } catch {
    return "friend";
  }
}

function generateFace(): string {
  const [leftEye, rightEye] = pick(kaomojiEyePairs);
  const mouth = pick(kaomojiMouths);
  return `(${leftEye}${mouth}${rightEye})`;
}

export function randomKaomoji(): string {
  // 40% chance to generate a face, 60% to pick from list
  const face = Math.random() < 0.4 ? generateFace() : pick(kaomojiFaces);
  const roll = Math.random();

  // 30% left only, 45% right only, 25% both
  const includeLeftArm = roll < 0.3 || roll >= 0.75;
  const includeRightArm = roll >= 0.3;

  // 20% chance for each accent
  const includeLeftAccent = Math.random() < 0.2;
  const includeRightAccent = Math.random() < 0.2;

  let result = "";

  if (includeLeftAccent) {
    result += pick(kaomojiAccents);
  }

  if (includeLeftArm) {
    result += pick(kaomojiLeftArms);
  }

  result += face;

  if (includeRightArm) {
    result += pick(kaomojiRightArms);
  }

  if (includeRightAccent) {
    result += pick(kaomojiAccents);
  }

  return result;
}

export function randomGreeting(name: string): string {
  return pick(greetings).replace("<name>", name);
}

export function randomFarewell(name?: string): string {
  let message = pick(farewellBases);
  const includeEncouragement = Math.random() < 0.4;
  const includeName = name && Math.random() < 0.25;

  // Replace <time> placeholder with a random time phrase (50% chance), or remove it
  if (message.includes("<time>")) {
    if (Math.random() < 0.5) {
      message = message.replace("<time>", pick(farewellTimes));
    } else {
      message = message.replace(" <time>", "");
    }
  }

  if (includeName) {
    message += `, ${name}!`;
  } else {
    message += "!";
  }

  if (includeEncouragement) {
    message += ` ${pick(farewellEncouragements)}`;
  }

  return message;
}

export function randomLoadingMessage(): string {
  return `${pick(loadingVerbs)} your ${pick(loadingNouns)}...`;
}

export function randomLoadingText(name: string): string {
  return `${randomKaomoji()} ${randomGreeting(name)} ${randomLoadingMessage()}`;
}

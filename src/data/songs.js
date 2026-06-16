const L = (start, end, text, phonetic, chorus = false) => ({ start, end, text, phonetic, chorus });

export const songs = [
  {
    id: "blinding-lights", title: "Blinding Lights", artist: "The Weeknd",
    youtubeId: "4NRXx6U8ABQ", imported: false,
    lyrics: [
      L(2,   6,   "I can see the city lights tonight",      "Ái kan si de síti láits tunáit"),
      L(6.5, 10.5,"Walking down the empty street alone",    "Uókin dáun de émpti strit alóun"),
      L(11,  15,  "(Hold me close, don't let me go)",       "(Jóuld mi klóus, dont let mi góu)", true),
      L(15.5,19.5,"Every single moment feels so bright",   "Évri síngol móument fíls so bráit"),
      L(20,  24,  "I won't stop until the morning comes",  "Ái uont stap antíl de mórnin kams"),
      L(24.5,28.5,"(Hold me close, don't let me go)",      "(Jóuld mi klóus, dont let mi góu)", true),
      L(29,  33,  "And the night is finally ours",         "And de náit is fáinali áurs"),
    ],
  },
  {
    id: "shape", title: "Shape of You", artist: "Ed Sheeran",
    youtubeId: "JGwWNGJdvx8", imported: false,
    lyrics: [
      L(1,   5,   "We talk for hours every single day",    "Ui tok for áuers évri síngol déi"),
      L(5.5, 9.5, "Come and follow me into the dark",      "Kam and fólou mi íntu de dark"),
      L(10,  14,  "(I'm in love with the way you move)",   "(Áim in lov uíd de uéi yu muv)", true),
      L(14.5,18.5,"Hold my hand and dance the night away", "Jóuld mái jand and dans de náit auéi"),
      L(19,  23,  "Every little thing about you shines",   "Évri lítol zing abáut yu sháins"),
    ],
  },
  {
    id: "perfect", title: "Perfect Night", artist: "Mi lista · ES",
    youtubeId: "2Vv-BfVoq4g", imported: true,
    lyrics: [
      L(1,   5,   "Tonight we dance under the moon",       "Tunáit ui dans ánder de mun"),
      L(5.5, 9.5, "Your smile lights up the room",         "Yor smáil láits ap de rum"),
      L(10,  14,  "(Stay with me until the dawn)",         "(Stéi uíd mi antíl de don)", true),
      L(14.5,18.5,"This feels just like a perfect dream",  "Dis fíls yost láik a pérfect drim"),
    ],
  },
  {
    id: "stars", title: "Counting Stars", artist: "OneRepublic",
    youtubeId: "hT_nvWreIhg", imported: true,
    lyrics: [
      L(1,   5,   "Lately I've been losing sleep",         "Léitli áiv bin lúsin slip"),
      L(5.5, 9.5, "Dreaming about the things we keep",     "Drímin abáut de zings ui kip"),
      L(10,  14,  "(Counting all the stars above)",        "(Káuntin ol de stars abóv)", true),
      L(14.5,18.5,"We'll be alright, just hold on tight",  "Uil bi olráit, yost jóuld on táit"),
    ],
  },
  {
    id: "famous-last-words", title: "Famous Last Words", artist: "My Chemical Romance",
    youtubeId: "8bbTtPL1jRs", imported: false,
    lyrics: [
      // Verse 1
      L(7,   12,  "Now, I know that I can't make you stay, but where's your heart?",          "Náu, Ái nóu dat Ái kant méik yu stéi, bat uérs yor jart?"),
      L(13,  18,  "And I know there's nothing I can say to change that part",                 "And Ái nóu ders názing Ái kan séi tu chéinch dat part"),
      // Pre-chorus
      L(29,  34,  "So many bright lights, they cast a shadow, but can I speak?",              "Sóu méni bráit láits, déi kast a shádou, bat kan Ái spik?"),
      L(34.5,38.5,"Well, is it hard understanding I'm incomplete?",                           "Uél, is it jard anderstánding Áim ínkomplit?"),
      L(39,  43,  "A life that's so demanding, I get so weak",                                "A láif dats sóu dimánding, Ái gét sóu uik"),
      L(43.5,47.5,"A love that's so demanding, I can't speak",                               "A láv dats sóu dimánding, Ái kant spik"),
      // Chorus 1
      L(48,  52,  "I am not afraid to keep on living",                                        "Ái am not afréid tu kip on líving", true),
      L(52.5,57,  "I am not afraid to walk this world alone",                                 "Ái am not afréid tu uók dis uórld alóun", true),
      L(57.5,62,  "Honey, if you stay, I'll be forgiven",                                     "Jáni, if yu stéi, Áil bi forguíven", true),
      L(62.5,67,  "Nothing you can say can stop me going home",                               "Názing yu kan séi kan stap mi góing jóum", true),
      // Verse 2
      L(68,  74,  "Can you see, my eyes are shining bright, 'cause I'm out here",             "Kan yu si, mái áis ar sháining bráit, kos Áim áut jir"),
      L(74.5,80,  "On the other side of a jet black hotel mirror, and I'm so weak",           "On di áder sáid of a chét blak jotél míror, and Áim sóu uik"),
      L(80.5,85,  "Is it hard understanding I'm incomplete?",                                 "Is it jard anderstánding Áim ínkomplit?"),
      L(85.5,90,  "A love that's so demanding, I get weak",                                   "A láv dats sóu dimánding, Ái gét uik"),
      // Chorus 2
      L(91,  95,  "I am not afraid to keep on living",                                        "Ái am not afréid tu kip on líving", true),
      L(95.5,100, "I am not afraid to walk this world alone",                                 "Ái am not afréid tu uók dis uórld alóun", true),
      L(100.5,105,"Honey, if you stay, I'll be forgiven",                                     "Jáni, if yu stéi, Áil bi forguíven", true),
      L(105.5,110,"Nothing you can say can stop me going home",                               "Názing yu kan séi kan stap mi góing jóum", true),
      // Bridge
      L(127,131,  "These bright lights have always blinded me",                               "Dis bráit láits jav ólueis bláinded mi"),
      L(131.5,136,"These bright lights have always blinded me, I say!",                       "Dis bráit láits jav ólueis bláinded mi, Ái séi!"),
      // Breakdown
      L(138,142,  "I see you lying next to me",                                               "Ái si yu láing nékst tu mi"),
      L(142.5,147,"With words I thought I'd never speak",                                     "Uid uórds Ái zot Áid néver spik"),
      L(147.5,152,"Awake and unafraid, asleep or dead",                                       "Auéik and anafréid, aslíp or dét"),
      L(153,157,  "'Cause I see you lying next to me",                                        "Kos Ái si yu láing nékst tu mi"),
      L(157.5,162,"With words I thought I'd never speak",                                     "Uid uórds Ái zot Áid néver spik"),
      L(162.5,167,"Awake and unafraid, asleep or dead",                                       "Auéik and anafréid, aslíp or dét"),
      // Final chorus
      L(183,187,  "I am not afraid to keep on living",                                        "Ái am not afréid tu kip on líving", true),
      L(187.5,192,"I am not afraid to walk this world alone",                                 "Ái am not afréid tu uók dis uórld alóun", true),
      L(192.5,197,"Honey, if you stay, I'll be forgiven",                                     "Jáni, if yu stéi, Áil bi forguíven", true),
      L(197.5,202,"Nothing you can say can stop me going home",                               "Názing yu kan séi kan stap mi góing jóum", true),
      L(203,207,  "I am not afraid to keep on living",                                        "Ái am not afréid tu kip on líving", true),
      L(207.5,212,"I am not afraid to walk this world alone",                                 "Ái am not afréid tu uók dis uórld alóun", true),
      L(212.5,217,"Honey, if you stay, I'll be forgiven",                                     "Jáni, if yu stéi, Áil bi forguíven", true),
      L(217.5,222,"Nothing you can say can stop me going home",                               "Názing yu kan séi kan stap mi góing jóum", true),
    ],
  },
];

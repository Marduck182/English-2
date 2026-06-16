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
];

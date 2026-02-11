export interface ArcanaCard {
  id: number;
  name: string;
  nameKr: string;
  meaning: string;
  keywords: string[];
}

export const MAJOR_ARCANA: ArcanaCard[] = [
  {
    id: 0,
    name: "The Fool",
    nameKr: "바보",
    meaning: "새로운 시작, 모험, 순수함, 자유로운 영혼",
    keywords: ["자유", "시작", "가능성", "순수"],
  },
  {
    id: 1,
    name: "The Magician",
    nameKr: "마법사",
    meaning: "창조력, 자신감, 의지, 능숙함",
    keywords: ["창조", "능력", "실행", "독창성"],
  },
  {
    id: 2,
    name: "The High Priestess",
    nameKr: "여사제",
    meaning: "직관, 신비, 지혜, 내면의 목소리",
    keywords: ["직관", "지혜", "신비", "통찰"],
  },
  {
    id: 3,
    name: "The Empress",
    nameKr: "여황제",
    meaning: "풍요, 모성, 자연, 예술적 감각",
    keywords: ["풍요", "사랑", "아름다움", "창조"],
  },
  {
    id: 4,
    name: "The Emperor",
    nameKr: "황제",
    meaning: "권위, 구조, 안정, 리더십",
    keywords: ["권위", "책임", "안정", "질서"],
  },
  {
    id: 5,
    name: "The Hierophant",
    nameKr: "교황",
    meaning: "전통, 가르침, 신념, 영적 지도자",
    keywords: ["전통", "지혜", "가르침", "신념"],
  },
  {
    id: 6,
    name: "The Lovers",
    nameKr: "연인",
    meaning: "사랑, 조화, 선택, 결합",
    keywords: ["사랑", "선택", "조화", "관계"],
  },
  {
    id: 7,
    name: "The Chariot",
    nameKr: "전차",
    meaning: "승리, 의지, 행동, 목표 달성",
    keywords: ["승리", "의지", "추진력", "도전"],
  },
  {
    id: 8,
    name: "Strength",
    nameKr: "힘",
    meaning: "내면의 힘, 인내, 용기, 포용",
    keywords: ["용기", "인내", "관용", "내면의 힘"],
  },
  {
    id: 9,
    name: "The Hermit",
    nameKr: "은둔자",
    meaning: "성찰, 고독, 탐구, 내면의 빛",
    keywords: ["성찰", "지혜", "탐구", "고독"],
  },
  {
    id: 10,
    name: "Wheel of Fortune",
    nameKr: "운명의 수레바퀴",
    meaning: "변화, 운명, 순환, 새로운 기회",
    keywords: ["운명", "변화", "기회", "흐름"],
  },
  {
    id: 11,
    name: "Justice",
    nameKr: "정의",
    meaning: "공정, 균형, 진실, 책임",
    keywords: ["정의", "균형", "진실", "판단"],
  },
  {
    id: 12,
    name: "The Hanged Man",
    nameKr: "매달린 사람",
    meaning: "희생, 새로운 관점, 인내, 깨달음",
    keywords: ["희생", "관점", "인내", "깨달음"],
  },
  {
    id: 13,
    name: "Death",
    nameKr: "죽음",
    meaning: "종결, 새로운 시작, 변화, 재탄생",
    keywords: ["변화", "종결", "재탄생", "이별"],
  },
  {
    id: 14,
    name: "Temperance",
    nameKr: "절제",
    meaning: "균형, 조화, 인내, 절제된 행동",
    keywords: ["조화", "균형", "절제", "치유"],
  },
  {
    id: 15,
    name: "The Devil",
    nameKr: "악마",
    meaning: "유혹, 속박, 욕망, 물질적 집착",
    keywords: ["욕망", "유혹", "집착", "본능"],
  },
  {
    id: 16,
    name: "The Tower",
    nameKr: "탑",
    meaning: "급격한 변화, 붕괴, 깨달음, 해방",
    keywords: ["변화", "충격", "해방", "재건"],
  },
  {
    id: 17,
    name: "The Star",
    nameKr: "별",
    meaning: "희망, 영감, 평온, 치유",
    keywords: ["희망", "영감", "치유", "비전"],
  },
  {
    id: 18,
    name: "The Moon",
    nameKr: "달",
    meaning: "불안, 환상, 직관, 잠재의식",
    keywords: ["직관", "상상", "불안", "꿈"],
  },
  {
    id: 19,
    name: "The Sun",
    nameKr: "태양",
    meaning: "성공, 기쁨, 활력, 긍정",
    keywords: ["성공", "기쁨", "활력", "긍정"],
  },
  {
    id: 20,
    name: "Judgement",
    nameKr: "심판",
    meaning: "부활, 소명, 각성, 새로운 판단",
    keywords: ["부활", "각성", "결단", "소명"],
  },
  {
    id: 21,
    name: "The World",
    nameKr: "세계",
    meaning: "완성, 통합, 성취, 완벽한 조화",
    keywords: ["완성", "성취", "통합", "여행"],
  },
];

export function calculateLifePathNumber(birthdate: string): ArcanaCard {
  // Remove non-digit characters just in case
  const cleanDate = birthdate.replace(/\D/g, "");
  
  if (cleanDate.length !== 8) {
     throw new Error("Invalid birthdate format. Expected 8 digits (YYYYMMDD).");
  }

  let sum = 0;
  // Initial sum of all digits
  for (const char of cleanDate) {
    sum += parseInt(char, 10);
  }

  // Reduce until <= 22
  while (sum > 22) {
    let tempSum = 0;
    const sumStr = sum.toString();
    for (const char of sumStr) {
      tempSum += parseInt(char, 10);
    }
    sum = tempSum;
  }

  // Special rule: 22 converts to 0 (The Fool)
  if (sum === 22) {
    sum = 0;
  }
  
  // Return the card object
  const card = MAJOR_ARCANA.find(c => c.id === sum);
  
  if (!card) {
      // Fallback, theoretically unreachable with current logic if sum <= 22 and 22->0
      return MAJOR_ARCANA[0];
  }
  
  return card;
}


import { GoogleGenAI, Type } from "@google/genai";
import { EQUIPMENT_STATS } from "../constants";
import { QuestRank } from "../types";

export const getMiningInsight = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Mining Questという動物たちを主人公にした採掘ゲームの、面白い『一言採掘アドバイス』を1つ、日本語で短く生成してください。ユーモアを交えて。",
    });
    
    const text = response.text;
    if (!text) {
      return "「深く掘るより、穴を掘るのが得意なんだワン！」";
    }
    return text.trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "「深く掘るより、穴を掘るのが得意なんだワン！」";
  }
};

const determineRarity = (type: 'Hero' | 'Equipment', minRarity: QuestRank = 'C'): QuestRank => {
  const rand = Math.random() * 100;
  
  // If minRarity is 'R', we only roll for R, E, L
  if (minRarity === 'R') {
    // Weights based on original ratios (R:15, E:4, L:1) -> Total 20
    // R: 75%, E: 20%, L: 5%
    if (rand < 75) return 'R';
    if (rand < 95) return 'E';
    return 'L';
  }

  if (type === 'Hero') {
    // Hero: C 50% / UC 30% / R 15% / E 4% / L 1%
    if (rand < 50) return 'C';
    if (rand < 80) return 'UC';
    if (rand < 95) return 'R';
    if (rand < 99) return 'E';
    return 'L';
  } else {
    // Equipment: C 55% / UC 28% / R 12% / E 4% / L 1%
    if (rand < 55) return 'C';
    if (rand < 83) return 'UC';
    if (rand < 95) return 'R';
    if (rand < 99) return 'E';
    return 'L';
  }
};

const determineEquipmentType = (): 'Pickaxe' | 'Helmet' | 'Boots' => {
  const rand = Math.random();
  if (rand < 0.3333) return 'Pickaxe';
  if (rand < 0.6666) return 'Helmet';
  return 'Boots';
};

export const generateGachaItem = async (type: 'Hero' | 'Equipment', forceRarity?: QuestRank) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 1. Determine Rarity Client-side
  const targetRarity = forceRarity || determineRarity(type);
  
  // 2. Determine Equipment Type Client-side if needed to ensure balance
  let targetEquipType: 'Pickaxe' | 'Helmet' | 'Boots' | undefined;
  if (type === 'Equipment') {
    targetEquipType = determineEquipmentType();
  }

  const heroSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "ヒーローの名前（動物らしい名前）" },
      species: { type: Type.STRING, enum: ["Dog", "Cat", "Bird", "Other"], description: "動物の種別" },
      trait: { type: Type.STRING, description: "特性の名前（例：厚い毛皮、警戒心、幸運など）" },
      damageReduction: { type: Type.INTEGER, description: "被ダメージ軽減率(%)。レアリティに合わせる (C:0-5, UC:5-8, R:8-12, E:12-20, L:20-30)" }
    },
    required: ["name", "species", "trait", "damageReduction"]
  };

  const equipSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "装備の名前" },
      type: { type: Type.STRING, enum: ["Pickaxe", "Helmet", "Boots"], description: "装備の種類" },
    },
    required: ["name", "type"]
  };

  let prompt = "";
  if (type === 'Hero') {
    prompt = `新しい採掘ヒーローを生成してください。レアリティは【${targetRarity}】です。種別は犬、猫、鳥、その他から。特性とダメージ軽減率もこのレアリティに合わせて設定してください。`;
  } else {
    prompt = `新しい採掘用装備を生成してください。レアリティは【${targetRarity}】です。種類は必ず【${targetEquipType}】（${targetEquipType === 'Pickaxe' ? 'ピッケル' : targetEquipType === 'Helmet' ? 'ヘルメット' : 'ブーツ'}）にしてください。名前もその種類にふさわしいものにしてください。`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: type === 'Hero' ? heroSchema : equipSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    
    const data = JSON.parse(text.trim());

    // Inject determined rarity
    data.rarity = targetRarity;

    // If Equipment, assign fixed stats based on generated rarity
    if (type === 'Equipment') {
       if (targetEquipType) {
         data.type = targetEquipType;
       }
       const eqType = data.type as keyof typeof EQUIPMENT_STATS;
       data.bonus = EQUIPMENT_STATS[eqType][targetRarity];
    }

    return data;

  } catch (error) {
    console.error("Gacha generation failed", error);
    // Fallback
    if (type === 'Hero') {
      return { 
        name: "名無しの採掘犬", 
        species: "Dog", 
        rarity: targetRarity, 
        trait: "平凡", 
        damageReduction: 2 
      };
    } else {
      const fallbackType = targetEquipType || "Pickaxe";
      return { 
        name: fallbackType === "Pickaxe" ? "鉄のつるはし" : fallbackType === "Helmet" ? "安全ヘルメット" : "作業用ブーツ", 
        type: fallbackType, 
        rarity: targetRarity, 
        bonus: EQUIPMENT_STATS[fallbackType][targetRarity] 
      };
    }
  }
};


import { GoogleGenAI, Type } from "@google/genai";

export const getMiningInsight = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Mining Questという犬のチワワを主人公にした採掘ゲームの、面白い『一言採掘アドバイス』を1つ、日本語で短く生成してください。ユーモアを交えて。",
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

export const generateGachaItem = async (type: 'Hero' | 'Equipment') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const heroSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "チワワの名前" },
      rarity: { type: Type.STRING, enum: ["Common", "Rare", "Epic", "Legendary"], description: "レアリティ" }
    },
    required: ["name", "rarity"]
  };

  const equipSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "装備の名前" },
      type: { type: Type.STRING, enum: ["Pickaxe", "Helmet", "Vest"], description: "装備の種類" },
      rarity: { type: Type.STRING, enum: ["Common", "Rare", "Epic", "Legendary"], description: "レアリティ" }
    },
    required: ["name", "type", "rarity"]
  };

  const prompt = type === 'Hero' 
    ? "新しいチワワのヒーローの名前とレアリティを生成してください。"
    : "新しい採掘用装備の名前と種類、レアリティを生成してください。";

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
    
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gacha generation failed", error);
    // Fallback in case of API error
    if (type === 'Hero') {
      return { name: "名無しのチワワ", rarity: "Common" };
    } else {
      return { name: "鉄のつるはし", type: "Pickaxe", rarity: "Common" };
    }
  }
};

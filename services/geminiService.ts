
import { GoogleGenAI } from "@google/genai";

export const getMiningInsight = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Mining Questという犬のチワワを主人公にした採掘ゲームの、面白い『一言採掘アドバイス』を1つ、日本語で短く生成してください。ユーモアを交えて。",
    });
    
    // Access the text property. It may be undefined if the response was blocked or empty.
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
  const prompt = type === 'Hero' 
    ? "新しいチワワのヒーローの名前とレアリティ(Common, Rare, Epic, Legendary)をJSON形式で生成して。プロパティは name と rarity です。"
    : "新しい採掘用装備の名前と種類(Pickaxe, Helmet, Vest)をJSON形式で生成して。プロパティは name と type です。";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Model returned an empty response.");
    }
    
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gacha generation failed", error);
    return null;
  }
};

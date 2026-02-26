#!/usr/bin/env node
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const modelsToTest = [
  'gemini-3-flash',
  'gemini-3.0-flash',
  'gemini-3-flash-preview',
  'gemini-3.0-flash-preview',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
];

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const start = Date.now();
    const result = await model.generateContent('Say "OK" in one word');
    const elapsed = Date.now() - start;
    const text = result.response.text().trim();
    console.log(`✅ ${modelName}: ${elapsed}ms - "${text.substring(0, 20)}"`);
    return { model: modelName, available: true, latency: elapsed };
  } catch (error) {
    console.log(`❌ ${modelName}: ${error.message.substring(0, 50)}`);
    return { model: modelName, available: false };
  }
}

async function main() {
  console.log('=== Gemini 모델 가용성 테스트 ===\n');

  for (const model of modelsToTest) {
    await testModel(model);
  }
}

main();

# Clarity — My First App: How I Used AI to Stop Guessing My Pool Chemicals

Hey there! Thanks for stopping by. 

This is the very first app I have ever built! I’m currently a student learning about artificial intelligence and data technology, and I wanted to build something real to test what I'm learning. 

I own an inground pool and got incredibly tired of the constant guesswork that comes with water maintenance[span_0](start_span)[span_0](end_span). Keeping track of free chlorine, pH, and alkalinity usually involves squinting at a plastic test strip bottle, trying to match fading colors, and doing annoying manual math to figure out how many ounces of chemicals to dump into the water[span_1](start_span)[span_1](end_span).

**Clarity changes that.** It’s a mobile-optimized web app that lets you snap a picture of your test strip, uses AI to read the chemical levels, and instantly does the math to tell you *exactly* how much of each chemical to add based on your pool's gallons[span_2](start_span)[span_2](end_span). 

Building this from scratch was a massive learning experience for me. I had to figure out how to make a visual layout, mathematical formulas, and a live AI assistant all talk to each other to solve a real-world problem[span_3](start_span)[span_3](end_span).

![Clarity App Demo](https://via.placeholder.com/800x450.png?text=Add+a+cool+screenshot+or+gif+of+your+app+here)

## 🏊‍♂️ What It Does (And Why I Built It This Way)

* **Camera-Based Scanning:** You can snap or upload a photo of a test strip right from your phone[span_4](start_span)[span_4](end_span). I hooked up a lightweight AI vision model (`claude-haiku`) to look at the photo and read the 6 core pool metrics for you[span_5](start_span)[span_5](end_span).
* **The "Different Brand" Bottle Problem:** I quickly realized that people use different brands of test strips, and the colors vary wildly[span_6](start_span)[span_6](end_span). To fix this, I built a custom **Strip Calibration** feature[span_7](start_span)[span_7](end_span). You can take photos of *any* brand’s color reference chart on the back of the bottle, and the app teaches the AI how to read that specific brand[span_8](start_span)[span_8](end_span).
* **Smart Math vs. AI Guesses:** AI can be notoriously unreliable at algebra. I didn't want the AI to guess chemical doses and ruin my pool liner. I isolated the logic by writing a standard JavaScript calculator code (`doseAdvice`) to handle the exact math based on pool size, using the AI strictly for conversational troubleshooting and advice[span_9](start_span)[span_9](end_span).
* **Maintenance Tracker:** Includes a built-in checklist for routine stuff like backwashing the filter, skimming, and checking equipment so you don't forget your weekly schedule[span_10](start_span)[span_10](end_span).

## 🛠️ The Tech I Learned to Put Together

I wanted this app to be fast, lightweight, and look great on a phone screen:
* **The Look and Feel:** Built using vanilla JavaScript, clean HTML5, and custom CSS[span_11](start_span)[span_11](end_span). Because I care a lot about fine details, I taught myself how to build a frosted-glass look (`backdrop-filter`), smooth loading animations, and dynamic wave motions for the navigation tabs[span_12](start_span)[span_12](end_span).
* **The AI Brains:** I used the Anthropic Claude API[span_13](start_span)[span_13](end_span). I set up a two-model approach: a fast, cheap model (`Haiku`) to handle reading the image data, and a heavy-duty model (`Sonnet`) to act as the conversational pool expert[span_14](start_span)[span_14](end_span).
* **The Hidden Backend:** Secure Netlify Serverless Functions to safely hide my AI account keys and handle daily limits so my personal budget doesn't melt from too many requests[span_15](start_span)[span_15](end_span).
* **Memory:** It uses `LocalStorage` to save your test and task history directly on your phone, meaning you don't need a heavy database setup to keep track of your past pool tests[span_16](start_span)[span_16](end_span).

## 🧠 Lessons Learned & Challenges I Handled

### 1. Training the AI to Keep It Simple
As a first-time developer, getting an AI to look at an image and give me *just* raw numbers—without a bunch of polite conversational fluff—was really tough. I learned how to use strict rules to force the AI to output a perfectly clean data layout (called a JSON object) every single time so my app's calculator could read it[span_17](start_span)[span_17](end_span):
```json
{
  "chlorine": 1.5,
  "ph": 7.4,
  "alkalinity": 100,
  "hardness": 250,
  "cyanuric": 40
}

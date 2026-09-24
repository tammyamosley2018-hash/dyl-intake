// Results page wording (DYL Terrain Model). Edit words here; scoring lives in intake-data.js.
window.COPY = {
  consultUrl: "https://calendly.com/quillaxiberry/45-minute-health-assessment-free-dyl",
  // Mirrors Tammy's ScoreApp result page (her wording), upgraded with per-system explanations.
  title: "Thank you for taking the Health Intake",
  subtitle: "Quilla will go over your results below on your call.",
  overallHeading: "Your overall score",
  foundation: "All tissue failures and chronic health issues have a foundation which starts with a stagnant and toxic lymphatic system. Because of environment and diet, the body goes through the 4 stages of health degeneration: Acute, Sub Acute, Chronic and Degeneration/Tissue Destruction and Breakdown as the last stage. When one repairs the body, it will go from Chronic, to Sub Acute, to Acute and then to Full Cellular Regeneration. Those are the steps to health as you detoxify and eat your way back to health.",
  offerTitle: "An offer just for you",
  offer: [
    "<strong>Congratulations!</strong> Your results are below… But here's the truth: a score is just a number without context. That's why I want to personally walk you through your results in a free 45-minute Body Assessment Call.",
    "<strong>You'll learn more about what's REALLY happening in your body in this 45-minute call than you have in the last 30 years of doctor visits.</strong>",
    "This is your opportunity to finally understand the ROOT CAUSE of your symptoms, discover why your body is responding this way, and get a clear roadmap for reversing your health challenges. You'll receive valuable, actionable insights whether you work with us or not. Most clients tell us this is the first time a healthcare provider has actually taken the time to explain what's going on in a way that makes sense."
  ],
  consultButton: "Yes, I want to know my root cause",
  systemsHeading: "Your body systems",
  // Same Low / Medium / High scale as ScoreApp, applied to the overall score and to each body system.
  tiers: [
    { name: "Low", from: 0, to: 10, cls: "t1" },
    { name: "Medium", from: 11, to: 30, cls: "t2" },
    { name: "High", from: 31, to: 100, cls: "t3" }
  ],

  systems: {
    thyroid: {
      what: "Sets your body's pace: temperature, metabolism, and how fast energy moves through you.",
      saying: "Cold hands and feet, a hard time getting warm, weight that comes on easy and won't leave, low energy, headaches. Your internal thermostat is running low."
    },
    parathyroid: {
      what: "Governs how your body uses calcium: bones, nails, veins, muscles, and nerves.",
      saying: "Weak nails, cramping (including period cramps), spider or varicose veins, bruising easily, low mood. Calcium may be present but not being put where it belongs."
    },
    pancreas: {
      what: "Supplies the enzymes that break your food down so your cells can actually use it.",
      saying: "Gas after eating, food that sits in your stomach, reflux, undigested food, trouble keeping weight on. You may be eating well and still not receiving it."
    },
    adrenals: {
      what: "Your stress and energy reserve. They carry you through every deadline, emergency, and sleepless night.",
      saying: "Anxiety, restless legs, poor sleep, fatigue, ringing ears, shortness of breath, \"itis\" inflammation. You may have been running on reserve for a long time."
    },
    female: {
      what: "Your cycle is a monthly report card on your whole terrain, not just your reproductive organs.",
      saying: "Cramps, heavy bleeding, and irregular cycles are signs the womb is being used as a backup exit for cellular waste. As the body cleans up during a deep detox, periods typically shorten to a pain-free, pantyliner-light few days, because the womb is no longer needed to carry that load."
    },
    male: {
      what: "Reflects circulation, hormonal strength, and how well your lower body is draining.",
      saying: "Frequent night urination, changes in drive or performance. These are circulation and drainage signals, not something to be embarrassed about."
    },
    gi: {
      what: "Where your body receives what it needs and lets go of what it doesn't.",
      saying: "Coated tongue in the morning, gas, constipation or loose stools. What you release (or don't) tells us how your terrain is flowing."
    },
    liver: {
      what: "Your body's filter and fat processor. They clean the blood and break down the fats that carry your hormones.",
      saying: "Trouble with fats or dairy, bloating, pain under the right ribs or mid-back after eating, brown \"liver\" spots, pale stools. Your filter may be backed up."
    },
    heart: {
      what: "Moves life through you. Every cell depends on this flow.",
      saying: "Chest pressure, prickly pains, pressure readings running high. Your circulation is working harder than it should have to."
    },
    skin: {
      what: "Your third kidney. When the inner exits are backed up, the body pushes out through the skin.",
      saying: "Rashes, blemishes, dryness, dandruff. Your skin is showing you what the inside is trying to release."
    },
    lymph: {
      what: "Your body's cleanup and drainage system. Every cell empties its waste into the lymph.",
      saying: "Sinus trouble, morning eye mucus, pimples or cysts, brain fog, early gray hair, hair loss. Your drainage system may be congested, and congestion shows up everywhere."
    },
    kidneys: {
      what: "Filter and release the acids and waste your body produces every day.",
      saying: "Puffy eyes in the morning, lower-back cramping, burning or frequent urination. Your body's main exit for waste may be under-filtering."
    },
    lungs: {
      what: "Take in life and release waste with every breath.",
      saying: "Difficulty taking a deep breath or pain when breathing. Your breath is showing you where the body is guarding."
    }
  }
};
